"""상품 검색용 구조화 질의 파서."""

from __future__ import annotations

from services.chatbot.search.query_normalizer import normalize_text, tokenize_text
from services.product_search.models import ParsedSearchQuery, ProductSearchDictionarySnapshot
from services.product_search.negative_rules import (
    NEGATIVE_OPERATOR_PREFIXES,
    NEGATIVE_OPERATOR_SUFFIXES,
    NEGATIVE_OPERATOR_TOKENS,
)

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
        # 파서는 "한 번 구조화된 토큰은 다시 다른 의미로 재사용하지 않는다"를 기본 원칙으로 둔다.
        # 그래서 covered_indices를 앞 단계에서 채우고, 뒤 단계는 남은 토큰만 해석한다.
        # 우선순위는 brand/category/product_type -> negative ingredient -> line/attribute -> positive ingredient -> residual keyword 순서다.
        # 이 순서를 유지해야 "향료 없는 토너" 같은 질의에서 토너는 타입으로, 향료 없는은 negative ingredient로 분리되고,
        # line이나 attribute가 동일 토큰을 다시 집어가는 일이 줄어든다.
        normalized = normalize_text(query_text)
        tokens = tokenize_text(normalized)
        if not tokens:
            return ParsedSearchQuery(original=query_text, normalized=normalized)

        covered_indices: set[int] = set()
        brand_terms = self._match_lookup(tokens, snapshot.brand_lookup, covered_indices)
        category_terms = self._match_lookup(tokens, snapshot.category_lookup, covered_indices)
        product_type_terms = self._match_lookup(tokens, snapshot.product_type_lookup, covered_indices)
        negative_terms, negative_covered_indices = self._extract_negative_ingredient_terms(
            tokens,
            snapshot.ingredient_lookup,
            snapshot.ingredient_expansion_lookup,
            covered_indices,
        )
        line_terms = self._match_lookup(tokens, snapshot.line_lookup, set(covered_indices))
        attribute_group_covered = set(covered_indices)
        attribute_group_terms = self._match_lookup(
            tokens,
            snapshot.attribute_group_lookup,
            attribute_group_covered,
        )
        attribute_terms = self._match_lookup(tokens, snapshot.attribute_lookup, set(covered_indices))
        single_token_ambiguous_override = bool(
            len(tokens) == 1
            and not brand_terms
            and not category_terms
            and not product_type_terms
            and not negative_terms
            and self._lookup_phrase(normalized, snapshot.ambiguous_term_lookup)
        )
        ingredient_terms, ingredient_covered_indices = self._extract_positive_ingredient_terms(
            tokens,
            snapshot.ingredient_lookup,
            snapshot.ingredient_expansion_lookup,
            covered_indices | negative_covered_indices,
            defer_single_token_match=single_token_ambiguous_override,
        )
        line_terms = self._filter_stopword_matches(line_terms, snapshot.stopwords)
        attribute_terms = self._filter_stopword_matches(attribute_terms, snapshot.stopwords)

        keyword_terms: list[str] = []
        seen_keywords: set[str] = set()
        # keyword는 최종 잔여 영역이다.
        # 이미 구조화된 토큰, 조사 제거 후 비는 토큰, noise token, stopword는 모두 제외하고
        # 나머지만 자유어 relevance 신호로 남긴다.
        keyword_covered_indices = covered_indices | negative_covered_indices | ingredient_covered_indices
        for index, token in enumerate(tokens):
            normalized_token = normalize_text(token)
            if normalized_token not in snapshot.ingredient_lookup:
                normalized_token = self._strip_particle(normalized_token)
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
        # 긴 phrase부터 먼저 본다.
        # "라운드랩 토너"가 있을 때 "라운드랩", "토너"를 먼저 먹어버리면 다중 토큰 엔티티를 놓치기 쉽기 때문이다.
        # 한 번 match된 구간은 covered_indices로 막아 중복 구조화를 방지한다.
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
        # lookup은 generated/manual dictionary의 정규화된 alias 집합을 본다.
        # 여기서는 원문 그대로, 조사 제거 버전, 공백 압축 버전을 차례대로 시도해
        # "라운드 랩", "라운드랩", "토너를" 같은 입력 흔들림을 흡수한다.
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
        # residual keyword나 ingredient target을 볼 때 조사 때문에 매칭이 깨지는 경우가 많아서
        # product_search에서는 얕은 조사 stripping을 사용한다.
        # 다만 1글자 토큰까지 무조건 깎으면 의미가 사라질 수 있으므로 최소 길이 2는 유지한다.
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
        ingredient_lookup: dict[str, str],
        ingredient_expansion_lookup: dict[str, tuple[str, ...]],
        blocked_indices: set[int],
    ) -> tuple[list[str], set[int]]:
        # negative ingredient는 "operator는 수동 규칙, target ingredient는 generated dictionary" 원칙으로 처리한다.
        # 즉 "없는/프리/무첨가" 같은 문법은 코드에 두고, "향료/판테놀/에탄올" 같은 타깃은 ingredient_lookup으로 찾는다.
        # blocked_indices를 받는 이유는 brand/category/product_type으로 이미 잡힌 토큰에
        # negative operator를 덮어씌우지 않기 위해서다.
        matches: list[str] = []
        covered_indices: set[int] = set()
        seen: set[str] = set()

        for index, token in enumerate(tokens):
            if index in blocked_indices:
                continue
            normalized_token = normalize_text(token)
            stripped_token = self._strip_particle(normalized_token)

            canonical = None
            local_covered = {index}
            if normalized_token in NEGATIVE_OPERATOR_TOKENS and index > 0:
                canonical, target_indices = self._lookup_negative_target(
                    tokens,
                    ingredient_lookup,
                    ingredient_expansion_lookup,
                    index - 1,
                    blocked_indices,
                )
                local_covered.update(target_indices)
            elif stripped_token in NEGATIVE_OPERATOR_TOKENS and index > 0:
                # "향료 없는"처럼 연산자가 독립 토큰인 경우, 바로 앞 1~2 token에서 ingredient target을 찾는다.
                canonical, target_indices = self._lookup_negative_target(
                    tokens,
                    ingredient_lookup,
                    ingredient_expansion_lookup,
                    index - 1,
                    blocked_indices,
                )
                local_covered.update(target_indices)
            else:
                # "향료프리", "무향료"처럼 한 token에 operator가 붙은 패턴도 따로 본다.
                for suffix in NEGATIVE_OPERATOR_SUFFIXES:
                    if normalized_token.endswith(suffix) and len(normalized_token) > len(suffix):
                        canonical = self._resolve_ingredient_term(
                            normalized_token[: -len(suffix)],
                            ingredient_lookup,
                            ingredient_expansion_lookup,
                        )
                        break
                    if stripped_token.endswith(suffix) and len(stripped_token) > len(suffix):
                        canonical = self._resolve_ingredient_term(
                            stripped_token[: -len(suffix)],
                            ingredient_lookup,
                            ingredient_expansion_lookup,
                        )
                        break
                if canonical is None:
                    canonical = self._extract_negative_ingredient_from_compound(
                        stripped_token,
                        ingredient_lookup,
                        ingredient_expansion_lookup,
                    )

            if canonical and canonical not in seen:
                seen.add(canonical)
                matches.append(canonical)
                covered_indices.update(local_covered)

        return matches, covered_indices

    def _extract_negative_ingredient_from_compound(
        self,
        token: str,
        ingredient_lookup: dict[str, str],
        ingredient_expansion_lookup: dict[str, tuple[str, ...]],
    ) -> str | None:
        # compound 형태는 suffix/prefix를 모두 지원한다.
        # 예: 향료프리, 에탄올free, 무향료, withoutfragrance
        # 반대로 "없는"은 대부분 독립 토큰으로 쓰이므로 여기서는 제외한다.
        for operator in NEGATIVE_OPERATOR_TOKENS:
            if operator in {"without", "없는"}:
                continue
            if token.endswith(operator) and len(token) > len(operator):
                candidate = token[: -len(operator)]
                canonical = self._resolve_ingredient_term(
                    candidate,
                    ingredient_lookup,
                    ingredient_expansion_lookup,
                )
                if canonical:
                    return canonical
        for prefix in NEGATIVE_OPERATOR_PREFIXES:
            if token.startswith(prefix) and len(token) > len(prefix):
                canonical = self._resolve_ingredient_term(
                    token[len(prefix) :],
                    ingredient_lookup,
                    ingredient_expansion_lookup,
                )
                if canonical:
                    return canonical
        return None

    def _extract_positive_ingredient_terms(
        self,
        tokens: list[str],
        ingredient_lookup: dict[str, str],
        ingredient_expansion_lookup: dict[str, tuple[str, ...]],
        blocked_indices: set[int],
        defer_single_token_match: bool = False,
    ) -> tuple[list[str], set[int]]:
        # positive ingredient는 negative로 이미 소비된 토큰과 앞선 structured token을 제외한 뒤 본다.
        # 그래야 "향료 없는 토너"가 positive ingredient=향료로도 동시에 잡히는 충돌을 막을 수 있다.
        if not ingredient_lookup or defer_single_token_match:
            return [], set()

        matches: list[str] = []
        seen: set[str] = set()
        covered_indices: set[int] = set()
        max_window = min(2, len(tokens))
        for window in range(max_window, 0, -1):
            for start in range(0, len(tokens) - window + 1):
                end = start + window
                if any(index in blocked_indices for index in range(start, end)):
                    continue
                phrase = normalize_text(" ".join(tokens[start:end]))
                canonical = self._resolve_ingredient_term(
                    phrase,
                    ingredient_lookup,
                    ingredient_expansion_lookup,
                )
                if not canonical or canonical in seen:
                    continue
                seen.add(canonical)
                matches.append(canonical)
                covered_indices.update(range(start, end))
        return matches, covered_indices

    def _lookup_negative_target(
        self,
        tokens: list[str],
        ingredient_lookup: dict[str, str],
        ingredient_expansion_lookup: dict[str, tuple[str, ...]],
        end_index: int,
        blocked_indices: set[int],
    ) -> tuple[str | None, set[int]]:
        # operator 앞 target은 최대 2 token window까지만 본다.
        # 지금 문서 범위에서는 긴 명사구보다 짧은 성분명 중심이므로 과도한 확장은 오탐을 늘릴 가능성이 더 크다.
        max_window = min(2, end_index + 1)
        for window in range(max_window, 0, -1):
            start = end_index - window + 1
            if any(index in blocked_indices for index in range(start, end_index + 1)):
                continue
            phrase = normalize_text(" ".join(tokens[start : end_index + 1]))
            canonical = self._resolve_ingredient_term(
                phrase,
                ingredient_lookup,
                ingredient_expansion_lookup,
            )
            if canonical:
                return canonical, set(range(start, end_index + 1))
        fallback = self._resolve_ingredient_term(
            tokens[end_index],
            ingredient_lookup,
            ingredient_expansion_lookup,
        )
        return fallback, {end_index} if fallback else set()

    def _resolve_ingredient_term(
        self,
        phrase: str,
        ingredient_lookup: dict[str, str],
        ingredient_expansion_lookup: dict[str, tuple[str, ...]],
    ) -> str | None:
        # 우선 canonical lookup을 시도하고, 없으면 최소한의 fallback으로 raw normalized token을 허용한다.
        # 이 fallback은 사용자가 DB 성분명과 거의 같은 단어를 입력했는데 generated top-N에 아직 안 올라오지 않은 경우를 버티기 위한 것이다.
        # 다만 너무 짧은 token은 오탐을 만들기 쉬워 길이 2 이상만 허용한다.
        normalized = normalize_text(phrase)
        if normalized in ingredient_expansion_lookup:
            return normalized
        stripped = self._strip_particle(normalized)
        if stripped in ingredient_expansion_lookup:
            return stripped
        canonical = self._lookup_phrase(phrase, ingredient_lookup)
        if canonical:
            return canonical
        return None


product_search_query_parser = ProductSearchQueryParser()
