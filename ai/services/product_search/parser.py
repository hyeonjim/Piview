"""Structured query parsing for product search."""

from __future__ import annotations

from services.chatbot.retrieval.parsers import canonicalize_avoid_term
from services.chatbot.search.query_normalizer import normalize_text, tokenize_text
from services.product_search.models import ParsedSearchQuery, ProductSearchDictionarySnapshot

_QUERY_NOISE_TOKENS = {
    "중",
    "중에",
    "사이",
    "간",
}
_TRAILING_PARTICLES = (
    "으로",
    "에서",
    "이랑",
    "하고",
    "처럼",
    "보다",
    "까지",
    "부터",
    "에게",
    "중에",
    "중",
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "에",
    "도",
    "만",
    "와",
    "과",
    "로",
    "랑",
)
_NEGATIVE_OPERATORS = {
    "없는",
    "무첨가",
    "프리",
    "제외",
    "without",
}
_NEGATIVE_OPERATOR_SUFFIXES = (
    "프리",
    "free",
)
_POSITIVE_INGREDIENT_ALIASES: dict[str, tuple[str, ...]] = {
    "판테놀": ("판테놀", "panthenol"),
    "나이아신아마이드": ("나이아신아마이드", "niacinamide"),
    "시카": ("시카", "cica"),
}


