from datetime import datetime, timezone
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routers import product_search
from services.product_search.models import ProductSearchDictionarySnapshot


def _build_snapshot() -> ProductSearchDictionarySnapshot:
    return ProductSearchDictionarySnapshot(
        loaded_at=datetime.now(timezone.utc),
        brands=(),
        categories=(),
        product_types=(),
        ingredients=(),
        line_terms=(),
        attributes=(),
        attribute_groups={"barrier": ("판테놀",)},
        stopwords=frozenset(),
        brand_lookup={},
        category_lookup={"크림": "크림"},
        product_type_lookup={},
        ingredient_lookup={"판테놀": "판테놀"},
        line_lookup={"판테놀": "판테놀"},
        attribute_lookup={},
        attribute_group_lookup={"판테놀": "barrier"},
    )


class ProductSearchApiObservabilityTests(unittest.TestCase):
    def test_search_response_includes_query_bucket(self) -> None:
        app = FastAPI()
        app.include_router(product_search.router, prefix="/products")

        with patch.object(
            product_search.product_search_dictionary_registry,
            "get_snapshot",
            return_value=_build_snapshot(),
        ), patch.object(
            product_search.product_search_service,
            "search",
            AsyncMock(return_value=[]),
        ):
            client = TestClient(app)
            response = client.get("/products/search", params={"q": "판테놀"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["queryShape"], "ingredient_only")
        self.assertEqual(payload["queryBucket"], "ingredient_only")
        self.assertEqual(payload["results"], [])


if __name__ == "__main__":
    unittest.main()
