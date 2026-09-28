# GENERATED FILE - do not edit. Synced from ../../local-comfy/osmium_comfy_runner.py by
# scripts/sync-comfy-core.js. Edit the root file and re-run the sync.
"""Osmium's local ComfyUI runner (SynthDat and Comfy Bridge without a running
ComfyUI server).

Launched by Osmium or Comfy Bridge (src/comfy-local.ts) with the user's own
ComfyUI Python:

    <comfy python> -s osmium_comfy_runner.py --comfy <ComfyUI dir> [--app <name>] [-- <ComfyUI flags>]

It imports ComfyUI as a library and loads ONLY what the SynthDat workflow
needs: core nodes.py, the few comfy_extras files named in CORE_EXTRAS, and
the DSM subpackages named in DSM_SUBPACKAGES from the user's installed
custom_nodes/ComfyUI-DataSetManagerNodes (installing it there is part of the
setup, same as for server mode). None of the user's other custom node packs
are imported. Then it runs prompts through ComfyUI's own PromptExecutor with
a stub in place of the web server. Targets Anima and its finetunes (Anima
2.9B is out of scope: it has no ControlNet support).

Channels:
- stdin: one JSON request per line.
- the ORIGINAL stdout fd: one JSON reply/event per line (protocol only).
- this process's own console window (CONOUT$): everything ComfyUI and this
  script log, like ComfyUI's own terminal. fd 1/2 are pointed at it so stray
  print()s and tqdm bars can never corrupt the protocol.

Requests:  {"id": n, "cmd": "hello"|"object_info"|"node_info"|"generate"|"stop"|"logs"|"unload", ...}
Replies:   {"id": n, "ok": true, ...} or {"id": n, "ok": false, "error": "..."}
Events:    {"event": "progress", "value", "max"} / {"event": "preview", "mime", "b64"}
           / {"event": "logs", "entries": [{"t", "m"}, ...]} (new console output)
"""
import argparse
import base64
import gc
import io
import json
import os
import queue
import sys
import threading
import time
import traceback
import uuid

# ---- channels -------------------------------------------------------------
# The app that launched us (--app), for the console title and log prefix.
APP_NAME = "Osmium"
if "--app" in sys.argv[1:]:
    _i = sys.argv.index("--app")
    if _i + 1 < len(sys.argv):
        APP_NAME = sys.argv[_i + 1]

# Persistent mode (--listen-port N, Comfy Bridge's "Persist Comfy"): the
# protocol runs over a 127.0.0.1 socket instead of stdin/stdout, so this
# process outlives the app that started it and the app can reconnect later.
# One app connection at a time; when it drops, models stay loaded and the
# runner waits for the next. Only closing the console window ends it. The
# port is claimed here, before anything heavy, so a second copy started while
# one already runs exits at once.
LISTEN_PORT = 0
if "--listen-port" in sys.argv[1:]:
    _i = sys.argv.index("--listen-port")
    LISTEN_PORT = int(sys.argv[_i + 1]) if _i + 1 < len(sys.argv) else 0
_LISTENER = None
if LISTEN_PORT:
    import socket
    _LISTENER = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        _LISTENER.bind(("127.0.0.1", LISTEN_PORT))
        _LISTENER.listen(4)
    except OSError:
        sys.exit(0)  # another persistent runner already has the port

_PROTO = os.fdopen(os.dup(1), "w", encoding="utf-8", buffering=1)
_PROTO_LOCK = threading.Lock()
# Where send() writes: the stdout pipe, or the connected app's socket in
# persistent mode (None while no app is connected: events are dropped).
_OUT = None if LISTEN_PORT else _PROTO
_CLIENT = None
if os.name == "nt":
    # Open our own visible window, like ComfyUI's terminal. Launched from
    # Osmium (a GUI app) this process inherits a console with no visible
    # window, so drop whatever console it has and allocate a fresh one rather
    # than only allocating when there's none. The protocol fd was duplicated
    # above, so it survives this.
    import ctypes
    _k32 = ctypes.windll.kernel32
    _k32.FreeConsole()
    _k32.AllocConsole()
    _k32.SetConsoleTitleW(f"{APP_NAME} - Osmium Comfy" + (" (stays open)" if LISTEN_PORT else ""))
    _hwnd = _k32.GetConsoleWindow()
    if _hwnd:
        ctypes.windll.user32.ShowWindow(_hwnd, 5)  # SW_SHOW
