"""Category scope resolution for structured product search queries."""

from __future__ import annotations

from dataclasses import dataclass
from threading import Lock

from services.chatbot.search.product_data import ProductCategoryRow, product_search_data_repository
from services.chatbot.search.query_normalizer import normalize_text


def _split_category_aliases(category_name: str) -> set[str]:
    aliases = {normalize_text(category_name)}
    normalized = category_name
    for separator in ("/", ",", "|", "·", "&"):
        normalized = normalized.replace(separator, " ")
    tokens = [normalize_text(token) for token in normalized.split() if token.strip()]
    aliases.update(token for token in tokens if len(token) >= 2)
    return {alias for alias in aliases if alias}


@dataclass(frozen=True)
class ResolvedCategoryScope:
    category_ids: tuple[int, ...] | None
    big_category_id: int | None
    preferred_category_aliases: tuple[str, ...]
    force_empty: bool = False


class ProductSearchCategoryResolver:
    def __init__(self) -> None:
        self._lock = Lock()
        self._alias_to_category_ids: dict[str, tuple[int, ...]] | None = None
        self._category_to_big: dict[int, int | None] | None = None

    def refresh(self) -> None:
        with self._lock:
            self._alias_to_category_ids, self._category_to_big = self._build_index()

    def resolve(
        self,
        parsed_query,
        category_ids: tuple[int, ...] | None,
        big_category_id: int | None,
    ) -> ResolvedCategoryScope:
        alias_to_category_ids, category_to_big = self._get_index()
        requested_category_ids = tuple(sorted({int(category_id) for category_id in (category_ids or ())}))
        requested_category_set = set(requested_category_ids)

        parsed_category_terms = tuple(
            dict.fromkeys(parsed_query.category_terms + parsed_query.product_type_terms)
        )
        if not parsed_category_terms:
            return ResolvedCategoryScope(
                category_ids=requested_category_ids or None,
                big_category_id=None if requested_category_ids else big_category_id,
                preferred_category_aliases=parsed_category_terms,
            )

        resolved_ids: set[int] = set()
        for term in parsed_category_terms:
            resolved_ids.update(alias_to_category_ids.get(normalize_text(term), ()))

        if big_category_id is not None:
            resolved_ids = {
                category_id
                for category_id in resolved_ids
                if category_to_big.get(category_id) == big_category_id
            }

        if requested_category_set:
            if not resolved_ids:
                return ResolvedCategoryScope(
                    category_ids=requested_category_ids,
                    big_category_id=None,
                    preferred_category_aliases=parsed_category_terms,
                )

            intersected_ids = tuple(sorted(requested_category_set & resolved_ids))
            if not intersected_ids:
                return ResolvedCategoryScope(
                    category_ids=(),
                    big_category_id=None,
                    preferred_category_aliases=parsed_category_terms,
                    force_empty=True,
                )
            return ResolvedCategoryScope(
                category_ids=intersected_ids,
                big_category_id=None,
                preferred_category_aliases=parsed_category_terms,
            )

        if resolved_ids:
            return ResolvedCategoryScope(
                category_ids=tuple(sorted(resolved_ids)),
                big_category_id=None,
                preferred_category_aliases=parsed_category_terms,
            )

        if big_category_id is not None:
            return ResolvedCategoryScope(
                category_ids=(),
                big_category_id=None,
                preferred_category_aliases=parsed_category_terms,
                force_empty=True,
            )

        return ResolvedCategoryScope(
            category_ids=None,
            big_category_id=None,
            preferred_category_aliases=parsed_category_terms,
        )

    def _get_index(self) -> tuple[dict[str, tuple[int, ...]], dict[int, int | None]]:
        with self._lock:
            if self._alias_to_category_ids is None or self._category_to_big is None:
                self._alias_to_category_ids, self._category_to_big = self._build_index()
            return self._alias_to_category_ids, self._category_to_big

    def _build_index(self) -> tuple[dict[str, tuple[int, ...]], dict[int, int | None]]:
        alias_to_category_ids: dict[str, set[int]] = {}
        category_to_big: dict[int, int | None] = {}
        for row in product_search_data_repository.fetch_category_rows():
            self._add_row(alias_to_category_ids, category_to_big, row)

        return (
            {alias: tuple(sorted(category_ids)) for alias, category_ids in alias_to_category_ids.items()},
            category_to_big,
        )

    def _add_row(
        self,
        alias_to_category_ids: dict[str, set[int]],
        category_to_big: dict[int, int | None],
        row: ProductCategoryRow,
    ) -> None:
        category_to_big[row.category_id] = row.big_category_id
        for alias in _split_category_aliases(row.category_name):
            alias_to_category_ids.setdefault(alias, set()).add(row.category_id)


product_search_category_resolver = ProductSearchCategoryResolver()
