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
import re
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

# Lifecycle log: <ComfyUI>/user/osmium_runner.log, a few lines per session —
# start, app connect/disconnect, phone requests, and HOW the process ended
# (console window closed, logoff/shutdown, normal exit, crash). Added after a
# kept-open runner kept vanishing with nothing in comfyui_detail.log to say
# why. Best effort: never lets a logging failure reach the runner.
_LIFE_PATH = None
if "--comfy" in sys.argv[1:]:
    _i = sys.argv.index("--comfy")
    if _i + 1 < len(sys.argv):
        _LIFE_PATH = os.path.join(os.path.abspath(sys.argv[_i + 1]), "user", "osmium_runner.log")


def life(msg):
    if not _LIFE_PATH:
        return
    try:
        os.makedirs(os.path.dirname(_LIFE_PATH), exist_ok=True)
        if os.path.exists(_LIFE_PATH) and os.path.getsize(_LIFE_PATH) > 2 * 1024 * 1024:
            os.replace(_LIFE_PATH, _LIFE_PATH + ".old")
        with open(_LIFE_PATH, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} [{APP_NAME} pid {os.getpid()}] {msg}\n")
    except OSError:
        pass


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
        life(f"port {LISTEN_PORT} already taken (another kept-open runner is up); exiting")
        sys.exit(0)  # another persistent runner already has the port
life(f"started ({'kept open on 127.0.0.1:' + str(LISTEN_PORT) if LISTEN_PORT else 'pipe mode'})")

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
    # QuickEdit off for this console: a click in it would start a selection
    # ("Select ..." in the title), and while one is up every write to the
    # console blocks, freezing startup, generations and new app connections
    # until Esc. Reproduced with a runner stuck mid-startup on a stray click.
    _k32.CreateFileW.restype = ctypes.c_void_p
    _k32.GetConsoleMode.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint32)]
    _k32.SetConsoleMode.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
    _conin = _k32.CreateFileW("CONIN$", 0xC0000000, 3, None, 3, 0, None)  # GENERIC_READ|WRITE, share R|W, OPEN_EXISTING
    _mode = ctypes.c_uint32()
    if _conin and _conin != ctypes.c_void_p(-1).value and _k32.GetConsoleMode(_conin, ctypes.byref(_mode)):
        _k32.SetConsoleMode(_conin, (_mode.value | 0x80) & ~0x40)  # +ENABLE_EXTENDED_FLAGS, -ENABLE_QUICK_EDIT_MODE

    # Record why the console is ending us (closing its window is the only
    # intended way to stop a kept-open runner). Kept in a global so the
    # callback isn't garbage-collected; returns False to let Windows proceed.
    _CTRL_NAMES = {0: "Ctrl+C", 1: "Ctrl+Break", 2: "console window closed", 5: "user logoff", 6: "system shutdown"}

    @ctypes.WINFUNCTYPE(ctypes.c_int, ctypes.c_uint)
    def _on_console_ctrl(kind):
        life(f"ending: {_CTRL_NAMES.get(kind, 'console event ' + str(kind))}")
        return 0

    _k32.SetConsoleCtrlHandler(_on_console_ctrl, 1)

import atexit  # noqa: E402
import faulthandler  # noqa: E402

atexit.register(lambda: life("exited normally"))
threading.excepthook = lambda a: life(f"thread {a.thread.name if a.thread else '?'} crashed: {a.exc_type.__name__}: {a.exc_value}")
if _LIFE_PATH:
    try:
        _FAULT_FILE = open(_LIFE_PATH, "a", encoding="utf-8")
        faulthandler.enable(_FAULT_FILE)  # hard crashes (segfaults) write their stack here
    except OSError:
        pass
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
ap.add_argument("--attention", default="auto")
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

# Attention backend, the app's "Attention" setting (--attention). ComfyUI picks
# sage > flash > xformers > pytorch from its flags; the VAE keeps xformers
# unless pytorch is chosen. "auto" = FlashAttention when the install has
# flash-attn, else ComfyUI's own default (xformers when installed). A chosen
# backend whose package is missing falls back to auto with a warning.
# find_spec only looks a package up, it doesn't import torch.
import importlib.util  # noqa: E402
ATTN_MODES = {"flash": ("flash_attn", ["--use-flash-attention"]),
              "sage": ("sageattention", ["--use-sage-attention"]),
              "xformers": ("xformers", []),
              "pytorch": (None, ["--use-pytorch-cross-attention", "--disable-xformers"])}