try:
    _CON = open("CONOUT$", "w", encoding="utf-8", errors="replace", buffering=1)
    os.dup2(_CON.fileno(), 2)
except OSError:  # no console at all: log to stderr instead
    _CON = sys.stderr
os.dup2(2, 1)  # stray print()s and tqdm bars never reach the protocol fd
sys.stdout = _CON
sys.stderr = _CON


def send(obj):
    global _OUT
    line = json.dumps(obj, separators=(",", ":"))
    with _PROTO_LOCK:
        if _OUT is None:
            return
        try:
            _OUT.write(line + "\n")
            _OUT.flush()
        except (OSError, ValueError):  # the app went away mid-write
            _OUT = None


def say(msg):
    print(f"[{APP_NAME}] {msg}", flush=True)


# ---- args -----------------------------------------------------------------
argv = sys.argv[1:]
comfy_flags = []
if "--" in argv:
    cut = argv.index("--")
    argv, comfy_flags = argv[:cut], argv[cut + 1:]
ap = argparse.ArgumentParser()
ap.add_argument("--comfy", required=True)
ap.add_argument("--app", default="Osmium")
ap.add_argument("--listen-port", type=int, default=0)
opts = ap.parse_args(argv)

COMFY_DIR = os.path.abspath(opts.comfy)
PACK_DIR = os.path.join(COMFY_DIR, "custom_nodes", "ComfyUI-DataSetManagerNodes")
TESTED_COMFY_VERSION = "0.37.0"

# The comfy_extras files (besides core nodes.py) and DSM subpackages the
# SynthDat workflow's SaveImage nodes depend on. Nothing else loads. That
# includes the filename chain behind SaveImage's filename_prefix (#207 <- #37:
# rating / Danbooru Character Detect #203 / DSM Lora Loader #38), so outputs
# land in ComfyUI's output folder under the same path server mode uses.
# nodes_upscale_model.py is Comfy Bridge's optional upscale branch
# (UpscaleModelLoader + ImageUpscaleWithModel -> SaveImage 192_upscaled).
CORE_EXTRAS = ["nodes_custom_sampler.py", "nodes_primitive.py", "nodes_preview_any.py", "nodes_upscale_model.py"]
DSM_SUBPACKAGES = ["anima_lllite", "rgthree_subset", "impact_switch", "easy_lora_names", "was_text_nodes",
                   "danbooru_character_detect"]

# ComfyUI parses sys.argv once, on first import of comfy.cli_args.
sys.argv = [os.path.join(COMFY_DIR, "main.py"), "--windows-standalone-build", *comfy_flags]
sys.path.insert(0, COMFY_DIR)
os.chdir(COMFY_DIR)
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("DO_NOT_TRACK", "1")

say(f"Osmium Comfy starting from {COMFY_DIR}")
say(f"This window is {APP_NAME}'s ComfyUI. Closing it stops local generation.")

import comfy.options  # noqa: E402
comfy.options.enable_args_parsing()
from comfy.cli_args import args  # noqa: E402

if os.name == "nt" and args.cuda_device is None and args.default_device is None \
        and os.environ.get("CUDA_VISIBLE_DEVICES") is None:
    os.environ["CUDA_VISIBLE_DEVICES"] = "0"  # same single-GPU default as main.py
import cuda_malloc  # noqa: E402,F401  (sets the allocator env before torch loads)
if os.name == "nt":
    os.environ["MIMALLOC_PURGE_DELAY"] = "0"  # as main.py

# DynamicVRAM (comfy-aimdo), set up the way main.py does: this half before
# torch loads, the device half after comfy.model_management below. Without it
# models load through the legacy patcher, RAM pressure evicts the cached
# loader outputs, and every generation reloads VAE, text encoder and UNet.
from comfy.cli_args import enables_dynamic_vram  # noqa: E402
try:
    import comfy_aimdo.control  # noqa: E402
except ImportError:
    comfy_aimdo = None
if comfy_aimdo is not None and enables_dynamic_vram():
    _headroom = None if args.reserve_vram is None else int(args.reserve_vram * 1024 ** 3)
    try:
        comfy_aimdo.control.init(simple_vram_headroom=_headroom, nvml_pressure=not args.disable_nvml_pressure)
    except TypeError:
        try:
            comfy_aimdo.control.init(simple_vram_headroom=_headroom)
        except TypeError:
            comfy_aimdo.control.init()

