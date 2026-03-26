"""Structured query parsing for product search."""

from __future__ import annotations

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

        covered_indices: set[int] = set()
        brand_terms = self._match_lookup(tokens, snapshot.brand_lookup, covered_indices)
        category_terms = self._match_lookup(tokens, snapshot.category_lookup, covered_indices)
        product_type_terms = self._match_lookup(tokens, snapshot.product_type_lookup, covered_indices)
        line_terms = self._match_lookup(tokens, snapshot.line_lookup, covered_indices)
        attribute_group_covered = set(covered_indices)
        attribute_group_terms = self._match_lookup(
            tokens,
            snapshot.attribute_group_lookup,
            attribute_group_covered,
        )
        attribute_terms = self._match_lookup(tokens, snapshot.attribute_lookup, covered_indices)
        line_terms = self._filter_stopword_matches(line_terms, snapshot.stopwords)
        attribute_terms = self._filter_stopword_matches(attribute_terms, snapshot.stopwords)

        keyword_terms: list[str] = []
        seen_keywords: set[str] = set()
        keyword_covered_indices = covered_indices | attribute_group_covered
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


product_search_query_parser = ProductSearchQueryParser()
