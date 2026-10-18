Anima-TrainFlow for Osmium Workshop
===================================

This is Anima-TrainFlow by ThetaCursed (https://github.com/ThetaCursed/Anima-TrainFlow),
set up for Osmium Workshop's Trainflow tab:

- sd-scripts is updated to v0.12.0 with the small patches Osmium's Trainflow needs.
- The Python packages are pinned to the versions Trainflow is tested with
  (requirements-osmium.txt). They're downloaded by Install_Requirements.bat, not shipped here.

Setup (once):
1. Unzip this folder somewhere with about 8 GB free (a short path like C:\Anima-TrainFlow is best).
2. Run Install_Requirements.bat. It downloads PyTorch and the trainer's packages (about 5 GB).
3. In Osmium Workshop, open the Trainflow tab, choose this folder, then pick your Anima (or Janima)
   DiT, Qwen3 text encoder and VAE files.

You need an NVIDIA GPU. Trained LoRAs go to training\output\<trigger word>\.

License: MIT (see LICENSE). sd-scripts is Apache-2.0 (training\sd-scripts\LICENSE.md).
