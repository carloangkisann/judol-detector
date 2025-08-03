import unicodedata
import re
from typing import Dict


class UnicodeNormalizer:
    def __init__(self):
        self.font_mappings = self._build_font_mappings()

    def _build_font_mappings(self) -> Dict[str, str]:
        mappings = {}

        # Mathematical Italic (0x1D434-0x1D44D, 0x1D44E-0x1D467)
        for i in range(26):
            mappings[chr(0x1D434 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D44E + i)] = chr(ord("a") + i)  # Lowercase

        # Mathematical Sans-Serif Bold (0x1D5D4-0x1D5ED, 0x1D5EE-0x1D607)
        for i in range(26):
            mappings[chr(0x1D5D4 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D5EE + i)] = chr(ord("a") + i)  # Lowercase
        for i in range(10):
            mappings[chr(0x1D7EC + i)] = chr(ord("0") + i)  # Digits

        # Mathematical Sans-Serif Bold Italic (0x1D608-0x1D621, 0x1D622-0x1D63B)
        for i in range(26):
            mappings[chr(0x1D608 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D622 + i)] = chr(ord("a") + i)  # Lowercase

        # Fullwidth (0xFF21-0xFF3A, 0xFF41-0xFF5A, 0xFF10-0xFF19)
        for i in range(26):
            mappings[chr(0xFF21 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0xFF41 + i)] = chr(ord("a") + i)  # Lowercase
        for i in range(10):
            mappings[chr(0xFF10 + i)] = chr(ord("0") + i)  # Digits

        # Monospace (0x1D670-0x1D689, 0x1D68A-0x1D6A3, 0x1D7F6-0x1D7FF)
        for i in range(26):
            mappings[chr(0x1D670 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D68A + i)] = chr(ord("a") + i)  # Lowercase
        for i in range(10):
            mappings[chr(0x1D7F6 + i)] = chr(ord("0") + i)  # Digits

        # Mathematical Script Bold Italic (0x1D4D0-0x1D4E9, 0x1D4EA-0x1D503)
        for i in range(26):
            mappings[chr(0x1D4D0 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D4EA + i)] = chr(ord("a") + i)  # Lowercase

        # Mathematical Double-Struck (0x1D538-0x1D550, 0x1D552-0x1D56B)
        for i in range(26):
            mappings[chr(0x1D538 + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D552 + i)] = chr(ord("a") + i)  # Lowercase
        for i in range(10):
            mappings[chr(0x1D7D8 + i)] = chr(ord("0") + i)  # Digits

        # Mathematical Fraktur Bold (0x1D56C-0x1D585, 0x1D586-0x1D59F)
        for i in range(26):
            mappings[chr(0x1D56C + i)] = chr(ord("A") + i)  # Uppercase
            mappings[chr(0x1D586 + i)] = chr(ord("a") + i)  # Lowercase

        # Enclosed Alphanumerics (0x24EA, 0x2460-0x2473), (0x24D0-0x24E9), (0x24B6-0x24CF)
        for i in range(10):
            mappings[chr(0x2460 + i)] = chr(ord("1") + i)  # Circled Digits 1-9
        mappings[chr(0x24EA)] = chr(ord("0"))  # Circled Digit 0
        for i in range(26):
            mappings[chr(0x24D0 + i)] = chr(ord("a") + i)  # Circled Lowercase
            mappings[chr(0x24B6 + i)] = chr(ord("A") + i)  # Circled Uppercase

        # Negative Squared Alphanumerics (0x1F170-0x1F189)
        for i in range(26):
            mappings[chr(0x1F170 + i)] = chr(
                ord("A") + i
            )

        return mappings

    def normalize_text(self, text: str) -> str:
        if not text:
            return text

        normalized = self._apply_font_mappings(text)

        normalized = unicodedata.normalize("NFD", normalized)

        normalized = "".join(
            char for char in normalized if not unicodedata.combining(char)
        )

        normalized = self._remove_extra_whitespaces(normalized)

        return normalized

    def _apply_font_mappings(self, text: str) -> str:
        result = []
        for char in text:
            result.append(self.font_mappings.get(char, char))
        return "".join(result)

    def _remove_extra_whitespaces(self, text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        return text.strip()