ATTN_NOTE = ""
_ATTN_FLAGS = {"--use-split-cross-attention", "--use-quad-cross-attention", "--use-pytorch-cross-attention",
               "--use-sage-attention", "--use-flash-attention", "--use-ck-attention"}
if not _ATTN_FLAGS.intersection(comfy_flags):
    _mode = opts.attention if opts.attention in ATTN_MODES else "auto"
    _pkg = ATTN_MODES[_mode][0] if _mode != "auto" else None
    if _pkg and importlib.util.find_spec(_pkg) is None:
        ATTN_NOTE = f"Attention '{_mode}' needs the {_pkg} package, which this ComfyUI doesn't have; using auto."
        _mode = "auto"
    if _mode == "auto":
        if importlib.util.find_spec("flash_attn") is not None:
            comfy_flags.append("--use-flash-attention")
    else:
        comfy_flags.extend(ATTN_MODES[_mode][1])

# ComfyUI parses sys.argv once, on first import of comfy.cli_args.
sys.argv =[os.path.join(COMFY_DIR, "main.py"), "--windows-standalone-build", *comfy_flags]
sys.path.insert(0, COMFY_DIR)
os.chdir(COMFY_DIR)
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("DO_NOT_TRACK", "1")

say(f"Osmium Comfy starting from {COMFY_DIR}")
say(f"This window is {APP_NAME}'s ComfyUI. Closing it stops local generation.")
if ATTN_NOTE:
    say(ATTN_NOTE)

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


# Optional packs (Comfy Bridge's USDU upscale, 2026-10-17): loaded from the
# user's custom_nodes the first time a prompt or a model list needs one of
# their nodes, so startup is unchanged and a missing pack only matters to the
# feature that uses it.
OPTIONAL_PACKS = {"UltimateSDUpscale": "ComfyUI_UltimateSDUpscale", "WD14Tagger|pysssss": "ComfyUI-WD14-Tagger"}
_OPTIONAL_TRIED = set()
_OPTIONAL_LOCK = threading.Lock()


class _PackServerShim:
    """PromptServer.instance for packs that touch it at import (WD14's pysssss
    registers a route and asks `supports`; listing custom_nodes_from_web stops
    it copying its JS into ComfyUI's web folder). client_id None turns its
    status messages off."""
    supports = {"custom_nodes_from_web"}
    client_id = None

    def __init__(self):
        from aiohttp import web
        self.routes = web.RouteTableDef()

    def send_sync(self, *a, **k):
        pass

    async def send(self, *a, **k):
        pass


def ensure_optional_nodes(class_types):
    for ct in class_types:
        pack = OPTIONAL_PACKS.get(ct)
        if not pack or ct in nodes.NODE_CLASS_MAPPINGS:
            continue
        with _OPTIONAL_LOCK:
            if pack in _OPTIONAL_TRIED:
                continue
            _OPTIONAL_TRIED.add(pack)
            path = os.path.join(COMFY_DIR, "custom_nodes", pack)
            if not os.path.isdir(path):
                continue
            import server
            if getattr(server.PromptServer, "instance", None) is None:
                server.PromptServer.instance = _PackServerShim()
            # Own thread + loop: callers include the share server's executor
            # threads, where a loop may already be running.
            result = {}

            def load():
                loop = asyncio.new_event_loop()
                try:
                    result["ok"] = loop.run_until_complete(nodes.load_custom_node(path))
                finally:
                    loop.close()
            t = threading.Thread(target=load, daemon=True)
            t.start()
            t.join()
            say(f"Loaded {pack}." if result.get("ok") else f"Could not load {pack} (see the log above).")


def missing_node_hint(class_type):
    pack = OPTIONAL_PACKS.get(class_type)
    return f"{class_type} (install {pack} in ComfyUI's custom_nodes)" if pack else class_type


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


# ---- gallery over the share server (2026-10-12) ------------------------------
# The phone can browse the app's own picked output folder through the share
# server: list/read/thumbnail. The share command carries the folder (root=);
# the routes confine everything inside it — the same sanitizer shape the
# Bridge's desktop handlers use (no `..`, no drive anchors, realpath checked).
GALLERY_IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")
GALLERY_MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
GALLERY_THUMB_CACHE = {}  # (abs, side, mtime) -> (bytes, mime)


