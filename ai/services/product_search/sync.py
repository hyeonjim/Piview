"""상품 검색용 사전 생성 및 동기화."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import re
from typing import Iterable

from services.chatbot.search.product_data import (
    ProductSearchDataRow,
    normalize_whitespace,
    product_search_data_repository,
)
from services.chatbot.search.query_normalizer import normalize_text, tokenize_text
from services.product_search.models import DictionaryEntry


_DICTIONARY_DIR = Path(__file__).resolve().parent / "dictionaries"
_GENERATED_DIR = _DICTIONARY_DIR / "generated"
_MANUAL_DIR = _DICTIONARY_DIR / "manual"
_GENERATED_FILES = {
    "brands": _GENERATED_DIR / "brands.generated.json",
    "categories": _GENERATED_DIR / "categories.generated.json",
    "product_types": _GENERATED_DIR / "product_types.generated.json",
    "ingredients": _GENERATED_DIR / "ingredients.generated.json",
    "line_terms": _GENERATED_DIR / "line_terms.generated.json",
    "attributes": _GENERATED_DIR / "attributes.generated.json",
}
_STOPWORDS_FILE = _MANUAL_DIR / "stopwords.json"

_DEFAULT_STOPWORDS = [
    "추천",
    "제품",
    "상품",
    "화장품",
    "좋은",
    "해주세요",
    "해줘",
    "원해",
    "필요",
    "관련",
    "사용",
    "있는",
    "없는",
    "정도",
    "느낌",
    "처럼",
]
_GENERIC_NOISE = {
    "기획",
    "단품",
    "본품",
    "정품",
    "세트",
    "리필",
    "대용량",
    "한정",
    "스페셜",
    "기본",
    "데일리",
}
_PRODUCT_TYPE_MIN_FREQUENCY = 3
_PRODUCT_TYPE_LIMIT = 200
_INGREDIENT_MIN_FREQUENCY = 1
_INGREDIENT_LIMIT = 5000
_LINE_TERM_MIN_FREQUENCY = 3
_LINE_TERM_LIMIT = 300
_ATTRIBUTE_MIN_FREQUENCY = 5
_ATTRIBUTE_LIMIT = 300
_ATTRIBUTE_CONCERN_WEIGHT = 5
_ATTRIBUTE_EXCLUDED_TERMS = {
    "효과",
    "개선",
    "도움",
    "도움을",
    "공급",
    "선사",
    "강화",
    "유지",
    "함유",
    "함유로",
    "함유된",
    "함유되어",
    "성분이",
    "성분으로",
    "제품은",
    "제품입니다",
    "리뉴얼된",
    "담은",
}
_ATTRIBUTE_EXCLUDED_SUFFIXES = (
    "입니다",
    "합니다",
    "됩니다",
    "됩니다",
    "되는",
    "하는",
    "주는",
    "주는",
    "줍니다",
    "하여",
    "해서",
    "하고",
    "적인",
    "으로",
    "에서",
    "에게",
    "까지",
    "부터",
    "없이",
    "말고",
    "처럼",
    "같은",
    "스럽게",
)
_ATTRIBUTE_PARTICLE_SUFFIXES = (
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "에",
    "의",
    "와",
    "과",
    "로",
    "도",
    "만",
)


class ProductSearchDictionarySyncer:
    def __init__(self) -> None:
        self.dictionary_dir = _DICTIONARY_DIR

    def sync(self) -> dict[str, int]:
        # generated dictionary는 product DB를 한 번 훑어 런타임 lookup-friendly 형태로 압축한 결과물이다.
        # 순서는 brand/category -> product_type -> ingredient -> line -> attribute 로 잡는다.
        # 뒤 단계일수록 앞 단계에서 이미 canonical entity로 확정된 term을 blocked_terms로 빼서
        # 같은 표면형이 여러 축에 중복 등장하는 문제를 줄인다.
        self._ensure_seed_files()
        rows = product_search_data_repository.fetch_products_for_indexing()
        stopwords = self._load_stopwords()

        brands = self._build_brand_entries(rows)
        categories = self._build_category_entries(rows)
        brand_terms = self._normalized_terms(brands)
        category_terms = self._normalized_terms(categories)

        product_types = self._build_product_type_entries(
            rows=rows,
            stopwords=stopwords,
            brand_terms=brand_terms,
            category_terms=category_terms,
        )
        product_type_terms = self._normalized_terms(product_types)

        ingredients = self._build_ingredient_entries(
            rows=rows,
            stopwords=stopwords,
            blocked_terms=brand_terms | category_terms | product_type_terms,
        )
        ingredient_terms = self._normalized_terms(ingredients)

        line_terms = self._build_line_term_entries(
            rows=rows,
            stopwords=stopwords,
            blocked_terms=brand_terms | category_terms | product_type_terms | ingredient_terms,
        )
        line_term_values = self._normalized_terms(line_terms)

        attributes = self._build_attribute_entries(
            rows=rows,
            stopwords=stopwords,
            blocked_terms=brand_terms | category_terms | product_type_terms | ingredient_terms | line_term_values,
        )

        generated_at = datetime.now(timezone.utc).isoformat()
        self._write_generated("brands", brands, generated_at)
        self._write_generated("categories", categories, generated_at)
        self._write_generated("product_types", product_types, generated_at)
        self._write_generated("ingredients", ingredients, generated_at)
        self._write_generated("line_terms", line_terms, generated_at)
        self._write_generated("attributes", attributes, generated_at)

        return {
            "brands": len(brands),
            "categories": len(categories),
            "product_types": len(product_types),
            "ingredients": len(ingredients),
            "line_terms": len(line_terms),
            "attributes": len(attributes),
            "products": len(rows),
        }

    def _ensure_seed_files(self) -> None:
        # manual seed가 없더라도 서비스가 바로 부팅될 수 있게 기본 stopword 파일은 보장한다.
        self.dictionary_dir.mkdir(parents=True, exist_ok=True)
        _GENERATED_DIR.mkdir(parents=True, exist_ok=True)
        _MANUAL_DIR.mkdir(parents=True, exist_ok=True)
        if not _STOPWORDS_FILE.exists():
            _STOPWORDS_FILE.write_text(
                json.dumps(_DEFAULT_STOPWORDS, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

    def _load_stopwords(self) -> set[str]:
        try:
            raw = json.loads(_STOPWORDS_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            raw = _DEFAULT_STOPWORDS

        stopwords: set[str] = set()
        for value in raw:
            normalized = normalize_text(str(value))
            if normalized:
                stopwords.add(normalized)
        stopwords.update(_GENERIC_NOISE)
        return stopwords

    def _build_brand_entries(self, rows: list[ProductSearchDataRow]) -> list[DictionaryEntry]:
        counts = Counter(
            normalize_whitespace(row.brand_name)
            for row in rows
            if row.brand_name and normalize_whitespace(row.brand_name)
        )
        return self._entries_from_counter(counts)

    def _build_category_entries(self, rows: list[ProductSearchDataRow]) -> list[DictionaryEntry]:
        counter: Counter[str] = Counter()
        aliases_by_name: dict[str, set[str]] = {}
        for row in rows:
            category_name = normalize_whitespace(row.category_name)
            if not category_name:
                continue
            counter[category_name] += 1
            aliases = aliases_by_name.setdefault(category_name, set())
            aliases.add(category_name)
            aliases.update(self._split_category_aliases(category_name))

        entries: list[DictionaryEntry] = []
        for name, frequency in counter.most_common():
            aliases = tuple(sorted({normalize_whitespace(alias) for alias in aliases_by_name[name] if alias}))
            entries.append(DictionaryEntry(canonical=name, aliases=aliases, frequency=frequency))
        return entries

    def _build_product_type_entries(
        self,
        rows: list[ProductSearchDataRow],
        stopwords: set[str],
        brand_terms: set[str],
        category_terms: set[str],
    ) -> list[DictionaryEntry]:
        # product type은 category token과 상품명 terminal token을 함께 본다.
        # category에서 반복되는 token은 타입일 가능성이 높고,
        # 상품명 맨 끝 token은 "토너/크림/세럼"처럼 타입이 붙는 패턴이 많다.
        terminal_counter: Counter[str] = Counter()
        category_token_counter: Counter[str] = Counter()

        for row in rows:
            if row.category_name:
                for token in tokenize_text(row.category_name):
                    normalized = normalize_text(token)
                    if self._is_valid_term(normalized, stopwords, brand_terms):
                        category_token_counter[normalized] += 1

            tokens = tokenize_text(row.name)
            if not tokens:
                continue
            terminal = normalize_text(tokens[-1])
            if self._is_valid_term(terminal, stopwords, brand_terms | category_terms):
                terminal_counter[terminal] += 1

        combined: Counter[str] = Counter()
        for token, frequency in category_token_counter.items():
            if frequency >= 2:
                combined[token] += frequency * 2
        for token, frequency in terminal_counter.items():
            if frequency >= _PRODUCT_TYPE_MIN_FREQUENCY:
                combined[token] += frequency
        return self._entries_from_counter(
            combined,
            min_frequency=_PRODUCT_TYPE_MIN_FREQUENCY,
            limit=_PRODUCT_TYPE_LIMIT,
        )

    def _build_line_term_entries(
        self,
        rows: list[ProductSearchDataRow],
        stopwords: set[str],
        blocked_terms: set[str],
    ) -> list[DictionaryEntry]:
        # line은 상품명 token 전체를 후보로 보지만,
        # 이미 브랜드/카테고리/타입/ingredient로 더 잘 설명되는 token은 제외한다.
        # 이번 contract에서는 line을 structured intent로 적극 승격하지 않기 때문에
        # 여기서도 과도한 범용 토큰이 섞이지 않도록 보수적으로 만든다.
        counter: Counter[str] = Counter()
        for row in rows:
            for token in tokenize_text(row.name):
                normalized = normalize_text(token)
                if self._is_valid_term(normalized, stopwords, blocked_terms):
                    counter[normalized] += 1
        return self._entries_from_counter(
            counter,
            min_frequency=_LINE_TERM_MIN_FREQUENCY,
            limit=_LINE_TERM_LIMIT,
        )

    def _build_ingredient_entries(
        self,
        rows: list[ProductSearchDataRow],
        stopwords: set[str],
        blocked_terms: set[str],
    ) -> list[DictionaryEntry]:
        # ingredient는 DB 전성분 문자열 자체를 source of truth로 사용한다.
        # product_search는 임의 예시 alias보다 DB/generated dictionary를 우선해야 relevance drift가 적다.
        # 한글/영문 전성분을 모두 읽어 canonical entry를 만들고, 빈도 상한만 둔다.
        counter: Counter[str] = Counter()
        for row in rows:
            for source in (row.ingredient_text_ko, row.ingredient_text_en):
                for ingredient in self._split_ingredient_terms(source):
                    normalized = normalize_text(ingredient)
                    if self._is_valid_ingredient_term(normalized, stopwords, blocked_terms):
                        counter[normalized] += 1
        return self._entries_from_counter(
            counter,
            min_frequency=_INGREDIENT_MIN_FREQUENCY,
            limit=_INGREDIENT_LIMIT,
        )

    def _build_attribute_entries(
        self,
        rows: list[ProductSearchDataRow],
        stopwords: set[str],
        blocked_terms: set[str],
    ) -> list[DictionaryEntry]:
        # attribute는 concern tag, description, product name에서 약한 의미 신호를 뽑아낸다.
        # 직접적인 엔티티보다 노이즈가 많아서 concern tag에 가중치를 더 주고,
        # excluded term/suffix 규칙으로 문장형 표현을 가능한 많이 제거한다.
        counter: Counter[str] = Counter()
        for row in rows:
            for concern in row.concern_names:
                normalized = normalize_text(concern)
                if self._is_valid_attribute_term(normalized, stopwords, blocked_terms):
                    counter[normalized] += _ATTRIBUTE_CONCERN_WEIGHT

            description = normalize_whitespace(row.description)
            if description:
                for token in tokenize_text(description):
                    normalized = normalize_text(token)
                    if self._is_valid_attribute_term(normalized, stopwords, blocked_terms):
                        counter[normalized] += 1

            for token in tokenize_text(row.name):
                normalized = normalize_text(token)
                if self._is_valid_attribute_term(normalized, stopwords, blocked_terms):
                    counter[normalized] += 1

        return self._entries_from_counter(
            counter,
            min_frequency=_ATTRIBUTE_MIN_FREQUENCY,
            limit=_ATTRIBUTE_LIMIT,
        )

    def _write_generated(
        self,
        key: str,
        entries: list[DictionaryEntry],
        generated_at: str,
    ) -> None:
        payload = {
            "generatedAt": generated_at,
            "itemCount": len(entries),
            "items": [
                {
                    "canonical": entry.canonical,
                    "aliases": list(entry.aliases),
                    "frequency": entry.frequency,
                }
                for entry in entries
            ],
        }
        _GENERATED_FILES[key].write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _split_category_aliases(self, category_name: str) -> set[str]:
        aliases = {category_name}
        normalized = normalize_whitespace(category_name)
        for separator in ("/", ",", "|", "·", "&"):
            normalized = normalized.replace(separator, " ")
        tokens = [normalize_whitespace(token) for token in normalized.split() if token.strip()]
        aliases.update(token for token in tokens if len(token) >= 2)
        return aliases

    def _entries_from_counter(
        self,
        counter: Counter[str],
        min_frequency: int = 1,
        limit: int | None = None,
    ) -> list[DictionaryEntry]:
        # generated dictionary는 alias 확장을 거의 하지 않고 canonical 그대로 저장한다.
        # lookup 단계의 정규화 책임은 registry/parser가 맡고,
        # sync는 "무엇이 사전에 들어갈지"만 안정적으로 결정하는 역할에 집중한다.
        entries: list[DictionaryEntry] = []
        for canonical, frequency in counter.most_common():
            normalized = normalize_whitespace(canonical)
            if not normalized or frequency < min_frequency:
                continue
            entries.append(DictionaryEntry(canonical=normalized, aliases=(normalized,), frequency=frequency))
            if limit is not None and len(entries) >= limit:
                break
        return entries

    def _split_ingredient_terms(self, text: str | None) -> list[str]:
        # 전성분은 쉼표로 가장 많이 구분되지만 "1,2-헥산다이올"처럼 성분명 내부의 comma도 있다.
        # 그래서 숫자 사이 comma는 보존하고, 일반 구분자만 잘라 ingredient candidate를 만든다.
        normalized = normalize_whitespace(text)
        if not normalized:
            return []

        parts = [
            part.strip(" '\"")
            for part in re.split(r"(?:\r?\n|;|,\s+|(?<!\d),(?!\d))", normalized)
            if part and part.strip(" '\"")
        ]
        if not parts:
            return [normalized]
        return parts

    def _normalized_terms(self, entries: Iterable[DictionaryEntry]) -> set[str]:
        # blocked_terms 계산용 helper다.
        # 이후 단계에서 "이미 더 상위 축에서 소비된 term"을 빼기 위해 canonical과 alias를 모두 set으로 만든다.
        values: set[str] = set()
        for entry in entries:
            values.add(normalize_text(entry.canonical))
            for alias in entry.aliases:
                normalized = normalize_text(alias)
                if normalized:
                    values.add(normalized)
        return values

    def _is_valid_term(
        self,
        term: str,
        stopwords: set[str],
        blocked_terms: set[str],
    ) -> bool:
        if not term or len(term) < 2:
            return False
        if term in stopwords or term in blocked_terms:
            return False
        if term.isdigit():
            return False
        if all(char.isdigit() or char == "%" for char in term):
            return False
        return True

    def _is_valid_attribute_term(
        self,
        term: str,
        stopwords: set[str],
        blocked_terms: set[str],
    ) -> bool:
        # attribute는 자연어 꼬리 표현이 많이 섞여서 일반 term 검증보다 더 강하게 필터링한다.
        # 예: "도움을", "함유되어", "좋은", "...적인" 같은 설명형 어미는 dictionary에 들어가면 안 된다.
        if not self._is_valid_term(term, stopwords, blocked_terms):
            return False
        if term in _ATTRIBUTE_EXCLUDED_TERMS:
            return False
        if any(term.endswith(suffix) and len(term) >= len(suffix) for suffix in _ATTRIBUTE_EXCLUDED_SUFFIXES):
            return False
        if any(term.endswith(suffix) and len(term) > len(suffix) + 1 for suffix in _ATTRIBUTE_PARTICLE_SUFFIXES):
            return False
        return True

    def _is_valid_ingredient_term(
        self,
        term: str,
        stopwords: set[str],
        blocked_terms: set[str],
    ) -> bool:
        # ingredient는 DB 원문을 최대한 보존해야 하므로 별도 blacklist는 최소화하고,
        # 명백히 이상한 길이의 token만 방어한다.
        if not self._is_valid_term(term, stopwords, blocked_terms):
            return False
        if len(term) > 120:
            return False
        return True


product_search_dictionary_syncer = ProductSearchDictionarySyncer()
