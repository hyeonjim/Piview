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
_INGREDIENT_ALIAS_LIMIT = 12
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
_INGREDIENT_TRAILING_SUFFIXES = (
    "추출발효여과물",
    "발효여과물",
    "꽃/잎/줄기추출물",
    "캘러스세포외소포",
    "캘러스배양추출물",
    "폴리사카라이드",
    "잎추출물",
    "꽃추출물",
    "뿌리추출물",
    "열매추출물",
    "줄기추출물",
    "씨추출물",
    "종자추출물",
    "껍질추출물",
    "잎오일",
    "잎가루",
    "잎즙",
    "잎수",
    "꽃가루",
    "꽃수",
    "꽃오일",
    "열매오일",
    "씨오일",
    "종자오일",
    "왁스",
    "오일",
    "가루",
    "즙",
    "수",
    "추출물",
    "추출액",
    "추출",
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

        entries: list[DictionaryEntry] = []
        for canonical, frequency in counter.most_common():
            if frequency < _INGREDIENT_MIN_FREQUENCY:
                continue
            aliases = self._build_ingredient_aliases(canonical, counter)
            entries.append(
                DictionaryEntry(
                    canonical=canonical,
                    aliases=aliases,
                    frequency=frequency,
                )
            )
            if len(entries) >= _INGREDIENT_LIMIT:
                break
        return entries

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

    def _build_ingredient_aliases(
        self,
        canonical: str,
        counter: Counter[str],
    ) -> tuple[str, ...]:
        # ingredient alias는 수동 예시 목록을 두지 않고 DB canonical에서 파생시킨다.
        # 다만 세라마이드/히알루론산/비타민C처럼 사용자가 generic family term으로 검색하는 패턴은
        # 전성분 표기와 1:1이 아닌 경우가 많아, family-level normalization을 generated alias에만 한정해 붙인다.
        aliases: set[str] = {canonical}
        lower_canonical = canonical.lower()

        stripped = canonical
        for suffix in _INGREDIENT_TRAILING_SUFFIXES:
            if stripped.endswith(suffix) and len(stripped) - len(suffix) >= 2:
                stripped = stripped[: -len(suffix)]
                aliases.add(stripped)
                break

        for family_alias in self._derive_ingredient_family_aliases(canonical, lower_canonical):
            aliases.add(family_alias)

        filtered = [
            normalize_whitespace(alias)
            for alias in aliases
            if normalize_whitespace(alias)
        ]
        filtered.sort(
            key=lambda alias: (
                0 if alias == canonical else 1,
                -counter.get(normalize_text(alias), 0),
                len(alias),
                alias,
            )
        )
        return tuple(filtered[:_INGREDIENT_ALIAS_LIMIT])

    def _derive_ingredient_family_aliases(
        self,
        canonical: str,
        lower_canonical: str,
    ) -> set[str]:
        aliases: set[str] = set()
        is_volatile_alcohol = canonical in {
            "alcohol",
            "변성알코올",
            "alcohol denat.",
            "에탄올",
            "ethanol",
            "에스디알코올40-b",
            "sd alcohol 40-b",
            "아이소프로필알코올",
            "isopropyl alcohol",
        }

        if canonical.startswith("세라마이드"):
            aliases.add("세라마이드")
        if canonical.startswith("판테놀") or "panthenol" in lower_canonical:
            aliases.add("판테놀")
        if canonical.startswith("나이아신아마이드") or "niacinamide" in lower_canonical:
            aliases.add("나이아신아마이드")
        if "하이알루로" in canonical or "히알루로" in canonical or "hyaluro" in lower_canonical:
            aliases.update({"히알루론산", "히알루론"})
        if "ascorb" in lower_canonical or "아스코" in canonical or canonical.startswith("비타민c"):
            aliases.add("비타민c")
        if (
            canonical == "향료"
            or "fragrance" in lower_canonical
            or "parfum" in lower_canonical
            or "perfume" in lower_canonical
        ):
            aliases.update({"향료", "fragrance", "parfum"})
        if is_volatile_alcohol:
            aliases.update({"알코올", "에탄올"})
        if "프로폴리스" in canonical or "propolis" in lower_canonical:
            aliases.add("프로폴리스")
        if "티트리" in canonical or "tea tree" in lower_canonical:
            aliases.add("티트리")
        if "에센셜오일" in canonical or "essential oil" in lower_canonical:
            aliases.add("에센셜오일")
        if "알로에" in canonical or "aloe" in lower_canonical:
            aliases.add("알로에")
        if "스쿠알란" in canonical or "squalane" in lower_canonical:
            aliases.add("스쿠알란")
        if "어성초" in canonical or "houttuynia" in lower_canonical:
            aliases.add("어성초")
        if "병풀" in canonical or "centella" in lower_canonical or "센텔라" in canonical:
            aliases.update({"병풀", "센텔라"})
        if "시카" in canonical or "centella" in lower_canonical or "병풀" in canonical or "센텔라" in canonical:
            aliases.add("시카")
        if "마데카소사이드" in canonical or "madecassoside" in lower_canonical:
            aliases.add("마데카소사이드")
        if "콜라겐" in canonical or "collagen" in lower_canonical:
            aliases.add("콜라겐")
        if "레티놀" in canonical or "retinol" in lower_canonical:
            aliases.add("레티놀")
        if "프로폴리스" in canonical or "propolis" in lower_canonical:
            aliases.add("프로폴리스")
        if "비피다" in canonical or "bifida" in lower_canonical:
            aliases.add("비피다")
        if "카페인" in canonical or "caffeine" in lower_canonical:
            aliases.add("카페인")
        if "글루타치온" in canonical or "glutathione" in lower_canonical:
            aliases.add("글루타치온")
        if "아데노신" in canonical or "adenosine" in lower_canonical:
            aliases.add("아데노신")
        if "펩타이드" in canonical or "peptide" in lower_canonical:
            aliases.add("펩타이드")
        if canonical.startswith("비타민b5"):
            aliases.add("비타민b5")
        if "판테놀" in canonical or "panthenol" in lower_canonical:
            aliases.add("비타민b5")

        return {
            normalize_text(alias)
            for alias in aliases
            if normalize_text(alias) and len(normalize_text(alias)) >= 2
        }


product_search_dictionary_syncer = ProductSearchDictionarySyncer()