def gallery_safe_join(root, rel=""):
    raw = (rel or "").replace("\\", "/").replace("/+", "/")
    parts = [p for p in raw.split("/") if p and p != "." and p != ".." and not re.match(r"^[A-Za-z]:$", p)]
    abs = root if not parts else os.path.join(root, *parts)
    real_root = os.path.realpath(root)
    probe = abs
    while not os.path.exists(probe):
        parent = os.path.dirname(probe)
        if parent == probe:
            break
        probe = parent
    real_probe = os.path.realpath(probe)
    if real_probe != real_root and not real_probe.startswith(real_root + os.sep):
        raise ValueError("Invalid path.")
    return abs


def gallery_list(root, rel):
    abs = gallery_safe_join(root, rel)
    entries = []
    for name in sorted(os.listdir(abs), key=str.lower):
        full = os.path.join(abs, name)
        ext = os.path.splitext(name)[1].lower()
        kind = "directory" if os.path.isdir(full) else ("file" if ext in GALLERY_IMAGE_EXTENSIONS else None)
        if kind is None:
            continue
        try:
            mtime = int(os.path.getmtime(full) * 1000)
        except OSError:
            mtime = 0
        entries.append({"name": name, "kind": kind, "mtime": mtime})
    return entries


def gallery_readable(rel_path):
    return os.path.splitext(rel_path)[1].lower() in GALLERY_IMAGE_EXTENSIONS


def gallery_read_bytes(abs):
    ext = os.path.splitext(abs)[1].lower()
    if ext not in GALLERY_IMAGE_EXTENSIONS:
        raise ValueError("Not an image file.")
    with open(abs, "rb") as f:
        return f.read(), GALLERY_MIME[ext]


def gallery_thumb_bytes(abs, side):
    """A small JPEG for the phone's grid; Pillow is ComfyUI's own dependency.
    Cached by (path, side, mtime) so scrolling doesn't re-encode."""
    side = max(64, min(int(side or 320), 1024))
    try:
        mtime = int(os.path.getmtime(abs) * 1000)
    except OSError:
        mtime = 0
    key = (abs, side, mtime)
    hit = GALLERY_THUMB_CACHE.get(key)
    if hit is not None:
        while len(GALLERY_THUMB_CACHE) > 600:
            GALLERY_THUMB_CACHE.pop(next(iter(GALLERY_THUMB_CACHE)))
        return hit
    from PIL import Image  # ComfyUI's own dependency; imported lazily.
    with Image.open(abs) as im:
        im = im.convert("RGB")
        w, h = im.size
        scale = side / max(w, h) if max(w, h) > side else 1.0
        if scale < 1.0:
            im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=72)
    out = (buf.getvalue(), "image/jpeg")
    while len(GALLERY_THUMB_CACHE) > 600:
        GALLERY_THUMB_CACHE.pop(next(iter(GALLERY_THUMB_CACHE)))
    GALLERY_THUMB_CACHE[key] = out
    return out


# ---- LoRA file metadata (Comfy Bridge's Metadata tab / LoRA lookup) ----------
# A LoRA named like ComfyUI's own lists ("style/foo.safetensors") is resolved
# by ComfyUI's folder_paths — only files in its configured loras folders can
# be read. A .safetensors header is <u64 LE length><JSON>; its __metadata__ is
# the trainer's record (kohya ss_*, modelspec.*). The SHA-256 of the whole
# file is what CivitAI (AutoV2 = its first 10 hex) and CivArchive look up;
# cached per (path, size, mtime) since hashing reads the whole file.
LORA_SHA_CACHE = {}
LORA_META_KEYS = ("ss_output_name", "modelspec.title", "modelspec.architecture", "ss_base_model_version",
                  "ss_sd_model_name", "modelspec.trigger_phrase", "modelspec.description", "ss_training_comment",
                  "ss_network_module", "ss_network_dim", "ss_network_alpha", "ss_num_epochs", "ss_epoch",
                  "ss_steps", "ss_resolution", "modelspec.resolution", "ss_learning_rate", "ss_optimizer")


