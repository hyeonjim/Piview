from dataclasses import dataclass, field
from datetime import datetime

from services.chatbot.search.query_normalizer import tokenize_text


@dataclass(frozen=True)
class DictionaryEntry:
    canonical: str
    aliases: tuple[str, ...] = ()
    frequency: int = 0


@dataclass(frozen=True)
class ProductSearchDictionarySnapshot:
    loaded_at: datetime
    brands: tuple[DictionaryEntry, ...]
    categories: tuple[DictionaryEntry, ...]
    product_types: tuple[DictionaryEntry, ...]
    ingredients: tuple[DictionaryEntry, ...]
    line_terms: tuple[DictionaryEntry, ...]
    attributes: tuple[DictionaryEntry, ...]
    attribute_groups: dict[str, tuple[str, ...]] = field(default_factory=dict)
    ambiguous_terms: tuple[str, ...] = ()
    stopwords: frozenset[str] = field(default_factory=frozenset)
    brand_lookup: dict[str, str] = field(default_factory=dict)
    category_lookup: dict[str, str] = field(default_factory=dict)
    product_type_lookup: dict[str, str] = field(default_factory=dict)
    ingredient_lookup: dict[str, str] = field(default_factory=dict)
    ingredient_expansion_lookup: dict[str, tuple[str, ...]] = field(default_factory=dict)
    line_lookup: dict[str, str] = field(default_factory=dict)
    attribute_lookup: dict[str, str] = field(default_factory=dict)
    attribute_group_lookup: dict[str, str] = field(default_factory=dict)
    ambiguous_term_lookup: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class ParsedSearchQuery:
    original: str
    normalized: str
    brand_terms: tuple[str, ...] = ()
    category_terms: tuple[str, ...] = ()
    product_type_terms: tuple[str, ...] = ()
    line_terms: tuple[str, ...] = ()
    ingredient_terms: tuple[str, ...] = ()
    negative_ingredient_terms: tuple[str, ...] = ()
    attribute_terms: tuple[str, ...] = ()
    attribute_group_terms: tuple[str, ...] = ()
    keyword_terms: tuple[str, ...] = ()

    def search_terms(self) -> list[str]:
        ordered = [
            *self.brand_terms,
            *self.category_terms,
            *self.product_type_terms,
            *self.ingredient_terms,
            *self.attribute_terms,
            *self.keyword_terms,
        ]
        deduped: list[str] = []
        seen: set[str] = set()
        for term in ordered:
            lowered = term.strip().lower()
            if not lowered or lowered in seen:
                continue
            seen.add(lowered)
            deduped.append(term)
        return deduped

    @property
    def is_structured(self) -> bool:
        # attribute_group는 "진정/수딩/브라이트닝" 같은 soft hint 성격이 강하다.
        # brand/category/ingredient 없이 attribute_group만 있는 질의까지 structured로 올리면
        # ambiguous/free-text 질의를 과하게 고정시켜 recall과 explainability가 함께 나빠진다.
        return bool(
            self.brand_terms
            or self.category_terms
            or self.product_type_terms
            or self.ingredient_terms
            or self.negative_ingredient_terms
            or self.attribute_terms
        )

    @property
    def token_count(self) -> int:
        return len(tokenize_text(self.normalized))
