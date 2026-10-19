// In-app Help panel (desktop). Mirrors Osmium Workshop's help modal: a
// button in the top bar (left of the Wiki button) opens a centered card with
// a table of contents on the left and one section at a time on the right.
// Content is plain data here, the viewer below only renders the active
// section. Written for someone who has never used ComfyUI before.

interface HelpSection { id: string; title: string; html: string; }

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'start',
    title: 'Start here',
    html: `
      <p>Comfy Bridge runs one fixed ComfyUI workflow for you. There is no node graph to wire, and no dataset to manage. Pick a model, type a prompt, choose where to save, and press Generate. Every finished image goes straight to your folder.</p>
      <p>Three things have to line up before anything works. ComfyUI has to be reachable. A checkpoint has to be chosen under Models. And an output folder has to be set, or the run finishes but nothing is written to disk.</p>
      <p>The sections in this panel follow the screen order. Connection comes first, then the reference image, then the models and prompt on the left and middle, then the generation settings and file naming in the drawers, reached by the buttons at the bottom right.</p>`
  },
  {
    id: 'connection',
    title: 'Connection',
    html: `
      <p>This is how the Bridge talks to ComfyUI. Pick one of the two modes under Run on, then press the button next to the address field.</p>
      <p><b>ComfyUI server</b> talks to a ComfyUI you already have running. Type its address, usually <code>http://127.0.0.1:8188</code> for a copy on this PC. Test checks that it answers. Refresh model lists reads the checkpoint, LoRA, VAE and upscale model names straight from it, so the picker dialogs know what you have.</p>
      <p><b>Osmium Comfy</b> starts your own ComfyUI install for you, with only the nodes this workflow needs. Choose your ComfyUI folder the first time. Connect launches it, and the first load can take 15 to 60 seconds. Its own console window shows the progress.</p>
      <p>Persist Comfy keeps Osmium Comfy running after you close the Bridge, so your models stay loaded for next time. Close its console window when you actually want it to stop.</p>
      <p>The phone relay lets the Comfy Bridge phone app generate on this PC over your network. Turn it on to see the address to type into the phone, and set a shared token if anyone else can reach the same network. Without a token, anything on that network can use it.</p>`
  },
  {
    id: 'reference',
    title: 'Reference image (ControlNet)',
    html: `
      <p>A reference image makes the result follow the pose, shape or layout of another picture. Pick the image, and the workflow feeds it through Anima LLLite, the ControlNet built for Anima.</p>
      <p><b>Extract pose</b> finds the people in the reference with DWPose (the comfyui_controlnet_aux node pack) and swaps the reference for its OpenPose-style pose frame, the same size. If the detector finds nobody (it can miss greyscale or sketchy art), it tries the whole image as one person. Pick the image again to go back to it.</p>
      <p><b>No reference image</b> turns the whole section off. Tick it for a plain text-to-image run and ignore everything below.</p>
      <p><b>Strength</b> is how hard the reference pushes. 1 is the normal setting. If the output looks trapped by the reference, lower it toward 0.5. If it ignores the reference, raise it past 1.</p>
      <p><b>Start percent</b> and <b>End percent</b> decide when the reference is active. The defaults of 0 and 0.3 mean it steers only the first 30 percent of the steps. That lets the model loose at the end to clean the picture up.</p>
      <p><b>Preserve wrapper</b> keeps the tagged prompt wrapped the way this ControlNet expects. Leave it on unless you know why you are turning it off.</p>
      <p><b>Resize fit</b> controls how your reference is fit to the output size. Pad adds empty space, so the framing stays intact. Crop trims the edges so the subject fills the frame. Contain shrinks the whole image to fit inside.</p>
      <p><b>Resize method</b> is the scaling filter. Lanczos is the sharpest and the default. Bilinear and Bicubic are softer, and Nearest keeps hard pixel edges.</p>`
  },
  {
    id: 'models',
    title: 'Models',
    html: `
      <p>Press Refresh model lists on the Connection panel first, so these fields can offer what ComfyUI actually has installed.</p>
      <p><b>Diffusion model (UNET)</b> is the main checkpoint. It decides the style and the quality of everything you make. No checkpoint, no image.</p>
      <p><b>CLIP</b> is the text encoder that reads your prompt. It normally matches the checkpoint. Leave it alone unless your setup calls for a different one.</p>
      <p><b>VAE</b> turns the model's raw output into the final image. Only set this if your checkpoint needs a separate VAE. Left empty, the one baked into the model is used.</p>
      <p><b>Main LoRA</b> is the single character or style LoRA you reach for most. Leave it empty and the run skips LoRA loading entirely, so you can generate with no LoRA at all.</p>
      <p><b>Main LoRA weight</b> is how strongly that LoRA is applied. 1 is full strength, and 0.7 is a common softer setting. The number only matters when a Main LoRA is chosen.</p>`
  },
  {
    id: 'lora-stack',
    title: 'LoRA stack',
    html: `
      <p>Extra LoRAs live here. Press + Add LoRA, pick the file, and set its weight. They stack from top to bottom, so the first row is applied first.</p>
      <p>This is the place for a style LoRA under a character LoRA, or any other combination you use often. Keep the list short. Each extra LoRA costs a little time, and several can fight each other and muddy the result.</p>
      <p>A row with no file chosen does nothing. Delete a row with the × button beside it.</p>`
  },
  {
    id: 'prompt',
    title: 'Prompt',
    html: `
      <p>The workflow breaks the prompt into parts, so you can fill in only the slices you care about and reuse the rest through presets.</p>
      <p><b>Use a single unified prompt box</b> collapses everything into one plain text area. Turn it on when you would rather write a normal paragraph.</p>
      <p>With it off, <b>Global</b> holds your quality words (masterpiece, best quality, and so on) and applies to every image. <b>Character</b> is the subject. Rating, Hair, Face, Chest, Body, Clothes, Limbs, Sexual, Pose, Scene, Effects and Extra each hold one slice of the description. Any of them can stay empty.</p>
      <p><b>Character trigger</b> is the activation word for a trained LoRA, when it has one. It is added after the character text.</p>
      <p><b>Negative</b> is what you do not want in the image. A sensible default is already filled in, so you can leave it alone.</p>
      <p>Prompt presets save a whole setup under a name and load it again later. Negative presets save just the negative text, which is handy when one negative works across many characters.</p>
      <p>To start over, the <b>Clear all prompt fields</b> button above the fields empties every prompt box in one click, in either mode, along with the Character trigger. The Negative box is left alone.</p>`
  },
  {
    id: 'sampling',
    title: 'Resolution and sampling',
    html: `
      <p>These live in the Generation settings drawer, opened by the gear button at the bottom right.</p>
      <p><b>Width</b> and <b>Height</b> set the output size in pixels. 1024 by 1024 is the default. The swap button flips the two.</p>
      <p><b>Sampler</b> is the method that turns noise into an image. Euler A is a good general default. <b>Scheduler</b> shapes the noise schedule, and Simple pairs well with Euler A.</p>
      <p><b>More samplers (optional):</b> install the <b>RES4LYF</b> node pack in your ComfyUI (for example through ComfyUI Manager), restart ComfyUI and press <b>Refresh model lists</b>. Its samplers then appear at the end of the list as <code>res4lyf:…</code> (like <code>res4lyf:multistep/res_2m</code>), along with its <code>beta57</code> and <code>bong_tangent</code> schedulers. It isn't part of Osmium's node pack: it's a separate project with its own license.</p>
      <p><b>Steps (pass 1)</b> is how many denoise passes the first pass runs. More steps cost more time and can add detail, but past roughly 30 they rarely help. 25 is the default.</p>
      <p><b>CFG (pass 1)</b> is how strictly the model follows your prompt. Around 4 is normal here. Raise it and the image clings to the prompt and can look harsh. Lower it and the model improvises more.</p>
      <p><b>Seed</b> is the random starting point. The same seed, prompt and settings give the same image, which is how you reproduce a result or make small variations of it. The dropdown beside it sets what happens to the seed each time you generate. <b>Fixed</b>, the default, reuses the number you typed. <b>Randomize</b> rolls a new random seed every generation. <b>Increment</b> and <b>Decrement</b> step the seed by one, which walks through near-identical variations.</p>
      <p><b>2-Pass</b> runs a second, gentler denoise pass over pass 1 to clean it up. Steps (pass 2) is how many steps that pass runs, 20 by default. Denoise is how much it is allowed to change, and 0.6 keeps most of pass 1 while polishing the rest. Pass 2 has a seed of its own.</p>`
  },
  {
    id: 'upscale',
    title: 'Upscale',
    html: `
      <p>Turn this on to enlarge the finished image with a separate upscale model. Pick the model, then use Scale by to trim the result back to the size you want.</p>
      <p>Many upscale models multiply by 4, so a Scale by of 0.5 brings that back to a 2x increase. For a 1024 pixel image, that gives you 2048.</p>
      <p>Refresh from disk reloads the upscale models ComfyUI has, without touching the rest of the model lists.</p>
      <p><b>Upscale with USDU</b> is the other choice (turning one on turns the other off). Ultimate SD Upscale enlarges the image with an upscale model, then redraws it tile by tile with a checkpoint of its own at low denoise, which adds real detail. It needs the ComfyUI_UltimateSDUpscale node pack, and the WD14 Tagger pack for "Tag with WD14".</p>
      <p>Here it upscales the image you generate (the pass-2 image when 2-Pass is on). To upscale an image you already have, use the <b>Upscale</b> tab: choose the image (click it to zoom in), check the settings beside it (they're kept separately from these) and press Upscale this image. Its <b>Save to</b> sends the result to your output folder's Upscaled folder or to a folder you choose (saved as &lt;image&gt;_upscaled.png, never overwriting). The prompt for the tiles is your image's prompt (optionally without the Global field, where artist tags live), WD14 tags, or your own text. Hover any setting for what it does; on the phone, tap its name. Results go in the Upscaled folder.</p>`
  },
  {
    id: 'wd14',
    title: 'WD14 tags',
    html: `
      <p>The WD14 tags section, under the result, describes images in Danbooru tags with the WD14 tagger running on your ComfyUI (the ComfyUI-WD14-Tagger node pack).</p>
      <p><b>Tag last generation</b> tags every image the last generation saved, each from its own pixels. With "Save a .txt beside each image" on, the tags are written as a same-name .txt next to each image in your output folder, the caption format Osmium and LoRA trainers read.</p>
      <p><b>Tag an image</b>: choose any image, press Tag it, and edit the tags if you like. Use as prompt sorts them into your prompt boxes and keeps your Global field, Character trigger and Negative. Save .txt next to the image writes it in that image's own folder (desktop). Save copy + .txt to output copies the image and its .txt into a Tagged folder in your output folder.</p>`
  },
  {
    id: 'output',
    title: 'Output and file names',
    html: `
      <p>Choose output folder sets where saved images go. Everything is saved automatically: both passes when 2-Pass runs, and the upscaled image when upscale is on. <b>Open</b> shows that folder in File Explorer (on Windows; the Upscale tab's own chosen folder has an Open button too).</p>
      <p>The folder button at the bottom right opens the File saving drawer. There, the automatic folders come from your prompt. The rating folder is explicit or safe, and upscaled images go in an Upscaled folder. You cannot edit those.</p>
      <p>The character folder is yours. Tag list matches a Danbooru character by the name you type. OC puts every original character in one folder. Custom uses any folder name you want.</p>
      <p>The filename is built from a fixed list of parts. Tick the ones you want: the character name, the Main LoRA, and the model and sampler details. A number is always added at the end, so nothing is overwritten.</p>
      <p>ComfyUI's own copy: if the folder you chose is your ComfyUI output folder, tick that box and ComfyUI stops writing its own file. Otherwise you end up with a duplicate next to the one the Bridge saves.</p>`
  },
  {
    id: 'preview',
    title: 'Preview, log and gallery',
    html: `
      <p>The right column shows a live preview while a generation runs. When it finishes you get up to three saved images: pass 1, pass 2 (or just pass 1 when 2-Pass is off), and the upscaled one. Swipe between them, or use the thumbnail strip underneath.</p>
      <p>The Log below the preview records what the app and ComfyUI are doing. When a run fails, that is the first place to look, and the message usually names the problem.</p>
      <p>The gallery button at the bottom right opens your output folder as a browsable grid. Click an image to see it larger and use the arrow keys to step through the rest. The panel beside an open image lists the settings that made it, and Use these settings loads them straight back into the form. Closing the gallery keeps the folder and scroll you were at.</p>
      <p>The <b>Gallery</b> tab shows your output folder large; click an image to open it. Its folded <b>Compare</b> section lines images up: <b>Shift-click</b> a gallery image to add it to a slot (or use Open file…; click an empty slot's ⊕ first to pick which one). Click a slot to show it on the left, right-click to show it on the right (Shift swaps the two). In <b>Side by side</b>, click an image to zoom it and Shift-click it to slide up its prompt beside it; in <b>Overlay</b>, the two are stacked and the <b>Top image</b> slider under them fades the top one in and out as you drag it. Tick <b>Turn off live overlay preview</b> to keep it solid; then holding the mouse down makes it see-through, by the slider's amount. The <b>Animations</b> box turns the motion off.</p>`
  }
];

