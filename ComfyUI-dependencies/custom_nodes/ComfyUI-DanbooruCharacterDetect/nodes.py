import json
import os
import re

from .ahocorasick import AhoCorasick

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "character_tags.json")

# Boundary characters: a match only counts if it's not glued to a letter or
# digit on either side (so "ce" doesn't fire inside "masterpiece", or "nt"
# inside "painting"). Underscore is deliberately EXCLUDED from "word char"
# here: since spaces get normalized to underscores before matching, an
# underscore right outside a match usually represents a comma/space
# separator, not part of the matched tag itself.
_WORD_CHAR = re.compile(r"[a-z0-9]")


class _TagDB:
    """Lazy-loaded, module-level singleton so the ~48k-pattern automaton is
    built once per ComfyUI process, not once per node execution."""

    _automaton = None
    _tag_count = 0

    @classmethod
    def get(cls):
        if cls._automaton is None:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            automaton = AhoCorasick()
            for tag, display in data.items():
                # index keys must go through the exact same normalization
                # as the search text at lookup time, or a colon-bearing
                # raw tag like "trailblazer_(honkai:_star_rail)" will
                # never match a colon-free query like
                # "Trailblazer (Honkai Star Rail)"
                automaton.add_word(_normalize(tag), display)
            automaton.build()
            cls._automaton = automaton
            cls._tag_count = len(data)
            print(
                f"[DanbooruCharacterDetect] loaded {cls._tag_count} "
                f"character tags/aliases"
            )
        return cls._automaton


def _normalize(text):
    # lowercase; drop colons (Danbooru writes some franchises like
    # "honkai:_star_rail" with a colon, but our display strings and most
    # user input omit it, e.g. "Honkai Star Rail" / "honkai_star_rail" —
    # colons must be stripped identically here AND when the index keys
    # are built below, or the two will never line up); drop backslashes
    # too, since SD-style prompts often escape parens as "\(" "\)" to
    # mean a literal paren rather than an emphasis group — whether or
    # not those backslashes survive into this string depends on the
    # front end, so stripping them here makes matching work either way;
    # collapse whitespace runs to a single underscore so "hatsune miku"
    # lines up with the stored key "hatsune_miku"
    text = text.lower()
    text = text.replace(":", "")
    text = text.replace("\\", "")
    text = re.sub(r"\s+", "_", text)
    return text


def _is_boundary(text, idx):
    """True if idx is out of range or not a word character."""
    if idx < 0 or idx >= len(text):
        return True
    return not _WORD_CHAR.match(text[idx])


def _escape_parens(display):
    return display.replace("(", r"\(").replace(")", r"\)")


class DanbooruCharacterDetect:
    """
    Scans input text/tags for a known Danbooru character tag and outputs
    the first one it finds, formatted as 'Name (Series)'.

    Matches on ~48,000 character tags + aliases bundled from a public
    Danbooru tag-autocomplete dataset. Works whether the input is a
    comma-separated tag list or a freeform sentence, as long as the
    character tag appears with underscores or spaces (e.g. both
    "robin_(honkai:_star_rail)" and "robin (honkai star rail)" match).

    If multiple characters are present, only the one that appears
    earliest in the text is returned. Ties at the same start position
    are broken in favor of the longer/more specific match.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "text": ("STRING", {"multiline": True, "default": ""}),
                "escape_parentheses": (
                    "BOOLEAN",
                    {
                        "default": False,
                        "tooltip": (
                            "Output 'Robin \\(Honkai Star Rail\\)' instead "
                            "of 'Robin (Honkai Star Rail)'. Turn this off "
                            "when feeding the output into a filename/folder "
                            "path; turn it on if feeding back into a prompt."
                        ),
                    },
                ),
            },
            "optional": {
                "fallback": (
                    "STRING",
                    {
                        "multiline": False,
                        "default": "",
                        "tooltip": "Returned when no known character tag is found.",
                    },
                ),
            },
        }

    RETURN_TYPES = ("STRING", "BOOLEAN")
    RETURN_NAMES = ("character", "found")
    FUNCTION = "detect"
    CATEGORY = "text/danbooru"

    def detect(self, text, escape_parentheses=False, fallback=""):
        automaton = _TagDB.get()
        normalized = _normalize(text)

        best = None  # (start, -length, end, display)
        for start, end, word, display in automaton.iter_matches(normalized):
            if not _is_boundary(normalized, start - 1):
                continue
            if not _is_boundary(normalized, end):
                continue
            key = (start, -(end - start))
            if best is None or key < best[0]:
                best = (key, display)

        if best is None:
            return (fallback, False)

        display = best[1]
        if escape_parentheses:
            display = _escape_parens(display)
        return (display, True)


class _CharacterList:
    """Lazy-loaded, module-level singleton for the sorted list of unique
    display names, used to populate the Lookup node's searchable combo."""

    _names = None

    @classmethod
    def get(cls):
        if cls._names is None:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            # many raw tags/aliases collapse to the same display string
            # (e.g. aliases) — dedupe before sorting so the dropdown
            # doesn't show the same character multiple times
            cls._names = sorted(set(data.values()))
        return cls._names


class DanbooruCharacterLookup:
    """
    Browse/search the same ~60k-character Danbooru tag database used by
    "Danbooru Character Detect", without needing to already know the
    exact tag text. Type into the dropdown to filter by name, pick the
    character you want, then click the "Copy" button (added by the
    accompanying JS extension) to copy the exact formatted name straight
    to your clipboard.

    The STRING output lets you also wire the selection directly into
    another node instead of (or as well as) copying it.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "character": (_CharacterList.get(),),
            },
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("character",)
    FUNCTION = "lookup"
    CATEGORY = "text/danbooru"

    def lookup(self, character):
        return (character,)


NODE_CLASS_MAPPINGS = {
    "DanbooruCharacterDetect": DanbooruCharacterDetect,
    "DanbooruCharacterLookup": DanbooruCharacterLookup,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DanbooruCharacterDetect": "Danbooru Character Detect",
    "DanbooruCharacterLookup": "Danbooru Character Lookup",
}
