"""Chroma raw query 결과를 ProductSearchResult로 바꾸는 변환기."""

from services.chatbot.search.vector.models import ProductSearchResult


def _split_metadata_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in str(value).split("||") if item.strip()]


def map_query_results(
    raw: dict,
    limit: int,
    exclude_product_ids: set[int],
) -> list[ProductSearchResult]:
    """외부 저장소 형식을 내부 표준 검색 결과 형식으로 정규화합니다."""
    documents = raw.get("documents", [[]])[0]
    metadatas = raw.get("metadatas", [[]])[0]
    distances = raw.get("distances", [[]])[0]

    results: list[ProductSearchResult] = []
    seen_product_ids: set[int] = set()
    for document, metadata, distance in zip(documents, metadatas, distances):
        # 메타데이터가 없으면 상품 정보를 복원할 수 없으므로 버립니다.
        if not metadata:
            continue

        product_id = int(metadata["productId"])
        # 같은 상품이 여러 번 나오거나, 상위 계층에서 제외하라고 한 상품은 걸러냅니다.
        if product_id in exclude_product_ids or product_id in seen_product_ids:
            continue
        seen_product_ids.add(product_id)

        concern_names_raw = metadata.get("concernNames") or ""
        concern_names = [item.strip() for item in concern_names_raw.split("||") if item.strip()]
        evidence_snippets = _split_metadata_list(metadata.get("evidenceSnippets"))
        distance_value = float(distance) if distance is not None else None
        results.append(
            ProductSearchResult(
                product_id=product_id,
                name=str(metadata.get("name") or ""),
                brand_name=metadata.get("brandName"),
                category_name=metadata.get("categoryName"),
                concern_names=concern_names,
                top_skin_type=metadata.get("topSkinType"),
                top2_skin_type=metadata.get("top2SkinType"),
                document=document,
                description=metadata.get("description"),
                ingredient_preview=metadata.get("ingredientPreview"),
                evidence_snippets=evidence_snippets,
                matched_sources=["vector"],
                raw_score=(1.0 - distance_value) if distance_value is not None else None,
                distance=distance_value,
            )
        )
        if len(results) >= limit:
            break

    return results
