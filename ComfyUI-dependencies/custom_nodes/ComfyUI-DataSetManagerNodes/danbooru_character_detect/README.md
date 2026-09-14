# ComfyUI Danbooru Character Detect (trimmed)

Bundled here in full — this one has no public repo to link to. It's a bespoke node built for this
project's own ComfyUI setup, used by SynthDat Overseer's workflow (registered here as
`DSM Danbooru Character Detect`, upstream class `DanbooruCharacterDetect` — see this pack's own
`__init__.py` for the rename) to sort generated images into a per-character output folder by
scanning the prompt text for a known Danbooru character tag.

## What's included vs. the original

The original node pack also has a second, unrelated node — `Danbooru Character Lookup` (a
searchable dropdown + "copy to clipboard" helper for browsing the same character list by hand) —
plus a separate `Danbooru Tag Lookup` node with its own ~70MB of general/artist/copyright/wiki
tag data. SynthDat's bundled workflow (`renderer/data/synthdat-workflow.json`) only ever used
`Danbooru Character Detect`; the `Tag Lookup` node was traced to zero downstream consumers in the
captured workflow graph and removed from it as dead weight. So this bundled copy keeps:

- `nodes.py` — both `DanbooruCharacterDetect` and `DanbooruCharacterLookup` (the second one is
  small, self-contained, and harmless to keep even though SynthDat's own workflow doesn't use it)
- `ahocorasick.py` — the matching algorithm `nodes.py` depends on, pure Python stdlib
- `data/character_tags.json` (~3MB) — the character tag database both nodes above read
- `web/js/character_lookup.js` — the "Copy" button for the Lookup node's dropdown
- `__init__.py` — trimmed to only register the two nodes above (the original also imported
  `tag_lookup_node.py`, which is NOT included here — its ~70MB of data files aren't needed for
  anything SynthDat's own workflow actually does)

## Install

Copy this whole folder into `ComfyUI/custom_nodes/`, then restart ComfyUI. No extra pip packages
required (pure Python, stdlib only).

## Node: "Danbooru Character Detect"

**Inputs**
- `text` (STRING) — your prompt / tag list. Works with comma-separated tags or freeform sentences.
- `escape_parentheses` (BOOLEAN, default off) — turn on if you're feeding the result back into a
  prompt box (outputs `Robin \(Honkai Star Rail\)`). Leave off when using the result as a
  filename/folder path (SynthDat's own use).
- `fallback` (STRING, optional) — what to output when no known character tag is found. Defaults
  to empty string.

Scans for a known Danbooru character tag and outputs it formatted as `Name (Series)` — e.g.
`robin_(honkai:_star_rail)` or `robin (honkai star rail)` both become `Robin (Honkai Star Rail)`.
