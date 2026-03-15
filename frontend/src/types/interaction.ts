/**
 * types/interaction.ts
 * ERD: Likes, MyCos, MyDislikeProduct
 *
 * Likes(좋아요)와 MyCos(내 화장품)는 다른 기능입니다.
 */

// ERD: Likes → 좋아요 (하트 버튼)
export interface Like {
  id: number;
  userId: number;
  productId: number;
}

// ERD: MyCos → 내 화장품 보관함
export interface MyCos {
  id: string;      // ERD: my_cos_id(VARCHAR PK)
  productId: number;
  userId: number;
}

// ERD: MyDislikeProduct → 추천 제외 (싫어요)
export interface MyDislikeProduct {
  id: number;      // ERD: dislike_product_id
  productId: number;
  userId: number;
}