import asyncio  # noqa: E402
import logging  # noqa: E402
import app.logger  # noqa: E402
from app.logger import setup_logger  # noqa: E402
from comfy.cli_args import get_console_log_level  # noqa: E402
setup_logger(log_level=get_console_log_level(args.verbose), use_stdout=False)

import folder_paths  # noqa: E402
import utils.extra_config  # noqa: E402

extra_cfg = os.path.join(COMFY_DIR, "extra_model_paths.yaml")
if os.path.isfile(extra_cfg):
    utils.extra_config.load_extra_path_config(extra_cfg)

import comfy.utils  # noqa: E402
import comfy.model_management  # noqa: E402
import execution  # noqa: E402
import nodes  # noqa: E402
import comfyui_version  # noqa: E402
from comfy_execution.progress import get_progress_state  # noqa: E402
from comfy_execution.utils import get_executing_context  # noqa: E402

import comfy.memory_management  # noqa: E402
import comfy.model_patcher  # noqa: E402


def setup_dynamic_vram():
    """main.py's device half of the DynamicVRAM setup."""
    mm = comfy.model_management
    supported = mm.is_nvidia() or (mm.is_amd() and getattr(mm, "rocm_version", (0, 0)) >= (7, 14))
    if comfy_aimdo is None or not (args.enable_dynamic_vram or (enables_dynamic_vram() and supported)):
        return
    if not args.enable_dynamic_vram and mm.torch_version_numeric < (2, 8):
        return
    devices = mm.get_all_torch_devices()
    try:
        ok = comfy_aimdo.control.init_devices((d.index, int(args.vram_headroom * 1024 ** 3)) for d in devices)
    except TypeError:
        ok = comfy_aimdo.control.init_devices(d.index for d in devices)
    if ok:
        comfy_aimdo.control.set_log_info()
        comfy.model_patcher.CoreModelPatcher = comfy.model_patcher.ModelPatcherDynamic
        comfy.memory_management.aimdo_enabled = True
        logging.info("DynamicVRAM support detected and enabled")
    else:
        logging.warning("No working comfy-aimdo install detected. DynamicVRAM support disabled.")


setup_dynamic_vram()

if comfyui_version.__version__ != TESTED_COMFY_VERSION:
    say(f"Warning: built against ComfyUI {TESTED_COMFY_VERSION}, this is {comfyui_version.__version__}.")


# ---- node loading ---------------------------------------------------------
def load_nodes():
    loop = asyncio.new_event_loop()
    try:
        for name in CORE_EXTRAS:
            path = os.path.join(COMFY_DIR, "comfy_extras", name)
            if not loop.run_until_complete(nodes.load_custom_node(path, module_parent="comfy_extras")):
                raise RuntimeError(f"Could not load ComfyUI's comfy_extras/{name}")
    finally:
        loop.close()

    # The DSM subpackages, imported under a stand-in parent package so the
    # pack's own __init__ (which imports every subpackage, including the WAS
    # text nodes that pull in transformers) never runs.
    import importlib
    import types
    if not os.path.isdir(PACK_DIR):
        raise RuntimeError(f"ComfyUI-DataSetManagerNodes is not installed in {os.path.dirname(PACK_DIR)}")
    parent = types.ModuleType("osmium_dsm")
    parent.__path__ = [PACK_DIR]
    sys.modules["osmium_dsm"] = parent
    for sub in DSM_SUBPACKAGES:
        mod = importlib.import_module(f"osmium_dsm.{sub}")
        nodes.NODE_CLASS_MAPPINGS.update(getattr(mod, "NODE_CLASS_MAPPINGS", {}))
    # What the pack's __init__ would have done: its bundled ControlNet weights.
    folder_paths.add_model_folder_path("controlnet", os.path.join(PACK_DIR, "models", "controlnet"))


# ---- server stand-in ------------------------------------------------------
class StubServer:
    """The five members ComfyUI's executor needs from its web server
    (comfy_execution/server_protocol.py). Status events are kept for error
    reporting; progress and previews go out through progress_hook."""

    def __init__(self):
        self.client_id = "osmium"
        self.last_node_id = None
        self.last_prompt_id = None
        self.sockets_metadata = {}
        self.messages = []

    def send_sync(self, event, data, sid=None):
        if isinstance(event, str):
            self.messages.append((event, data))
            if event == "executing" and isinstance(data, dict):
                self.last_node_id = data.get("node")

    def queue_updated(self):
        pass