def lora_info(name):
    import hashlib
    name = str(name or "")
    path = folder_paths.get_full_path("loras", name) if name else None
    if not path or not os.path.isfile(path):
        raise LookupError(f"Not in this PC's ComfyUI loras folders: {name}")
    st = os.stat(path)
    out = {"name": name, "file": os.path.basename(path), "size": st.st_size, "meta": {}, "top_tags": [], "sha256": ""}
    if path.lower().endswith(".safetensors"):
        with open(path, "rb") as f:
            n = int.from_bytes(f.read(8), "little")
            if 0 < n <= 100 * 1024 * 1024:
                try:
                    header = json.loads(f.read(n).decode("utf-8", "replace"))
                except ValueError:
                    header = {}
                meta = (header.get("__metadata__") or {}) if isinstance(header, dict) else {}
                if not isinstance(meta, dict):
                    meta = {}
                for k in LORA_META_KEYS:
                    v = meta.get(k)
                    if v not in (None, "", "None"):
                        out["meta"][k] = str(v)[:2000]
                # Training tags: ss_tag_frequency = {"<folder>": {"<tag>": count}}.
                try:
                    freq = json.loads(meta.get("ss_tag_frequency") or "{}")
                    totals = {}
                    for folder in freq.values():
                        for tag, count in (folder or {}).items():
                            t = str(tag).strip()
                            if t:
                                totals[t] = totals.get(t, 0) + int(count or 0)
                    out["top_tags"] = sorted(totals.items(), key=lambda kv: -kv[1])[:40]
                except (ValueError, TypeError, AttributeError):
                    pass
    key = (path, st.st_size, int(st.st_mtime))
    sha = LORA_SHA_CACHE.get(key)
    if sha is None:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for block in iter(lambda: f.read(1024 * 1024), b""):
                h.update(block)
        sha = h.hexdigest()
        LORA_SHA_CACHE[key] = sha
    out["sha256"] = sha
    return out


# ---- LoRA downloads (Comfy Bridge's LoRA lookup: "Download to this PC") -----
# The PC fetches a LoRA straight into ComfyUI's (first) loras folder, so the
# phone can ask for it too. The client never sends a URL: it names a source
# and its ids, and the URL is built here from validated parts —
#   civitai:     https://civitai.com/api/download/models/<version id>
#   huggingface: https://huggingface.co/<owner>/<repo>/resolve/<rev>/<path>
# (CivArchive's exact matches list these as mirrors, incl. deleted CivitAI
# models' Hugging Face copies). Other sites (TensorArt, PixAI…) have no public
# download API, so they're open-the-page only.
# Some files need an account: CivitAI ("the creator requires you to be logged
# in") takes an API key, gated Hugging Face repos an access token. Both are
# optional, stored in <ComfyUI>/user/osmium_download_keys.json (outside
# user/<id>/, which ComfyUI's userdata API serves), set only over the desktop
# app's pipe (set_keys; never from the phone), never sent back — status only
# says which are set. Redirects are followed by hand, https only, and a key
# goes to its own site's host and nowhere else (not the CDN redirected to).
# Only .safetensors is kept (pickle formats run code on load): the header is
# checked, and the SHA-256 when the lookup knew it, before the .part file
# takes its real name. Never overwrites.
LORA_DOWNLOADS = {}
LORA_MAX_BYTES = 4 * 1024 ** 3
SAFE_SEGMENT = re.compile(r"^[^<>:\"/\\|?*\x00-\x1f]{1,120}$")
KEY_SITES = {"civitai": "civitai.com", "huggingface": "huggingface.co"}
SITE_LABELS = {"civitai": "CivitAI", "huggingface": "Hugging Face"}


def loras_root():
    roots = [p for p in folder_paths.get_folder_paths("loras") if os.path.isdir(p)]
    if not roots:
        raise LookupError("ComfyUI has no loras folder.")
    return roots[0]


def lora_rel_dir(rel):
    """A loras-relative folder → its absolute path, confined to the root."""
    parts = [p for p in str(rel or "").replace("\\", "/").split("/") if p and p != "."]
    for p in parts:
        if p == ".." or not SAFE_SEGMENT.match(p) or p.endswith((" ", ".")):
            raise ValueError(f"Not a usable folder name: {p}")
    root = os.path.realpath(loras_root())
    full = os.path.realpath(os.path.join(root, *parts))
    if full != root and not full.startswith(root + os.sep):
        raise ValueError("That folder is outside the loras folder.")
    return full, "/".join(parts)


def lora_dirs(rel):
    full, rel = lora_rel_dir(rel)
    if not os.path.isdir(full):
        raise LookupError(f"No such folder: {rel}")
    dirs, files = [], 0
    for e in sorted(os.scandir(full), key=lambda e: e.name.lower()):
        if e.is_dir() and not e.name.startswith("."):
            dirs.append(e.name)
        elif e.is_file() and e.name.lower().endswith(".safetensors"):
            files += 1
    return {"path": rel, "dirs": dirs, "files": files}


