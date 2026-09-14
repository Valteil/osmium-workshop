"""
Minimal pure-Python Aho-Corasick automaton.

Used to search for tens of thousands of known Danbooru character tags inside
an input string in a single linear pass, instead of doing one substring
check per tag (which would not scale to 40k+ patterns).

Only used internally by the DanbooruCharacterDetect node.
"""

from collections import deque


class AhoCorasick:
    __slots__ = ("goto", "fail", "output", "_built")

    def __init__(self):
        # goto[node] = {char: next_node}
        self.goto = [{}]
        # fail[node] = fallback node on mismatch
        self.fail = [0]
        # output[node] = list of (pattern_str, value) that end at this node
        self.output = [[]]
        self._built = False

    def add_word(self, word, value):
        node = 0
        for ch in word:
            nxt = self.goto[node].get(ch)
            if nxt is None:
                self.goto.append({})
                self.fail.append(0)
                self.output.append([])
                nxt = len(self.goto) - 1
                self.goto[node][ch] = nxt
            node = nxt
        self.output[node].append((word, value))

    def build(self):
        """Build failure links via BFS. Call once after all words are added."""
        queue = deque()
        for ch, nxt in self.goto[0].items():
            self.fail[nxt] = 0
            queue.append(nxt)

        while queue:
            node = queue.popleft()
            for ch, nxt in self.goto[node].items():
                queue.append(nxt)
                f = self.fail[node]
                while f and ch not in self.goto[f]:
                    f = self.fail[f]
                fallback = self.goto[f].get(ch, 0)
                if fallback == nxt:
                    fallback = 0
                self.fail[nxt] = fallback
                # merge output of the fail-linked node so we don't miss
                # shorter patterns that are suffixes of longer ones
                self.output[nxt] = self.output[nxt] + self.output[fallback]

        self._built = True

    def iter_matches(self, text):
        """
        Yield (start_index, end_index_exclusive, matched_word, value) for
        every pattern found in `text`, scanning once, O(len(text)).
        """
        if not self._built:
            self.build()

        node = 0
        for i, ch in enumerate(text):
            while node and ch not in self.goto[node]:
                node = self.fail[node]
            node = self.goto[node].get(ch, 0)
            for word, value in self.output[node]:
                start = i - len(word) + 1
                yield start, i + 1, word, value