SERVER = StubServer()

# The job queue the main loop works through: the app's requests, and (Persist
# Comfy + phone sharing) the phone's /prompt jobs from the share server below.
JOBS = queue.Queue()
# The running job's phone client id when the job came from the share server,
# so its progress/preview go to that phone's websocket instead of the app.
_JOB_CLIENT = None


def progress_hook(value, total, preview_image, prompt_id=None, node_id=None):
    ctx = get_executing_context()
    if node_id is None:
        node_id = ctx.node_id if ctx is not None else SERVER.last_node_id
    comfy.model_management.throw_exception_if_processing_interrupted()
    get_progress_state().update_progress(node_id, value, total, preview_image)
    if _JOB_CLIENT is not None:
        SHARE.to_client(_JOB_CLIENT, text=json.dumps({"type": "progress", "data": {"value": value, "max": total}}))
    else:
        send({"event": "progress", "value": value, "max": total})
    if preview_image is not None:
        fmt, img, max_size = preview_image
        try:
            if max_size is not None:
                img = img.copy()
                img.thumbnail((max_size, max_size))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            if _JOB_CLIENT is not None:
                # ComfyUI's binary preview frame: event 1, image type 1 = JPEG.
                SHARE.to_client(_JOB_CLIENT, binary=(1).to_bytes(4, "big") + (1).to_bytes(4, "big") + buf.getvalue())
            else:
                send({"event": "preview", "mime": "image/jpeg", "b64": base64.b64encode(buf.getvalue()).decode("ascii")})
        except Exception:  # a preview is never worth failing a generation over
            pass