def keys_file():
    return os.path.join(folder_paths.get_user_directory(), "osmium_download_keys.json")


def download_keys():
    try:
        with open(keys_file(), encoding="utf-8") as f:
            d = json.load(f)
        return {k: str(d.get(k) or "") for k in KEY_SITES} if isinstance(d, dict) else {}
    except (OSError, ValueError):
        return {}


def set_download_keys(req):
    keys = download_keys()
    for site in KEY_SITES:
        if site in req:  # absent = keep; "" = remove
            v = str(req.get(site) or "").strip()
            if v and not re.fullmatch(r"[\x21-\x7e]{8,200}", v):
                raise ValueError(f"That doesn't look like a {SITE_LABELS[site]} key.")
            keys[site] = v
    os.makedirs(os.path.dirname(keys_file()), exist_ok=True)
    with open(keys_file(), "w", encoding="utf-8") as f:
        json.dump(keys, f)


def download_url(src):
    import urllib.parse
    site = str(src.get("source") or "")
    if site == "civitai":
        vid = str(src.get("version_id") or "")
        if not re.fullmatch(r"\d{1,12}", vid):
            raise ValueError("Not a CivitAI model version id.")
        return site, f"https://civitai.com/api/download/models/{vid}?type=Model&format=SafeTensor"
    if site == "huggingface":
        repo, rev, path = str(src.get("repo") or ""), str(src.get("rev") or "main"), str(src.get("path") or "")
        if not re.fullmatch(r"[A-Za-z0-9][\w.-]{0,95}/[A-Za-z0-9][\w.-]{0,95}", repo) or ".." in repo:
            raise ValueError("Not a Hugging Face repo.")
        if not re.fullmatch(r"[\w.-]{1,64}", rev) or ".." in rev:
            raise ValueError("Not a Hugging Face revision.")
        segs = path.split("/")
        if not path.lower().endswith(".safetensors") or any(not s or s in (".", "..") or not SAFE_SEGMENT.match(s) for s in segs):
            raise ValueError("Not a .safetensors file in that repo.")
        return site, f"https://huggingface.co/{repo}/resolve/{rev}/" + "/".join(urllib.parse.quote(s) for s in segs)
    raise ValueError("That site has no download this app can use; open its page instead.")


