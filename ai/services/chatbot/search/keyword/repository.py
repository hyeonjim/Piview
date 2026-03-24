import pymysql

from core.settings import get_settings
from services.chatbot.search.keyword.models import KeywordCandidateRow


class ProductKeywordRepository:
    def get_candidates(self) -> list[KeywordCandidateRow]:
        sql = """
            SELECT
                p.product_id,
                p.name,
                p.description,
                p.top_skin_type,
                p.top2_skin_type,
                b.brand_name,
                c.category_name
            FROM products p
            LEFT JOIN brand b
                ON b.brand_id = p.brand_id
            LEFT JOIN category c
                ON c.category_id = p.category_id
            WHERE p.name IS NOT NULL
            ORDER BY p.product_id
        """

        with self._get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(sql)
                product_rows = cursor.fetchall()

        return [
            KeywordCandidateRow(
                product_id=int(row["product_id"]),
                name=str(row["name"]),
                brand_name=row["brand_name"],
                category_name=row["category_name"],
                description=row["description"],
                top_skin_type=row["top_skin_type"],
                top2_skin_type=row["top2_skin_type"],
                concern_names=[],
                keyword_score=0.0,
            )
            for row in product_rows
        ]

    def _get_db_connection(self):
        settings = get_settings()
        missing = [
            name
            for name, value in (
                ("CHATBOT_DB_USER", settings.chatbot_db_user),
                ("CHATBOT_DB_NAME", settings.chatbot_db_name),
            )
            if not value
        ]
        if missing:
            raise RuntimeError(
                "Missing DB settings for keyword search: "
                + ", ".join(missing)
                + ". Set them in ai/.env or the current shell."
            )

        return pymysql.connect(
            host=settings.chatbot_db_host,
            port=settings.chatbot_db_port,
            user=settings.chatbot_db_user,
            password=settings.chatbot_db_password,
            database=settings.chatbot_db_name,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )


product_keyword_repository = ProductKeywordRepository()