# ---- phone share server (Persist Comfy) -------------------------------------
class ShareServer:
    """The slice of ComfyUI's HTTP + websocket API the Comfy Bridge Android
    app uses, served by this runner itself, so the phone keeps working after
    Comfy Bridge closes (the app's own relay, local-relay.ts, dies with the
    app). Same endpoints as local-relay.ts; started and stopped by the app's
    "share" command. aiohttp is ComfyUI's own dependency. Binds 0.0.0.0 like
    ComfyUI's --listen, with no auth; CORS is open for the phone's WebView."""

    KEEP = 12

    def __init__(self):
        self.loop = None
        self.runner = None
        self.port = 0
        self.sockets = {}      # client id -> WebSocketResponse
        self.log_subs = set()  # client ids streaming the console
        self.uploads = {}      # name -> bytes
        self.history = {}      # prompt id -> /history record ({} while running)
        self.views = {}        # "subfolder/filename" -> bytes
        self.number = 0

    def _ensure_loop(self):
        if self.loop is None:
            self.loop = asyncio.new_event_loop()
            threading.Thread(target=self.loop.run_forever, daemon=True).start()

    def start(self, port):
        """(ok, error). Restarts on a different port; a no-op on the same one."""
        if self.runner is not None and self.port == port:
            return True, ""
        self.stop()
        self._ensure_loop()
        try:
            asyncio.run_coroutine_threadsafe(self._start(port), self.loop).result(15)
        except OSError as err:
            self.runner = None
            return False, f"Port {port} is already in use." if getattr(err, "errno", None) in (98, 10048) else str(err)
        except Exception as err:  # noqa: BLE001
            self.runner = None
            return False, str(err)
        self.port = port
        say(f"Serving the phone app on port {port} (every network this PC is on). It keeps working after {APP_NAME} closes.")
        return True, ""

    def stop(self):
        if self.runner is None:
            return
        try:
            asyncio.run_coroutine_threadsafe(self.runner.cleanup(), self.loop).result(10)
        except Exception:  # noqa: BLE001
            pass
        self.runner, self.port = None, 0
        self.sockets.clear()
        self.log_subs.clear()
        say("Stopped serving the phone app.")

    async def _start(self, port):
        from aiohttp import web

        @web.middleware
        async def cors(request, handler):
            if request.method == "OPTIONS":
                resp = web.Response(status=204)
            else:
                try:
                    resp = await handler(request)
                except web.HTTPException as exc:
                    resp = exc
            if not getattr(resp, "prepared", False):
                resp.headers["Access-Control-Allow-Origin"] = "*"
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
                resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
            return resp

        def err(status, message):
            return web.json_response({"error": {"message": message}}, status=status)

        async def object_info(request):
            cls = request.match_info["cls"]
            r = await asyncio.get_running_loop().run_in_executor(None, cmd_node_info, {"class_type": cls})
            if not r.get("ok"):
                return err(404, r.get("error", ""))
            return web.json_response({cls: {"input": r["input"], "name": cls}})

        async def upload(request):
            data = await request.post()
            f = data.get("image")
            if f is None or not hasattr(f, "file"):
                return err(400, "No image in the upload.")
            name = (getattr(f, "filename", "") or "upload.png").replace("/", "_").replace("\\", "_")
            self.uploads[name] = f.file.read()
            while len(self.uploads) > self.KEEP:
                self.uploads.pop(next(iter(self.uploads)))
            return web.json_response({"name": name, "subfolder": "", "type": "input"})

        async def prompt(request):
            try:
                body = await request.json()
            except ValueError:
                return err(400, "Invalid JSON.")
            graph = body.get("prompt") if isinstance(body, dict) else None
            if not isinstance(graph, dict):
                return err(400, "No prompt in the request.")
            ref = ((graph.get("239") or {}).get("inputs") or {}).get("image")
            ref_bytes = self.uploads.get(ref) if isinstance(ref, str) else None
            pid = str(uuid.uuid4())
            self.history[pid] = {}
            while len(self.history) > self.KEEP:
                self.history.pop(next(iter(self.history)))
            self.number += 1
            JOBS.put({"cmd": "generate", "prompt": graph, "_http": pid, "_client": str(body.get("client_id") or ""),
                      "image_b64": base64.b64encode(ref_bytes).decode("ascii") if ref_bytes else None})
            return web.json_response({"prompt_id": pid, "number": self.number, "node_errors": {}})

        async def history(request):
            pid = request.match_info["pid"]
            rec = self.history.get(pid)
            return web.json_response({pid: rec} if rec else {})

        async def view(request):
            key = f"{request.query.get('subfolder', '')}/{request.query.get('filename', '')}"
            data = self.views.get(key)
            if data is None:
                return err(404, "No such image.")
            return web.Response(body=data, content_type="image/png")

        async def interrupt(_request):
            comfy.model_management.interrupt_current_processing(True)
            return web.json_response({})

        async def logs_raw(_request):
            return web.json_response({"entries": list(app.logger.get_logs() or []), "size": {}})

        async def logs_subscribe(request):
            try:
                body = await request.json()
            except ValueError:
                body = {}
            cid = str(body.get("clientId") or "")
            if cid:
                (self.log_subs.discard if body.get("enabled") is False else self.log_subs.add)(cid)
            return web.json_response({})

        async def ws(request):
            sock = web.WebSocketResponse()
            await sock.prepare(request)
            cid = request.query.get("clientId") or str(uuid.uuid4())
            self.sockets[cid] = sock
            await sock.send_str(json.dumps({"type": "status", "data": {"status": {"exec_info": {"queue_remaining": 0}}, "sid": cid}}))
            try:
                async for _msg in sock:  # the phone's feature_flags etc.: nothing to do
                    pass
            finally:
                if self.sockets.get(cid) is sock:
                    self.sockets.pop(cid, None)
                    self.log_subs.discard(cid)
            return sock

        async def root(_request):
            return web.json_response({"relay": f"{APP_NAME} Local ComfyUI", "system": {"comfyui_version": comfyui_version.__version__}})

        webapp = web.Application(middlewares=[cors], client_max_size=64 * 1024 * 1024)
        webapp.router.add_get("/object_info/{cls}", object_info)
        webapp.router.add_post("/upload/image", upload)
        webapp.router.add_post("/prompt", prompt)
        webapp.router.add_get("/history/{pid}", history)
        webapp.router.add_get("/view", view)
        webapp.router.add_post("/interrupt", interrupt)
        webapp.router.add_get("/internal/logs/raw", logs_raw)
        webapp.router.add_route("PATCH", "/internal/logs/subscribe", logs_subscribe)
        webapp.router.add_get("/ws", ws)
        webapp.router.add_get("/", root)
        webapp.router.add_get("/system_stats", root)
        webapp.router.add_route("OPTIONS", "/{tail:.*}", root)
        runner = web.AppRunner(webapp, access_log=None)
        await runner.setup()
        try:
            await web.TCPSite(runner, "0.0.0.0", port).start()
        except BaseException:
            await runner.cleanup()
            raise
        self.runner = runner

    def to_client(self, cid, text=None, binary=None):
        sock = self.sockets.get(cid)
        if sock is None or self.loop is None or sock.closed:
            return
        coro = sock.send_str(text) if text is not None else sock.send_bytes(binary)
        asyncio.run_coroutine_threadsafe(coro, self.loop)

    def logs(self, entries):
        if not self.log_subs or self.loop is None:
            return
        msg = json.dumps({"type": "logs", "data": {"entries": entries, "size": {}}})
        for cid in list(self.log_subs):
            self.to_client(cid, text=msg)

    def finish(self, pid, reply):
        """A phone job's result -> its /history record (+ images for /view)."""
        if not reply.get("ok"):
            self.history[pid] = {"status": {"status_str": "error", "completed": False,
                                            "messages": [["execution_error", {"exception_message": reply.get("error", "")}]]},
                                 "outputs": {}}
            return
        outputs = {}
        paths = reply.get("paths") or {}
        for nid, b64 in (reply.get("images") or {}).items():
            rel = (paths.get(nid) or f"{pid}_{nid}.png").replace("\\", "/")
            sub, _, fname = rel.rpartition("/")
            self.views[f"{sub}/{fname}"] = base64.b64decode(b64)
            outputs[nid] = {"images": [{"filename": fname, "subfolder": sub, "type": "output"}]}
        while len(self.views) > self.KEEP * 3:
            self.views.pop(next(iter(self.views)))
        self.history[pid] = {"status": {"status_str": "success", "completed": True, "messages": []}, "outputs": outputs}


