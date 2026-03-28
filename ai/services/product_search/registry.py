"""In-memory dictionary registry for product search."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from threading import Lock

from services.chatbot.search.query_normalizer import normalize_text
from services.product_search.models import DictionaryEntry, ProductSearchDictionarySnapshot
from services.product_search.sync import (
    _DICTIONARY_DIR,
    _GENERATED_FILES,
    _INGREDIENT_FAMILIES_FILE,
    _MANUAL_DIR,
    _STOPWORDS_FILE,
    product_search_dictionary_syncer,
)


_ATTRIBUTE_GROUPS_FILE = _MANUAL_DIR / "attribute_groups.json"


class ProductSearchDictionaryRegistry:
    def __init__(self) -> None:
        self._lock = Lock()
        self._snapshot: ProductSearchDictionarySnapshot | None = None

    def initialize(self) -> ProductSearchDictionarySnapshot:
        return self.refresh()

    def refresh(self) -> ProductSearchDictionarySnapshot:
        # refresh는 DB -> generated json -> in-memory snapshot 전체를 강제로 다시 만든다.
        # 운영 중 dictionary drift를 바로 반영해야 할 때 이 경로를 사용한다.
        with self._lock:
            product_search_dictionary_syncer.sync()
            self._snapshot = self._load_snapshot()
            return self._snapshot

    def get_snapshot(self) -> ProductSearchDictionarySnapshot:
        # 기본 경로는 lazy load다.
        # 메모리에 snapshot이 없으면 generated 파일을 확인하고,
        # 파일이 비어 있으면 sync까지 한 번 수행한 뒤 snapshot을 만든다.
        with self._lock:
            if self._snapshot is None:
                if any(not path.exists() for path in _GENERATED_FILES.values()):
                    product_search_dictionary_syncer.sync()
                self._snapshot = self._load_snapshot()
            return self._snapshot

    def status(self) -> dict[str, object]:
        snapshot = self.get_snapshot()
        return {
            "loadedAt": snapshot.loaded_at.isoformat(),
            "dictionaryDir": str(_DICTIONARY_DIR),
            "generatedDir": str(_GENERATED_FILES["brands"].parent),
            "manualDir": str(_MANUAL_DIR),
            "generatedFiles": {
                "brands": str(_GENERATED_FILES["brands"]),
                "categories": str(_GENERATED_FILES["categories"]),
                "productTypes": str(_GENERATED_FILES["product_types"]),
                "ingredientTerms": str(_GENERATED_FILES["ingredients"]),
                "lineTerms": str(_GENERATED_FILES["line_terms"]),
                "attributes": str(_GENERATED_FILES["attributes"]),
            },
            "manualFiles": {
                "stopwords": str(_STOPWORDS_FILE),
                "attributeGroups": str(_ATTRIBUTE_GROUPS_FILE),
                "ingredientFamilies": str(_INGREDIENT_FAMILIES_FILE),
            },
            "counts": {
                "brands": len(snapshot.brands),
                "categories": len(snapshot.categories),
                "productTypes": len(snapshot.product_types),
                "ingredientTerms": len(snapshot.ingredients),
                "lineTerms": len(snapshot.line_terms),
                "attributes": len(snapshot.attributes),
                "attributeGroups": len(snapshot.attribute_groups),
                "stopwords": len(snapshot.stopwords),
            },
        }

    def _load_snapshot(self) -> ProductSearchDictionarySnapshot:
        # snapshot은 runtime parser/service가 바로 쓰기 쉬운 lookup 중심 구조다.
        # generated json에서 raw entry를 읽은 뒤, canonical lookup까지 한 번에 구성해서 메모리에 올린다.
        brands = self._load_generated_entries(_GENERATED_FILES["brands"])
        categories = self._load_generated_entries(_GENERATED_FILES["categories"])
        product_types = self._load_generated_entries(_GENERATED_FILES["product_types"])
        ingredients = self._load_generated_entries(_GENERATED_FILES["ingredients"])
        line_terms = self._load_generated_entries(_GENERATED_FILES["line_terms"])
        attributes = self._load_generated_entries(_GENERATED_FILES["attributes"])
        attribute_groups = self._load_attribute_groups()
        stopwords = self._load_stopwords()

        brand_lookup = self._build_lookup(brands)
        category_lookup = self._build_lookup(categories)
        product_type_lookup = self._build_lookup(product_types)
        ingredient_lookup = self._build_lookup(ingredients)
        ingredient_expansion_lookup = self._build_expansion_lookup(ingredients)
        line_lookup = self._build_lookup(line_terms)
        attribute_lookup = self._build_lookup(attributes)
        attribute_group_lookup = self._build_attribute_group_lookup(attribute_groups)

        return ProductSearchDictionarySnapshot(
            loaded_at=datetime.now(timezone.utc),
            brands=tuple(brands),
            categories=tuple(categories),
            product_types=tuple(product_types),
            ingredients=tuple(ingredients),
            line_terms=tuple(line_terms),
            attributes=tuple(attributes),
            attribute_groups=attribute_groups,
            stopwords=frozenset(stopwords),
            brand_lookup=brand_lookup,
            category_lookup=category_lookup,
            product_type_lookup=product_type_lookup,
            ingredient_lookup=ingredient_lookup,
            ingredient_expansion_lookup=ingredient_expansion_lookup,
            line_lookup=line_lookup,
            attribute_lookup=attribute_lookup,
            attribute_group_lookup=attribute_group_lookup,
        )

    def _load_generated_entries(self, path: Path) -> list[DictionaryEntry]:
        # generated file이 깨져도 서비스 부팅 전체가 죽지 않도록 빈 리스트로 fallback한다.
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []

        entries: list[DictionaryEntry] = []
        for item in payload.get("items", []):
            canonical = normalize_text(str(item.get("canonical", "")))
            if not canonical:
                continue
            aliases = tuple(
                sorted(
                    {
                        normalize_text(str(alias))
                        for alias in item.get("aliases", [])
                        if normalize_text(str(alias))
                    }
                )
            )
            entries.append(
                DictionaryEntry(
                    canonical=canonical,
                    aliases=aliases or (canonical,),
                    frequency=int(item.get("frequency", 0) or 0),
                )
            )
        return entries

    def _load_stopwords(self) -> set[str]:
        try:
            payload = json.loads(_STOPWORDS_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return set()
        if not isinstance(payload, list):
            return set()
        return {
            normalize_text(str(value))
            for value in payload
            if normalize_text(str(value))
        }

    def _load_attribute_groups(self) -> dict[str, tuple[str, ...]]:
        try:
            payload = json.loads(_ATTRIBUTE_GROUPS_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        if not isinstance(payload, dict):
            return {}

        groups: dict[str, tuple[str, ...]] = {}
        for group_key, item in payload.items():
            normalized_key = normalize_text(str(group_key))
            if not normalized_key or not isinstance(item, dict):
                continue
            terms = tuple(
                sorted(
                    {
                        normalize_text(str(term))
                        for term in item.get("terms", [])
                        if normalize_text(str(term))
                    }
                )
            )
            if terms:
                groups[normalized_key] = terms
        return groups

    def _build_lookup(self, entries: list[DictionaryEntry]) -> dict[str, str]:
        # lookup은 alias -> canonical 매핑이다.
        # parser는 이 lookup만 알면 되고, 어떤 canonical이 어디서 왔는지는 registry가 숨긴다.
        lookup: dict[str, str] = {}
        for entry in entries:
            canonical = normalize_text(entry.canonical)
            lookup[canonical] = canonical
            for alias in entry.aliases:
                normalized_alias = normalize_text(alias)
                if normalized_alias:
                    lookup[normalized_alias] = canonical
        return lookup

    def _build_expansion_lookup(
        self,
        entries: list[DictionaryEntry],
    ) -> dict[str, tuple[str, ...]]:
        # ingredient는 generic query 하나가 여러 DB canonical을 가리킬 수 있다.
        # 예: "세라마이드" -> 세라마이드엔피/에이피/엔에스 ...
        # parser는 alias 존재 여부만 보고 query term을 ingredient로 인정하고,
        # service는 expansion lookup으로 실제 prefilter/ranking 대상 canonical 집합을 확장한다.
        expansions: dict[str, set[str]] = {}
        for entry in entries:
            canonical = normalize_text(entry.canonical)
            values = {canonical}
            values.update(
                normalize_text(alias)
                for alias in entry.aliases
                if normalize_text(alias)
            )
            for alias in values:
                bucket = expansions.setdefault(alias, set())
                bucket.add(canonical)

        return {
            alias: tuple(sorted(values))
            for alias, values in expansions.items()
            if alias and values
        }

    def _build_attribute_group_lookup(
        self,
        attribute_groups: dict[str, tuple[str, ...]],
    ) -> dict[str, str]:
        # attribute group은 alias가 canonical group key로 수렴하는 형태다.
        # 예: "진정", "수딩" -> "soothing" 같은 manual grouping을 parser가 쉽게 쓰도록 만든다.
        lookup: dict[str, str] = {}
        for group_key, terms in attribute_groups.items():
            lookup[group_key] = group_key
            for term in terms:
                normalized_term = normalize_text(term)
                if normalized_term:
                    lookup[normalized_term] = group_key
        return lookup


product_search_dictionary_registry = ProductSearchDictionaryRegistry()