const HELP_LAST_KEY = 'comfybridge-help-last-section';

export function initHelp(button: HTMLButtonElement): void {
  const backdrop = document.getElementById('helpBackdrop') as HTMLDivElement;
  const toc = document.getElementById('helpToc') as HTMLDivElement;
  const content = document.getElementById('helpContent') as HTMLDivElement;
  const closeBtn = document.getElementById('helpCloseBtn') as HTMLButtonElement;

  function showSection(id: string): void {
    const sec = HELP_SECTIONS.find((s) => s.id === id) || HELP_SECTIONS[0];
    content.innerHTML = `<h2>${sec.title}</h2>${sec.html}`;
    content.scrollTop = 0;
    toc.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'help-toc-title';
    heading.textContent = 'Contents';
    toc.appendChild(heading);
    for (const s of HELP_SECTIONS) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'help-toc-item' + (s.id === sec.id ? ' active' : '');
      item.textContent = s.title;
      item.addEventListener('click', () => showSection(s.id));
      toc.appendChild(item);
    }
    try { localStorage.setItem(HELP_LAST_KEY, sec.id); } catch { /* best effort */ }
  }

  function openHelp(): void {
    let last = HELP_SECTIONS[0].id;
    try { last = localStorage.getItem(HELP_LAST_KEY) || last; } catch { /* best effort */ }
    showSection(last);
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('modal-visible'));
  }

  function closeHelp(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => { backdrop.hidden = true; }, 160);
  }

  button.addEventListener('click', openHelp);
  closeBtn.addEventListener('click', closeHelp);
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) closeHelp(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !backdrop.hidden) closeHelp(); });
}
