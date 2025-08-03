import re
from typing import List, Tuple, Optional
from abc import ABC, abstractmethod

class StringMatcher(ABC):
    
    @abstractmethod
    def search(self, text: str, patterns: List[str]) -> List[Tuple[str, List[int]]]:
        pass

class RegexMatcher(StringMatcher):
    def __init__(self):
        self.gambling_pattern = r'\b[a-zA-Z]+\d{2,3}\b'
    
    def search(self, text: str, patterns: List[str] = None) -> List[Tuple[str, List[int]]]:
        results = []
        
        matches = []
        matched_strings = []
        for match in re.finditer(self.gambling_pattern, text, re.IGNORECASE):
            matches.append(match.start())
            matched_strings.append(match.group())
        
        if matches:
            unique_matches = {}
            for i, pos in enumerate(matches):
                matched_str = matched_strings[i]
                if matched_str not in unique_matches:
                    unique_matches[matched_str] = []
                unique_matches[matched_str].append(pos)
            
            for matched_str, positions in unique_matches.items():
                results.append((matched_str, positions))
        
        return results

class KMPMatcher(StringMatcher):
    def _compute_lps(self, pattern: str) -> List[int]:
        m = len(pattern)
        lps = [0] * m
        length = 0
        i = 1
        
        while i < m:
            if pattern[i] == pattern[length]:
                length += 1
                lps[i] = length
                i += 1
            else:
                if length != 0:
                    length = lps[length - 1]
                else:
                    lps[i] = 0
                    i += 1
        return lps
    
    def _kmp_search(self, text: str, pattern: str) -> List[int]:
        if not pattern:
            return []
        
        text_lower = text.lower()
        pattern_lower = pattern.lower()
        
        n = len(text_lower)
        m = len(pattern_lower)
        
        lps = self._compute_lps(pattern_lower)
        matches = []
        
        i = 0  # index for text
        j = 0  # index for pattern
        
        while i < n:
            if pattern_lower[j] == text_lower[i]:
                i += 1
                j += 1
            
            if j == m:
                matches.append(i - j)
                j = lps[j - 1]
            elif i < n and pattern_lower[j] != text_lower[i]:
                if j != 0:
                    j = lps[j - 1]
                else:
                    i += 1
        
        return matches
    
    def search(self, text: str, patterns: List[str]) -> List[Tuple[str, List[int]]]:
        results = []
        for pattern in patterns:
            positions = self._kmp_search(text, pattern.strip())
            if positions:
                results.append((pattern.strip(), positions))
        return results

class BoyerMooreMatcher(StringMatcher):
    def _build_bad_char_table(self, pattern: str) -> dict:
        table = {}
        for i in range(len(pattern)):
            table[pattern[i]] = i
        return table
    
    def _boyer_moore_search(self, text: str, pattern: str) -> List[int]:
        if not pattern:
            return []
        
        text_lower = text.lower()
        pattern_lower = pattern.lower()
        
        n = len(text_lower)
        m = len(pattern_lower)
        
        bad_char = self._build_bad_char_table(pattern_lower)
        matches = []
        
        s = 0  # shift of the pattern with respect to text
        
        while s <= n - m:
            j = m - 1
            
            while j >= 0 and pattern_lower[j] == text_lower[s + j]:
                j -= 1
            
            if j < 0:
                matches.append(s)
                s += (m - bad_char.get(text_lower[s + m], -1) - 1) if s + m < n else 1
            else:
                s += max(1, j - bad_char.get(text_lower[s + j], -1))
        
        return matches
    
    def search(self, text: str, patterns: List[str]) -> List[Tuple[str, List[int]]]:
        """Search for multiple patterns using Boyer-Moore"""
        results = []
        for pattern in patterns:
            positions = self._boyer_moore_search(text, pattern.strip())
            if positions:
                results.append((pattern.strip(), positions))
        return results

class RabinKarpMatcher(StringMatcher):
    def __init__(self, base: int = 256, prime: int = 101):
        self.base = base
        self.prime = prime
    
    def _hash(self, s: str, length: int) -> int:
        h = 0
        for i in range(length):
            h = (h * self.base + ord(s[i])) % self.prime
        return h
    
    def _rabin_karp_search(self, text: str, pattern: str) -> List[int]:
        if not pattern:
            return []
        
        text_lower = text.lower()
        pattern_lower = pattern.lower()
        
        n = len(text_lower)
        m = len(pattern_lower)
        
        if m > n:
            return []
        
        matches = []
        
        pattern_hash = self._hash(pattern_lower, m)
        text_hash = self._hash(text_lower, m)
        
        h = 1
        for i in range(m - 1):
            h = (h * self.base) % self.prime
        
        for i in range(n - m + 1):
            if pattern_hash == text_hash:
                if text_lower[i:i + m] == pattern_lower:
                    matches.append(i)
            
            if i < n - m:
                text_hash = (self.base * (text_hash - ord(text_lower[i]) * h) + ord(text_lower[i + m])) % self.prime
                if text_hash < 0:
                    text_hash += self.prime
        
        return matches
    
    def search(self, text: str, patterns: List[str]) -> List[Tuple[str, List[int]]]:
        results = []
        for pattern in patterns:
            positions = self._rabin_karp_search(text, pattern.strip())
            if positions:
                results.append((pattern.strip(), positions))
        return results

class StringMatchingFactory:
    @staticmethod
    def create_matcher(algorithm_type: str) -> StringMatcher:
        matchers = {
            'regex': RegexMatcher,
            'kmp': KMPMatcher,
            'boyer_moore': BoyerMooreMatcher,
            'rabin_karp': RabinKarpMatcher
        }
        
        matcher_class = matchers.get(algorithm_type.lower())
        if not matcher_class:
            raise ValueError(f"Unknown algorithm type: {algorithm_type}")
        
        return matcher_class()