SHARE = ShareServer()


# ---- prompt preparation ---------------------------------------------------
def is_link(v):
    return isinstance(v, list) and len(v) == 2 and isinstance(v[0], str)


def is_capture(node):
    """An output node whose image goes back to the app: every SaveImage, and a
    PreviewImage that Comfy Bridge marked `_meta.capture` — its outputs when
    the user wants no copy in ComfyUI's output folder (the image then only
    exists in ComfyUI's temp folder until the Bridge saves it). The template's
    own PreviewImages carry no mark and stay pruned as UI-only."""
    ct = node.get("class_type")
    return ct == "SaveImage" or (ct == "PreviewImage" and bool((node.get("_meta") or {}).get("capture")))


def prepare(prompt):
    """Prune every node the captured outputs don't depend on (the UI-only
    PreviewImages). SaveImage runs as-is, filename chain included, exactly as
    it would on a ComfyUI server."""
    out = prompt
    captures = [nid for nid, node in prompt.items() if is_capture(node)]
    if not captures:
        raise ValueError("The workflow has no SaveImage node to return an image from.")
    keep, stack = set(), list(captures)
    while stack:
        nid = stack.pop()
        if nid in keep:
            continue
        if nid not in out:
            raise ValueError(f"The workflow references node {nid}, which is missing.")
        keep.add(nid)
        stack.extend(v[0] for v in out[nid]["inputs"].values() if is_link(v))
    pruned = {nid: out[nid] for nid in keep}
    missing = sorted({n["class_type"] for n in pruned.values() if n["class_type"] not in nodes.NODE_CLASS_MAPPINGS})
    if missing:
        raise ValueError("Node types not available to the local runner: " + ", ".join(missing))
    return pruned, captures


# ---- commands -------------------------------------------------------------
EXECUTOR = None


def cmd_object_info(req):
    cls = nodes.NODE_CLASS_MAPPINGS.get(req["class_type"])
    if cls is None:
        return {"ok": False, "error": f"{req['class_type']} is not loaded in the local runner."}
    types_ = cls.INPUT_TYPES()
    for section in ("required", "optional"):
        spec = (types_.get(section) or {}).get(req["input"])
        if spec is None:
            continue
        head = spec[0]
        if isinstance(head, (list, tuple)):
            return {"ok": True, "values": list(head)}
        if head == "COMBO" and len(spec) > 1:
            return {"ok": True, "values": list(spec[1].get("options", []))}
    return {"ok": False, "error": f'Could not find "{req["input"]}" on {req["class_type"]}.'}


def _json_safe(v):
    try:
        json.dumps(v)
        return v
    except (TypeError, ValueError):
        return str(v)


