from services.chatbot.search.vector.models import ProductSearchResult


def map_query_results(
    raw: dict,
    limit: int,
    exclude_product_ids: set[int],
) -> list[ProductSearchResult]:
    documents = raw.get("documents", [[]])[0]
    metadatas = raw.get("metadatas", [[]])[0]
    distances = raw.get("distances", [[]])[0]

    results: list[ProductSearchResult] = []
    seen_product_ids: set[int] = set()
    for document, metadata, distance in zip(documents, metadatas, distances):
        if not metadata:
            continue

        product_id = int(metadata["productId"])
        if product_id in exclude_product_ids or product_id in seen_product_ids:
            continue
        seen_product_ids.add(product_id)

        concern_names_raw = metadata.get("concernNames") or ""
        concern_names = [item.strip() for item in concern_names_raw.split(",") if item.strip()]
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
                distance=float(distance) if distance is not None else None,
            )
        )
        if len(results) >= limit:
            break

    return results