def lora_download_start(src, folder, filename):
    import hashlib
    import http.client
    import urllib.request
    import urllib.error
    import urllib.parse
    site, first_url = download_url(src)
    want_sha = str(src.get("sha256") or "").lower()
    if not re.fullmatch(r"[0-9a-f]{64}", want_sha):
        want_sha = ""
    full_dir, rel = lora_rel_dir(folder)
    name = str(filename or "").strip()
    if not name.lower().endswith(".safetensors"):
        name += ".safetensors"
    if not SAFE_SEGMENT.match(name) or name.startswith(".") or name.endswith(" "):
        raise ValueError("That file name has characters Windows can't use.")
    dest = os.path.join(full_dir, name)
    if os.path.exists(dest):
        raise FileExistsError(f"{(rel + '/' if rel else '') + name} already exists.")
    for j in LORA_DOWNLOADS.values():
        if j["state"] == "running" and j["dest"] == dest:
            raise FileExistsError("That file is already downloading.")
    job = {"id": uuid.uuid4().hex[:12], "state": "running", "name": (rel + "/" if rel else "") + name, "site": site,
           "dest": dest, "bytes": 0, "total": 0, "error": "", "verified": False}
    LORA_DOWNLOADS[job["id"]] = job
    label = SITE_LABELS[site]

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None
    opener = urllib.request.build_opener(NoRedirect)

    def run():
        part = dest + ".part"
        try:
            os.makedirs(full_dir, exist_ok=True)
            key = download_keys().get(site, "")
            what = "API key" if site == "civitai" else "access token"

            # The file's response, from the source URL through its redirects
            # (re-resolved per attempt: CDN links are signed and expire).
            # start > 0 asks for the rest (a resume after a dropped link).
            def open_stream(start):
                url = first_url
                for _hop in range(6):
                    headers = {"User-Agent": "ComfyBridge/2.0 (LoRA download)"}
                    if start:
                        headers["Range"] = f"bytes={start}-"
                    if key and (urllib.parse.urlsplit(url).hostname or "") == KEY_SITES[site]:
                        headers["Authorization"] = f"Bearer {key}"
                    try:
                        return opener.open(urllib.request.Request(url, headers=headers), timeout=30)
                    except urllib.error.HTTPError as e:
                        if e.code in (301, 302, 303, 307, 308) and e.headers.get("Location"):
                            url = urllib.parse.urljoin(url, e.headers["Location"])
                            if not url.startswith("https://"):
                                raise ValueError("The download redirected off https.")
                            continue
                        if e.code in (401, 403):
                            if not key:
                                raise PermissionError(f"{label} wants an account for this one: add your {label} {what} under "
                                                      "Download keys (Comfy Bridge on the PC, Metadata tab), then try again.")
                            raise PermissionError(f"{label} refused the download with your {what} (early access, a gated "
                                                  f"repo you haven't accepted, or the {what} is wrong/expired).")
                        raise ValueError(f"{label} answered {e.code}.")
                raise ValueError("Too many redirects.")

            # A CDN can drop the link mid-file and the read just ends short,
            # so the length is checked against Content-Length and the rest is
            # fetched with a Range request (up to 4 resumes).
            sha = hashlib.sha256()
            with open(part, "wb") as f:
                for attempt in range(5):
                    res = open_stream(job["bytes"])
                    with res:
                        if job["bytes"] == 0:
                            job["total"] = int(res.headers.get("Content-Length") or 0)
                        elif res.status != 206:
                            raise ValueError("The link dropped and the server can't resume; try again.")
                        if job["total"] > LORA_MAX_BYTES:
                            raise ValueError("The file is larger than 4 GB.")
                        try:
                            while True:
                                if job["state"] == "cancelled":
                                    raise InterruptedError("Cancelled.")
                                block = res.read(1024 * 1024)
                                if not block:
                                    break
                                job["bytes"] += len(block)
                                if job["bytes"] > LORA_MAX_BYTES:
                                    raise ValueError("The file is larger than 4 GB.")
                                sha.update(block)
                                f.write(block)
                        except InterruptedError:
                            raise  # Cancel: an OSError subclass, but not a dropped link to resume
                        except (OSError, http.client.HTTPException) as e:
                            life(f"LoRA download {job['name']}: link dropped at {job['bytes']} bytes ({e})")
                    if not job["total"] or job["bytes"] >= job["total"]:
                        break
                    life(f"LoRA download {job['name']}: short read at {job['bytes']}/{job['total']}, resuming")
                if job["total"] and job["bytes"] != job["total"]:
                    raise ValueError(f"The download kept getting cut off ({job['bytes']} of {job['total']} bytes); try again.")
            with open(part, "rb") as f:
                n = int.from_bytes(f.read(8), "little")
                head = f.read(1)
            if not (0 < n <= 100 * 1024 * 1024 and head == b"{" and n + 8 <= job["bytes"]):
                raise ValueError("That download isn't a .safetensors file (a login page?), so it wasn't kept.")
            if want_sha:
                if sha.hexdigest() != want_sha:
                    raise ValueError("The downloaded file's SHA-256 doesn't match the looked-up one, so it wasn't kept.")
                job["verified"] = True
            if os.path.exists(dest):
                raise FileExistsError(f"{job['name']} appeared while downloading; not overwritten.")
            os.replace(part, dest)
            st = os.stat(dest)
            LORA_SHA_CACHE[(dest, st.st_size, int(st.st_mtime))] = sha.hexdigest()
            job["state"] = "done"
            life(f"LoRA downloaded from {site}: {job['name']} ({job['bytes']} bytes)")
        except Exception as err:  # noqa: BLE001
            if job["state"] != "cancelled":
                job["state"] = "error"
            job["error"] = str(err)
            try:
                os.remove(part)
            except OSError:
                pass
    threading.Thread(target=run, daemon=True).start()
    return {k: v for k, v in job.items() if k != "dest"}