def cmd_node_info(req):
    """A node's inputs in /object_info's shape ({"required": {...}, "optional":
    {...}}), so Comfy Bridge's network relay can answer /object_info/<class>
    for a phone. Combo lists are kept; other specs are made JSON-safe."""
    cls = nodes.NODE_CLASS_MAPPINGS.get(req["class_type"])
    if cls is None:
        return {"ok": False, "error": f"{req['class_type']} is not loaded in the local runner."}
    out = {}
    for section, specs in (cls.INPUT_TYPES() or {}).items():
        if section not in ("required", "optional") or not isinstance(specs, dict):
            continue
        out[section] = {}
        for name, spec in specs.items():
            spec = list(spec) if isinstance(spec, (list, tuple)) else [spec]
            head = spec[0] if spec else None
            if isinstance(head, (list, tuple)):
                head = [_json_safe(x) for x in head]
            else:
                head = _json_safe(head)
            opts = spec[1] if len(spec) > 1 and isinstance(spec[1], dict) else None
            out[section][name] = [head] + ([{k: _json_safe(v) for k, v in opts.items()}] if opts else [])
    return {"ok": True, "input": out}


def cmd_generate(req):
    global EXECUTOR
    prompt, captures = prepare(req["prompt"])
    ref_path = None
    if req.get("image_b64") and "239" in prompt:
        # LoadImage reads from ComfyUI's input folder; the copy is removed
        # again after the run.
        name = f"osmium_ref_{uuid.uuid4().hex[:8]}.png"
        ref_path = os.path.join(folder_paths.get_input_directory(), name)
        with open(ref_path, "wb") as f:
            f.write(base64.b64decode(req["image_b64"]))
        prompt["239"]["inputs"]["image"] = name
    try:
        return run_prompt(prompt, captures)
    finally:
        if ref_path:
            try:
                os.remove(ref_path)
            except OSError:
                pass


def saved_image(node_id):
    """The file a SaveImage node just wrote (from the executor's history, the
    same record a server's /history returns), as (bytes, path relative to
    ComfyUI's output folder)."""
    outputs = (EXECUTOR.history_result or {}).get("outputs", {})
    images = (outputs.get(node_id) or {}).get("images") or []
    if not images:
        return None
    img = images[0]
    base = folder_paths.get_directory_by_type(img.get("type") or "output")
    path = os.path.join(base, img.get("subfolder") or "", img["filename"])
    with open(path, "rb") as f:
        return f.read(), os.path.relpath(path, base)


def run_prompt(prompt, captures):
    global EXECUTOR
    SERVER.messages = []
    if EXECUTOR is None:
        # Same defaults as main.py's prompt_worker.
        total = comfy.model_management.total_ram / 1024.0
        EXECUTOR = execution.PromptExecutor(SERVER, cache_type=execution.CacheType.RAM_PRESSURE, cache_args={
            "lru": 0, "ram": min(10.0, max(2.0, total * 0.10)), "ram_inactive": min(128.0, total)})
    prompt_id = str(uuid.uuid4())
    SERVER.last_prompt_id = prompt_id
    started = time.perf_counter()
    say(f"Generating ({len(prompt)} nodes)...")
    EXECUTOR.execute(prompt, prompt_id, {"client_id": SERVER.client_id, "preview_method": "taesd"}, captures)
    for event, data in SERVER.messages:
        if event == "execution_interrupted":
            say("Stopped.")
            return {"ok": False, "error": "Generation stopped.", "interrupted": True}
        if event == "execution_error":
            say(f"Error in {data.get('node_type')}: {data.get('exception_message')}")
            return {"ok": False, "error": f"{data.get('node_type')} failed: {str(data.get('exception_message', '')).strip()}"}
    saved = {nid: saved_image(nid) for nid in captures} if EXECUTOR.success else {}
    saved = {nid: s for nid, s in saved.items() if s}
    if not saved:
        return {"ok": False, "error": "The local runner finished without producing an image."}
    for nid, (_bytes, rel) in saved.items():
        say(f"Saved {rel}")
    say("Done in {:.1f}s".format(time.perf_counter() - started))
    return {"ok": True,
            "images": {nid: base64.b64encode(b).decode("ascii") for nid, (b, _rel) in saved.items()},
            "paths": {nid: rel.replace(os.sep, "/") for nid, (_b, rel) in saved.items()}}


def cmd_unload(_req):
    global EXECUTOR
    comfy.model_management.unload_all_models()
    EXECUTOR = None
    comfy.model_management.soft_empty_cache()
    say("Models unloaded.")
    return {"ok": True}