class ProductSearchQueryParser:
    def parse(
        self,
        query_text: str,
        snapshot: ProductSearchDictionarySnapshot,
    ) -> ParsedSearchQuery:
        normalized = normalize_text(query_text)
        tokens = tokenize_text(normalized)
        if not tokens:
            return ParsedSearchQuery(original=query_text, normalized=normalized)

        negative_terms, negative_covered_indices = self._extract_negative_ingredient_terms(tokens)
        covered_indices: set[int] = set()
        brand_terms = self._match_lookup(tokens, snapshot.brand_lookup, covered_indices)
        category_terms = self._match_lookup(tokens, snapshot.category_lookup, covered_indices)
        product_type_terms = self._match_lookup(tokens, snapshot.product_type_lookup, covered_indices)
        line_terms = self._match_lookup(tokens, snapshot.line_lookup, set(covered_indices))
        attribute_group_covered = set(covered_indices)
        attribute_group_terms = self._match_lookup(
            tokens,
            snapshot.attribute_group_lookup,
            attribute_group_covered,
        )
        attribute_terms = self._match_lookup(tokens, snapshot.attribute_lookup, set(covered_indices))
        ingredient_terms = self._extract_positive_ingredient_terms(tokens, covered_indices | negative_covered_indices)
        line_terms = self._filter_stopword_matches(line_terms, snapshot.stopwords)
        attribute_terms = self._filter_stopword_matches(attribute_terms, snapshot.stopwords)

        keyword_terms: list[str] = []
        seen_keywords: set[str] = set()
        keyword_covered_indices = covered_indices | negative_covered_indices
        for index, token in enumerate(tokens):
            normalized_token = self._strip_particle(normalize_text(token))
            if (
                index in keyword_covered_indices
                or not normalized_token
                or normalized_token in _QUERY_NOISE_TOKENS
                or normalized_token in snapshot.stopwords
                or normalized_token in seen_keywords
            ):
                continue
            seen_keywords.add(normalized_token)
            keyword_terms.append(normalized_token)

        return ParsedSearchQuery(
            original=query_text,
            normalized=normalized,
            brand_terms=tuple(brand_terms),
            category_terms=tuple(category_terms),
            product_type_terms=tuple(product_type_terms),
            line_terms=tuple(line_terms),
            ingredient_terms=tuple(ingredient_terms),
            negative_ingredient_terms=tuple(negative_terms),
            attribute_terms=tuple(attribute_terms),
            attribute_group_terms=tuple(attribute_group_terms),
            keyword_terms=tuple(keyword_terms),
        )

    def _filter_stopword_matches(
        self,
        matches: list[str],
        stopwords: frozenset[str],
    ) -> list[str]:
        return [
            match
            for match in matches
            if match and normalize_text(match) not in stopwords
        ]

    def _match_lookup(
        self,
        tokens: list[str],
        lookup: dict[str, str],
        covered_indices: set[int],
    ) -> list[str]:
        matches: list[str] = []
        seen: set[str] = set()
        max_window = min(4, len(tokens))

        for window in range(max_window, 0, -1):
            for start in range(0, len(tokens) - window + 1):
                end = start + window
                if any(index in covered_indices for index in range(start, end)):
                    continue
                phrase = normalize_text(" ".join(tokens[start:end]))
                canonical = self._lookup_phrase(phrase, lookup)
                if not canonical:
                    continue
                if canonical not in seen:
                    seen.add(canonical)
                    matches.append(canonical)
                covered_indices.update(range(start, end))
        return matches

    def _lookup_phrase(self, phrase: str, lookup: dict[str, str]) -> str | None:
        normalized = normalize_text(phrase)
        if not normalized:
            return None
        candidates = [normalized]
        stripped = " ".join(self._strip_particle(token) for token in normalized.split())
        stripped = normalize_text(stripped)
        if stripped and stripped not in candidates:
            candidates.append(stripped)
        compact_stripped = stripped.replace(" ", "")
        if compact_stripped and compact_stripped not in candidates:
            candidates.append(compact_stripped)

        for candidate in candidates:
            canonical = lookup.get(candidate)
            if canonical:
                return canonical
        return None

    def _strip_particle(self, token: str) -> str:
        normalized = normalize_text(token)
        previous = None
        while normalized and previous != normalized:
            previous = normalized
            for particle in _TRAILING_PARTICLES:
                if normalized.endswith(particle) and len(normalized) - len(particle) >= 2:
                    normalized = normalized[: -len(particle)]
                    break
        return normalized

    def _extract_negative_ingredient_terms(
        self,
        tokens: list[str],
    ) -> tuple[list[str], set[int]]:
        matches: list[str] = []
        covered_indices: set[int] = set()
        seen: set[str] = set()

        for index, token in enumerate(tokens):
            normalized_token = normalize_text(token)
            stripped_token = self._strip_particle(normalized_token)

            canonical = None
            local_covered = {index}
            if stripped_token in _NEGATIVE_OPERATORS and index > 0:
                canonical = canonicalize_avoid_term(tokens[index - 1])
                local_covered.add(index - 1)
            else:
                for suffix in _NEGATIVE_OPERATOR_SUFFIXES:
                    if stripped_token.endswith(suffix) and len(stripped_token) > len(suffix):
                        canonical = canonicalize_avoid_term(stripped_token[: -len(suffix)])
                        break
                if canonical is None:
                    canonical = self._extract_negative_ingredient_from_compound(stripped_token)
                if canonical is None and stripped_token.startswith("무"):
                    canonical = canonicalize_avoid_term(stripped_token)

            if canonical and canonical not in seen:
                seen.add(canonical)
                matches.append(canonical)
                covered_indices.update(local_covered)

        return matches, covered_indices

    def _extract_negative_ingredient_from_compound(self, token: str) -> str | None:
        for operator in _NEGATIVE_OPERATORS:
            if operator == "without":
                continue
            if token.endswith(operator) and len(token) > len(operator):
                candidate = token[: -len(operator)]
                canonical = canonicalize_avoid_term(candidate)
                if canonical:
                    return canonical
        if token.startswith("without") and len(token) > len("without"):
            return canonicalize_avoid_term(token[len("without") :])
        return None

    def _extract_positive_ingredient_terms(
        self,
        tokens: list[str],
        blocked_indices: set[int],
    ) -> list[str]:
        lookup = self._positive_ingredient_lookup()
        if not lookup:
            return []

        matches: list[str] = []
        seen: set[str] = set()
        max_window = min(2, len(tokens))
        for window in range(max_window, 0, -1):
            for start in range(0, len(tokens) - window + 1):
                end = start + window
                if any(index in blocked_indices for index in range(start, end)):
                    continue
                phrase = normalize_text(" ".join(tokens[start:end]))
                canonical = self._lookup_phrase(phrase, lookup)
                if not canonical or canonical in seen:
                    continue
                seen.add(canonical)
                matches.append(canonical)
        return matches

    def _positive_ingredient_lookup(self) -> dict[str, str]:
        lookup: dict[str, str] = {}
        for canonical, aliases in _POSITIVE_INGREDIENT_ALIASES.items():
            normalized_canonical = normalize_text(canonical)
            lookup[normalized_canonical] = normalized_canonical
            for alias in aliases:
                normalized_alias = normalize_text(alias)
                if normalized_alias:
                    lookup[normalized_alias] = normalized_canonical
        return lookup


product_search_query_parser = ProductSearchQueryParser()