def lora_op(req, trusted=False):
    """The LoRA folder/download commands, one entry point for the pipe, the
    share server and the Bridge's relay: op = dirs | download | status |
    cancel, plus set_keys from the desktop app's own pipe (trusted) only."""
    op = str(req.get("op") or "")
    if op == "dirs":
        return {"ok": True, **lora_dirs(req.get("path"))}
    if op == "download":
        return {"ok": True, "job": lora_download_start(req.get("src") or {}, req.get("folder"), req.get("filename"))}
    if op == "status":
        jobs = [{k: v for k, v in j.items() if k != "dest"} for j in LORA_DOWNLOADS.values()]
        keys = download_keys()
        return {"ok": True, "jobs": jobs[-20:], "keys": {k: bool(keys.get(k)) for k in KEY_SITES}}
    if op == "cancel":
        j = LORA_DOWNLOADS.get(str(req.get("job") or ""))
        if j and j["state"] == "running":
            j["state"] = "cancelled"
        return {"ok": True}
    if op == "set_keys" and trusted:
        set_download_keys(req.get("keys") or {})
        return {"ok": True}
    raise ValueError(f"Unknown LoRA command: {op}")


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
        self.gallery_root = ""  # the app's picked output folder, set with share

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
        life(f"serving the phone on port {port} (folder: {self.gallery_root or 'ComfyUI output'})")
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
        life("stopped serving the phone")

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
                except Exception as exc:  # noqa: BLE001 — answer the phone with the reason, not a bare 500
                    status = 404 if isinstance(exc, (LookupError, FileNotFoundError)) else 500
                    resp = web.json_response({"error": {"message": str(exc) or type(exc).__name__}}, status=status)
                    life(f"phone {request.remote} {request.method} {request.path_qs} failed: {type(exc).__name__}: {exc}")
            # Lifecycle log: every phone request but the grid's thumbnails.
            if request.path != "/internal/gallery/thumb":
                life(f"phone {request.remote} {request.method} {request.path_qs} -> {getattr(resp, 'status', '?')}")
            if not getattr(resp, "prepared", False):
                resp.headers["Access-Control-Allow-Origin"] = "*"
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
                resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Osmium-Token"
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

        # Gallery over the share server: browse the app's picked output folder.
        # The folder arrives with the share command (root=). Until it has, this
        # falls back to ComfyUI's own output folder (where this runner's
        # SaveImage writes), so the phone can always see the generations.
        def gallery_root():
            root = self.gallery_root or folder_paths.get_output_directory()
            if not root or not os.path.isdir(root):
                raise LookupError("The PC's output folder isn't available. Open Comfy Bridge and pick it again.")
            return root

        # The routes are named *_route: a handler named gallery_list shadowed
        # the module's gallery_list() helper, so the listing called itself.
        async def gallery_list_route(request):
            loop = asyncio.get_running_loop()
            r = await loop.run_in_executor(None, gallery_list, gallery_root(), request.query.get("dir") or "")
            return web.json_response({"ok": True, "entries": r})

        async def gallery_read_route(request):
            loop = asyncio.get_running_loop()
            abs = await loop.run_in_executor(None, gallery_safe_join, gallery_root(), request.query.get("path") or "")
            data, mime = await loop.run_in_executor(None, gallery_read_bytes, abs)
            return web.Response(body=data, content_type=mime.split(";")[0])

        async def gallery_thumb_route(request):
            loop = asyncio.get_running_loop()
            abs = await loop.run_in_executor(None, gallery_safe_join, gallery_root(), request.query.get("path") or "")
            data, mime = await loop.run_in_executor(None, gallery_thumb_bytes, abs, request.query.get("side") or "320")
            # The image itself, like the Bridge relay's route (the phone reads bytes).
            return web.Response(body=data, content_type=mime)

        async def lora_info_route(request):
            info = await asyncio.get_running_loop().run_in_executor(None, lora_info, request.query.get("name") or "")
            return web.json_response({"ok": True, "info": info})

        async def lora_op_route(request):
            try:
                body = await request.json()
            except ValueError:
                return err(400, "Invalid JSON.")
            if not isinstance(body, dict):
                return err(400, "Invalid request.")
            return web.json_response(await asyncio.get_running_loop().run_in_executor(None, lora_op, body))

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
            life(f"phone {request.remote} websocket open ({cid[:8]})")
            await sock.send_str(json.dumps({"type": "status", "data": {"status": {"exec_info": {"queue_remaining": 0}}, "sid": cid}}))
            try:
                async for _msg in sock:  # the phone's feature_flags etc.: nothing to do
                    pass
            finally:
                if self.sockets.get(cid) is sock:
                    self.sockets.pop(cid, None)
                    self.log_subs.discard(cid)
                life(f"phone {request.remote} websocket closed ({cid[:8]})")
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
        webapp.router.add_get("/internal/gallery/list", gallery_list_route)
        webapp.router.add_get("/internal/gallery/read", gallery_read_route)
        webapp.router.add_get("/internal/gallery/thumb", gallery_thumb_route)
        webapp.router.add_get("/internal/lora/info", lora_info_route)
        webapp.router.add_post("/internal/lora/op", lora_op_route)
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
        for nid, text in (reply.get("texts") or {}).items():
            outputs[nid] = {"tags": [text]}
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
    own PreviewImages carry no mark and stay pruned as UI-only. Any other node
    marked `_meta.capture` is a text output (Comfy Bridge's WD14 tagging: the
    tagger's `tags`), returned as `texts`."""
    ct = node.get("class_type")
    return ct == "SaveImage" or bool((node.get("_meta") or {}).get("capture"))


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
    ensure_optional_nodes({n["class_type"] for n in pruned.values()})
    missing = sorted({n["class_type"] for n in pruned.values() if n["class_type"] not in nodes.NODE_CLASS_MAPPINGS})
    if missing:
        raise ValueError("Node types not available to the local runner: " + ", ".join(missing_node_hint(m) for m in missing))
    return pruned, captures


# ---- commands -------------------------------------------------------------
EXECUTOR = None


def cmd_object_info(req):
    ensure_optional_nodes([req["class_type"]])
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
    ensure_optional_nodes([req["class_type"]])
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


def saved_texts(captures):
    """Text outputs of the captured nodes (a tagger's `tags`), one string each."""
    outputs = (EXECUTOR.history_result or {}).get("outputs", {})
    out = {}
    for nid in captures:
        tags = (outputs.get(nid) or {}).get("tags")
        if isinstance(tags, list):
            tags = tags[0] if tags else None
        if isinstance(tags, str):
            out[nid] = tags
    return out


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
    texts = saved_texts(captures) if EXECUTOR.success else {}
    if not saved and not texts:
        return {"ok": False, "error": "The local runner finished without producing an image."}
    for nid, (_bytes, rel) in saved.items():
        say(f"Saved {rel}")
    say("Done in {:.1f}s".format(time.perf_counter() - started))
    return {"ok": True,
            "images": {nid: base64.b64encode(b).decode("ascii") for nid, (b, _rel) in saved.items()},
            "paths": {nid: rel.replace(os.sep, "/") for nid, (_b, rel) in saved.items()},
            "texts": texts}


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
            elif req.get("cmd") == "share":  # the phone share server: port (0 = off) + the app's picked folder to browse
                port = int(req.get("port") or 0)
                root = str(req.get("root") or "")
                if root:
                    SHARE.gallery_root = root
                if port:
                    ok, error = SHARE.start(port)
                else:
                    SHARE.stop()
                    ok, error = True, ""
                send({"id": req.get("id"), "ok": ok, "error": error, "port": SHARE.port})
            elif req.get("cmd") == "lora_info":
                # Off the JOBS path (never waits behind a generation) and off
                # this reader thread (hashing a big file takes a moment).
                def answer(r=req):
                    try:
                        send({"id": r.get("id"), "ok": True, "info": lora_info(r.get("name"))})
                    except Exception as err:  # noqa: BLE001
                        send({"id": r.get("id"), "ok": False, "error": str(err)})
                threading.Thread(target=answer, daemon=True).start()
            elif req.get("cmd") == "lora_op":  # LoRA folders/downloads: never queues behind a generation
                def answer_op(r=req):
                    try:
                        send({"id": r.get("id"), **lora_op(r, trusted=True)})
                    except Exception as err:  # noqa: BLE001
                        send({"id": r.get("id"), "ok": False, "error": str(err)})
                threading.Thread(target=answer_op, daemon=True).start()
            elif req.get("cmd") == "gallery_thumb":
                # The app thumbnails its OWN picked folder through Pillow here
                # (the share server route serves its own root); fast-path like
                # stop/logs so it never queues behind a running generation.
                try:
                    data, mime = gallery_thumb_bytes(str(req.get("abs") or ""), int(req.get("side") or 320))
                    send({"id": req.get("id"), "ok": True, "b64": base64.b64encode(data).decode("ascii"), "mime": mime})
                except LookupError as err:
                    send({"id": req.get("id"), "ok": False, "error": str(err)})
                except Exception as err:  # noqa: BLE001
                    send({"id": req.get("id"), "ok": False, "error": str(err)})
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
            life(f"{APP_NAME} connected")
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
                    life(f"{APP_NAME} disconnected; staying open")

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