COMMANDS = {
    "hello": lambda _r: {"ok": True, "comfy_version": comfyui_version.__version__, "comfy_dir": COMFY_DIR},
    "object_info": cmd_object_info,
    "node_info": cmd_node_info,
    "generate": cmd_generate,
    "unload": cmd_unload,
}


def main():
    load_nodes()
    comfy.utils.set_progress_bar_global_hook(progress_hook)
    # The console output ComfyUI's logger buffers (its /internal/logs on a
    # server): new lines go out as events, e.g. to a phone's ComfyUI Terminal.
    def on_logs(entries):
        if entries:
            send({"event": "logs", "entries": entries})
            SHARE.logs(entries)

    app.logger.on_flush(on_logs)
    say(f"Ready (ComfyUI {comfyui_version.__version__}, device {comfy.model_management.get_torch_device_name(comfy.model_management.get_torch_device())}).")
    ready = {"event": "ready", "comfy_version": comfyui_version.__version__, "comfy_dir": COMFY_DIR}

    jobs = JOBS

    def reader(stream, on_end):
        for line in stream:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
            except ValueError:
                continue
            if req.get("cmd") == "stop":  # must not wait behind the running job
                comfy.model_management.interrupt_current_processing(True)
                send({"id": req.get("id"), "ok": True})
            elif req.get("cmd") == "logs":  # nor must reading the log
                send({"id": req.get("id"), "ok": True, "entries": list(app.logger.get_logs() or [])})
            elif req.get("cmd") == "share":  # the phone share server: port, or 0 = off
                port = int(req.get("port") or 0)
                if port:
                    ok, error = SHARE.start(port)
                else:
                    SHARE.stop()
                    ok, error = True, ""
                send({"id": req.get("id"), "ok": ok, "error": error, "port": SHARE.port})
            else:
                jobs.put(req)
        on_end()

    def serve_clients():
        # Persistent mode: one app at a time; a new connection replaces the
        # old one. Each gets its own "ready" as soon as it connects.
        global _OUT, _CLIENT
        while True:
            conn, _addr = _LISTENER.accept()
            conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            rf = conn.makefile("r", encoding="utf-8", newline="\n")
            wf = conn.makefile("w", encoding="utf-8", newline="\n")
            with _PROTO_LOCK:
                old, _CLIENT, _OUT = _CLIENT, conn, wf
            if old is not None:
                try:
                    old.close()
                except OSError:
                    pass
            say(f"{APP_NAME} connected.")
            send(ready)

            def ended(c=conn):
                global _OUT, _CLIENT
                with _PROTO_LOCK:
                    current = _CLIENT is c
                    if current:
                        _CLIENT, _OUT = None, None
                # Outside the lock: printing flushes the log, and the log
                # listener calls send(), which takes the same lock.
                if current:
                    say(f"{APP_NAME} disconnected. Staying open with the models loaded; close this window to stop it.")

            threading.Thread(target=reader, args=(rf, ended), daemon=True).start()

    if LISTEN_PORT:
        say(f"Staying open for {APP_NAME} on 127.0.0.1:{LISTEN_PORT} until this window is closed.")
        threading.Thread(target=serve_clients, daemon=True).start()
    else:
        send(ready)
        threading.Thread(target=reader, args=(sys.stdin, lambda: jobs.put(None)), daemon=True).start()  # pipe closed: exit
    global _JOB_CLIENT
    while True:
        req = jobs.get()
        if req is None:
            break
        handler = COMMANDS.get(req.get("cmd"))
        # A phone job (share server): its events go to that phone's websocket.
        _JOB_CLIENT = req.get("_client") if "_http" in req else None
        try:
            reply = handler(req) if handler else {"ok": False, "error": f"Unknown command {req.get('cmd')}"}
        except Exception as err:
            traceback.print_exc()
            reply = {"ok": False, "error": str(err), "trace": traceback.format_exc()[-2000:]}
        finally:
            comfy.model_management.interrupt_current_processing(False)
            _JOB_CLIENT = None
        if "_http" in req:
            SHARE.finish(req["_http"], reply)
        else:
            reply["id"] = req.get("id")
            send(reply)
        if req.get("cmd") == "generate":
            # After replying, like main.py's prompt_worker after a prompt.
            # Cached node outputs (the loaded models) stay in the executor.
            gc.collect()
            comfy.model_management.soft_empty_cache()
    say(f"{APP_NAME} disconnected; exiting.")


if __name__ == "__main__":
    main()
