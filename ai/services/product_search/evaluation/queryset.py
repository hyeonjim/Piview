"""상품 검색 오프라인 평가용 고정 질의셋."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
from pathlib import Path


@dataclass(frozen=True)
class ProductSearchEvaluationCase:
    case_id: str
    dataset_bucket: str
    expected_query_bucket: str
    query: str
    expected_brands: tuple[str, ...] = ()
    expected_category_terms: tuple[str, ...] = ()
    expected_ingredient_terms: tuple[str, ...] = ()
    negative_ingredient_terms: tuple[str, ...] = ()
    expected_name_terms: tuple[str, ...] = ()
    detail_terms: tuple[str, ...] = ()

    def to_payload(self) -> dict[str, object]:
        return asdict(self)


_CATEGORY_EXPECTATIONS: dict[str, tuple[str, ...]] = {
    "토너": ("토너", "스킨"),
    "스킨": ("스킨", "토너"),
    "크림": ("크림",),
    "세럼": ("세럼",),
    "앰플": ("앰플",),
    "에센스": ("에센스",),
    "로션": ("로션", "에멀젼", "에멀전"),
    "에멀젼": ("에멀젼", "에멀전", "로션"),
    "클렌징폼": ("클렌징폼", "클렌저", "폼"),
    "클렌징오일": ("클렌징오일", "오일"),
    "클렌징워터": ("클렌징워터", "워터"),
    "클렌징밤": ("클렌징밤", "밤"),
    "선크림": ("선크림", "선", "선케어"),
    "선스틱": ("선스틱", "선"),
    "미스트": ("미스트",),
    "토너패드": ("토너패드", "패드"),
    "패드": ("패드",),
    "클렌저": ("클렌저", "클렌징폼", "폼"),
    "올인원": ("올인원",),
    "페이스오일": ("페이스오일", "오일"),
    "수딩젤": ("수딩젤", "젤"),
    "수분크림": ("크림", "수분"),
    "진정크림": ("크림", "진정"),
    "클렌징젤": ("클렌징젤", "클렌저", "젤"),
}

_BRANDS = (
    "라운드랩",
    "아이소이",
    "성분에디터",
    "토니모리",
    "더샘",
    "미샤",
    "시드물",
    "네이처리퍼블릭",
    "더페이스샵",
    "잇츠스킨",
    "스킨푸드",
    "이니스프리",
    "빌리프",
    "싸이닉",
    "마녀공장",
    "홀리카홀리카",
    "메디필",
    "닥터지",
    "스킨에디터",
    "궁중비책",
    "아비브",
    "에스트라",
    "메이크프렘",
    "에뛰드",
)

_CATEGORY_QUERIES = (
    "토너",
    "스킨",
    "크림",
    "세럼",
    "앰플",
    "에센스",
    "로션",
    "에멀젼",
    "클렌징폼",
    "클렌징오일",
    "클렌징워터",
    "클렌징밤",
    "선크림",
    "선스틱",
    "미스트",
    "토너패드",
    "패드",
    "클렌저",
    "올인원",
    "페이스오일",
    "수딩젤",
    "수분크림",
    "진정크림",
    "클렌징젤",
)

_BRAND_CATEGORY_PAIRS = (
    ("라운드랩", "토너"),
    ("라운드랩", "크림"),
    ("라운드랩", "클렌저"),
    ("아이소이", "토너"),
    ("아이소이", "세럼"),
    ("아이소이", "크림"),
    ("성분에디터", "토너"),
    ("성분에디터", "크림"),
    ("성분에디터", "앰플"),
    ("토니모리", "토너"),
    ("토니모리", "세럼"),
    ("토니모리", "선크림"),
    ("더샘", "토너"),
    ("더샘", "크림"),
    ("더샘", "클렌징폼"),
    ("미샤", "토너"),
    ("미샤", "에센스"),
    ("미샤", "선크림"),
    ("시드물", "토너"),
    ("시드물", "크림"),
    ("시드물", "앰플"),
    ("네이처리퍼블릭", "토너"),
    ("네이처리퍼블릭", "수딩젤"),
    ("더페이스샵", "클렌징폼"),
    ("잇츠스킨", "토너"),
    ("잇츠스킨", "세럼"),
    ("스킨푸드", "토너"),
    ("스킨푸드", "크림"),
    ("이니스프리", "토너"),
    ("이니스프리", "선크림"),
    ("빌리프", "토너"),
    ("빌리프", "크림"),
    ("마녀공장", "클렌징오일"),
    ("메디필", "앰플"),
    ("닥터지", "크림"),
    ("궁중비책", "크림"),
    ("아비브", "토너"),
    ("아비브", "세럼"),
    ("에스트라", "크림"),
    ("에스트라", "로션"),
    ("메이크프렘", "선크림"),
    ("메이크프렘", "클렌저"),
    ("에뛰드", "토너"),
    ("에뛰드", "선크림"),
    ("닥터지", "선스틱"),
    ("홀리카홀리카", "토너"),
    ("홀리카홀리카", "크림"),
    ("스킨에디터", "토너"),
)

_MULTI_BRAND_CATEGORY_CASES = (
    ("라운드랩", "아이소이", "토너"),
    ("아이소이", "라운드랩", "토너"),
    ("라운드랩", "아이소이", "크림"),
    ("아이소이", "성분에디터", "토너"),
    ("성분에디터", "아이소이", "토너"),
    ("성분에디터", "라운드랩", "토너"),
    ("라운드랩", "성분에디터", "크림"),
    ("토니모리", "더샘", "토너"),
    ("더샘", "토니모리", "토너"),
    ("토니모리", "미샤", "토너"),
    ("미샤", "더샘", "세럼"),
    ("미샤", "시드물", "크림"),
    ("시드물", "미샤", "토너"),
    ("네이처리퍼블릭", "더페이스샵", "클렌징폼"),
    ("더페이스샵", "네이처리퍼블릭", "선크림"),
    ("잇츠스킨", "스킨푸드", "토너"),
    ("스킨푸드", "잇츠스킨", "크림"),
    ("이니스프리", "빌리프", "토너"),
    ("빌리프", "이니스프리", "크림"),
    ("빌리프", "닥터지", "선크림"),
    ("닥터지", "빌리프", "크림"),
    ("마녀공장", "메디필", "앰플"),
    ("메디필", "마녀공장", "세럼"),
    ("궁중비책", "닥터지", "크림"),
    ("스킨에디터", "성분에디터", "토너"),
    ("성분에디터", "스킨에디터", "토너"),
    ("라운드랩", "아이소이", "성분에디터 토너"),
    ("아이소이", "라운드랩", "성분에디터 토너"),
    ("토니모리", "더샘", "미샤 토너"),
    ("미샤", "더샘", "시드물 크림"),
    ("빌리프", "닥터지", "라운드랩 크림"),
    ("라운드랩", "닥터지", "빌리프 크림"),
    ("네이처리퍼블릭", "더페이스샵", "이니스프리 선크림"),
    ("스킨푸드", "잇츠스킨", "더샘 토너"),
    ("마녀공장", "메디필", "성분에디터 앰플"),
    ("라운드랩", "아이소이", "토너 성분에디터 크림"),
    ("아비브", "에스트라", "크림"),
    ("에스트라", "메이크프렘", "선크림"),
    ("메이크프렘", "닥터지", "선크림"),
    ("에뛰드", "토니모리", "토너"),
    ("성분에디터", "아비브", "세럼"),
    ("라운드랩", "에스트라", "크림"),
    ("닥터지", "에스트라", "로션"),
    ("아비브", "메이크프렘", "클렌저"),
    ("빌리프", "아비브", "토너"),
    ("궁중비책", "에스트라", "크림"),
    ("아이소이", "아비브", "세럼"),
    ("메디필", "닥터지", "앰플"),
)

_INGREDIENTS = (
    "판테놀",
    "나이아신아마이드",
    "시카",
    "히알루론산",
    "세라마이드",
    "어성초",
    "병풀",
    "티트리",
    "비타민c",
    "아하",
    "바하",
    "pha",
    "프로폴리스",
    "마데카소사이드",
    "센텔라",
    "알로에",
    "스쿠알란",
    "콜라겐",
    "레티놀",
    "비피다",
    "아줄렌",
    "그린토마토",
    "약콩",
    "쌀",
    "펩타이드",
    "비타민b5",
    "시어버터",
    "글루타치온",
    "아데노신",
    "카페인",
    "세라마이드엔피",
    "히알루로닉애씨드",
)

_INGREDIENT_CATEGORY_PAIRS = (
    ("판테놀", "크림"),
    ("판테놀", "토너"),
    ("판테놀", "세럼"),
    ("판테놀", "앰플"),
    ("나이아신아마이드", "토너"),
    ("나이아신아마이드", "세럼"),
    ("나이아신아마이드", "크림"),
    ("시카", "토너"),
    ("시카", "크림"),
    ("시카", "세럼"),
    ("히알루론산", "토너"),
    ("히알루론산", "세럼"),
    ("히알루론산", "크림"),
    ("세라마이드", "크림"),
    ("세라마이드", "로션"),
    ("세라마이드", "토너"),
    ("어성초", "토너"),
    ("어성초", "패드"),
    ("병풀", "토너"),
    ("병풀", "크림"),
    ("티트리", "토너"),
    ("티트리", "클렌징폼"),
    ("비타민c", "세럼"),
    ("비타민c", "크림"),
    ("프로폴리스", "앰플"),
    ("프로폴리스", "크림"),
    ("레티놀", "세럼"),
    ("비피다", "앰플"),
    ("마데카소사이드", "크림"),
    ("알로에", "수딩젤"),
    ("그린토마토", "토너"),
    ("약콩", "토너"),
    ("쌀", "토너"),
    ("펩타이드", "크림"),
    ("카페인", "앰플"),
    ("아데노신", "크림"),
    ("시어버터", "크림"),
    ("글루타치온", "세럼"),
    ("센텔라", "토너"),
    ("세라마이드엔피", "크림"),
    ("히알루로닉애씨드", "세럼"),
    ("아줄렌", "크림"),
    ("비타민b5", "세럼"),
    ("바하", "토너"),
    ("아하", "토너"),
    ("pha", "토너"),
    ("스쿠알란", "크림"),
    ("콜라겐", "앰플"),
)

_NEGATIVE_CASES = (
    ("향료", "없는", "토너"),
    ("향료", "없는", "크림"),
    ("향료", "없는", "세럼"),
    ("향료", "없는", "선크림"),
    ("향료", "프리", "토너"),
    ("향료", "프리", "크림"),
    ("향료", "무", "토너"),
    ("향료", "무", "크림"),
    ("향료", "무첨가", "토너"),
    ("향료", "무첨가", "크림"),
    ("알코올", "없는", "토너"),
    ("알코올", "없는", "세럼"),
    ("알코올", "프리", "토너"),
    ("알코올", "프리", "선크림"),
    ("알코올", "무", "토너"),
    ("알코올", "무", "미스트"),
    ("에탄올", "없는", "토너"),
    ("에탄올", "프리", "토너"),
    ("에탄올", "프리", "미스트"),
    ("에센셜오일", "없는", "크림"),
    ("에센셜오일", "없는", "세럼"),
    ("에센셜오일", "프리", "크림"),
    ("에센셜오일", "무첨가", "토너"),
    ("향료", "없는", "판테놀 크림"),
    ("향료", "없는", "시카 토너"),
    ("알코올", "없는", "나이아신아마이드 토너"),
    ("향료", "무", "어성초 토너"),
    ("향료", "없는", "성분에디터 토너"),
    ("향료", "없는", "라운드랩 토너"),
    ("향료", "프리", "아비브 크림"),
    ("알코올", "없는", "빌리프 토너"),
    ("에탄올", "없는", "시드물 미스트"),
    ("향료", "없는", "궁중비책 크림"),
    ("에센셜오일", "없는", "에스트라 크림"),
    ("향료", "무첨가", "메이크프렘 선크림"),
    ("알코올", "무", "성분에디터 토너"),
    ("향료", "없는", "세라마이드 크림"),
    ("향료", "없는", "판테놀 세럼"),
    ("에탄올", "프리", "아비브 토너"),
    ("알코올", "프리", "메디필 앰플"),
    ("향료", "없는", "닥터지 크림"),
    ("에센셜오일", "프리", "라운드랩 크림"),
    ("향료", "무", "토너패드"),
    ("알코올", "없는", "클렌징워터"),
)

_AMBIGUOUS_TERMS = (
    "그린토마토",
    "약콩",
    "독도",
    "자작나무",
    "프로바이오덤",
    "카밍",
    "수딩",
    "포어",
    "브라이트닝",
    "클리어",
    "리페어",
    "배리어",
    "하이드로",
    "아쿠아",
    "워터풀",
    "엔앰엔",
    "블레미쉬",
    "시카리오",
    "시카풀",
    "비건",
    "시카패드",
    "레드블레미쉬",
    "독도라인",
    "포어리셋",
    "아토베리어",
    "세이프미",
    "순정",
    "부활초",
    "인테카",
    "갈락토미",
    "워터뱅크",
    "아쿠아밤",
    "비피다",
    "마데카",
    "릴리프",
    "하트리프",
    "리얼베리어",
    "시카리페어",
    "프로바이오덤",
    "아토덤",
    "시카페어",
    "더마토리",
    "아크네스",
    "카밍패드",
    "하이드라",
    "시카풀",
    "포어리파이닝",
    "수퍼아쿠아",
    "자작나무수분",
    "어성초카밍",
    "포어수딩",
)

_LONG_QUERY_CASES = (
    ("성분에디터 그린토마토 모공 진정 토너", "성분에디터", "토너", ("그린토마토", "모공", "진정")),
    ("성분에디터 그린토마토 포어 수딩 토너", "성분에디터", "토너", ("그린토마토", "포어", "수딩")),
    ("라운드랩 자작나무 수분 진정 토너", "라운드랩", "토너", ("자작나무", "수분", "진정")),
    ("라운드랩 약콩 판테놀 진정 토너", "라운드랩", "토너", ("약콩", "판테놀", "진정")),
    ("아이소이 불가리안 로즈 잡티 세럼", "아이소이", "세럼", ("불가리안", "로즈", "잡티")),
    ("아이소이 민감 피부 저자극 토너", "아이소이", "토너", ("민감", "저자극")),
    ("토니모리 저자극 수분 진정 토너", "토니모리", "토너", ("저자극", "수분", "진정")),
    ("더샘 어성초 진정 수분 토너", "더샘", "토너", ("어성초", "진정", "수분")),
    ("미샤 비타민씨 브라이트닝 세럼", "미샤", "세럼", ("비타민씨", "브라이트닝")),
    ("시드물 판테놀 장벽 보습 크림", "시드물", "크림", ("판테놀", "장벽", "보습")),
    ("네이처리퍼블릭 알로에 진정 수분 크림", "네이처리퍼블릭", "크림", ("알로에", "진정", "수분")),
    ("더페이스샵 티트리 진정 토너", "더페이스샵", "토너", ("티트리", "진정")),
    ("잇츠스킨 피부결 정돈 수분 토너", "잇츠스킨", "토너", ("피부결", "정돈", "수분")),
    ("스킨푸드 당근 패드 진정 토너", "스킨푸드", "패드", ("당근", "진정")),
    ("이니스프리 히알루론 수분 세럼", "이니스프리", "세럼", ("히알루론", "수분")),
    ("빌리프 수분 진정 아쿠아 크림", "빌리프", "크림", ("수분", "진정", "아쿠아")),
    ("싸이닉 판테놀 배리어 크림", "싸이닉", "크림", ("판테놀", "배리어")),
    ("마녀공장 갈락토미 나이아신 세럼", "마녀공장", "세럼", ("갈락토미", "나이아신")),
    ("홀리카홀리카 시카 진정 토너", "홀리카홀리카", "토너", ("시카", "진정")),
    ("메디필 모공 탄력 앰플", "메디필", "앰플", ("모공", "탄력")),
    ("닥터지 레드 블레미쉬 진정 크림", "닥터지", "크림", ("레드", "블레미쉬", "진정")),
    ("궁중비책 베이비 보습 장벽 크림", "궁중비책", "크림", ("베이비", "보습", "장벽")),
    ("스킨에디터 미백 각질 진정 토너", "스킨에디터", "토너", ("미백", "각질", "진정")),
    ("라운드랩 민감성 저자극 수분 토너", "라운드랩", "토너", ("민감성", "저자극", "수분")),
    ("라운드랩 건성 피부 보습 크림", "라운드랩", "크림", ("건성", "보습")),
    ("아이소이 잡티 미백 나이아신 세럼", "아이소이", "세럼", ("잡티", "미백", "나이아신")),
    ("성분에디터 약콩 판테놀 장벽 크림", "성분에디터", "크림", ("약콩", "판테놀", "장벽")),
    ("성분에디터 그린토마토 모공 패드", "성분에디터", "패드", ("그린토마토", "모공")),
    ("시드물 병풀 진정 수분 앰플", "시드물", "앰플", ("병풀", "진정", "수분")),
    ("빌리프 히알루론 보습 수분 크림", "빌리프", "크림", ("히알루론", "보습", "수분")),
    ("닥터지 선크림 저자극 무기자차", "닥터지", "선크림", ("저자극", "무기자차")),
    ("이니스프리 비타민c 톤업 세럼", "이니스프리", "세럼", ("비타민c", "톤업")),
    ("스킨푸드 토너패드 모공 결케어", "스킨푸드", "토너패드", ("모공", "결케어")),
    ("더샘 어성초 시카 진정 크림", "더샘", "크림", ("어성초", "시카", "진정")),
    ("미샤 나이아신아마이드 브라이트닝 앰플", "미샤", "앰플", ("나이아신아마이드", "브라이트닝")),
    ("토니모리 티트리 트러블 진정 토너", "토니모리", "토너", ("티트리", "트러블", "진정")),
    ("네이처리퍼블릭 알로에 수딩 진정 젤", "네이처리퍼블릭", "수딩젤", ("알로에", "수딩", "진정")),
    ("마녀공장 클렌징오일 블랙헤드 저자극", "마녀공장", "클렌징오일", ("블랙헤드", "저자극")),
    ("메디필 탄력 리프팅 세럼", "메디필", "세럼", ("탄력", "리프팅")),
    ("궁중비책 민감 피부 저자극 로션", "궁중비책", "로션", ("민감", "저자극")),
    ("아비브 어성초 카밍 토너 스킨부스터", "아비브", "토너", ("어성초", "카밍")),
    ("아비브 부활초 판테놀 크림 뉴트리션 튜브", "아비브", "크림", ("부활초", "판테놀")),
    ("에스트라 아토베리어 365 크림 장벽 보습", "에스트라", "크림", ("아토베리어", "장벽", "보습")),
    ("에스트라 아토베리어 하이드로 에센스 수분 진정", "에스트라", "에센스", ("하이드로", "수분", "진정")),
    ("메이크프렘 인테카 수딩 크림 저자극", "메이크프렘", "크림", ("인테카", "수딩", "저자극")),
    ("메이크프렘 세이프미 릴리프 모이스처 클렌저", "메이크프렘", "클렌저", ("세이프미", "릴리프", "모이스처")),
    ("에뛰드 순정 판테놀 수분 크림", "에뛰드", "크림", ("순정", "판테놀", "수분")),
    ("에뛰드 순정 저자극 약산성 토너", "에뛰드", "토너", ("순정", "저자극", "약산성")),
    ("라운드랩 독도 저자극 수분 토너", "라운드랩", "토너", ("독도", "저자극", "수분")),
    ("닥터지 약산성 레드 블레미쉬 토너", "닥터지", "토너", ("약산성", "레드", "블레미쉬")),
    ("빌리프 아쿠아 밤 수분 진정 크림", "빌리프", "크림", ("아쿠아", "수분", "진정")),
    ("성분에디터 나이아신아마이드 브라이트닝 세럼", "성분에디터", "세럼", ("나이아신아마이드", "브라이트닝")),
)

_NOISY_CASES = (
    ("라운드랩 라운드랩 토너", "brand_category", ("라운드랩",), "토너", (), (), ("라운드랩",)),
    ("아이소이 아이소이 세럼", "brand_category", ("아이소이",), "세럼", (), (), ("아이소이",)),
    ("라운드랩 토너 크림", "mixed_structured", ("라운드랩",), "토너", (), (), ("크림",)),
    ("토너 크림 라운드랩", "mixed_structured", ("라운드랩",), "토너", (), (), ("크림",)),
    ("판테놀 판테놀 크림", "ingredient_category", (), "크림", ("판테놀",), (), ()),
    ("향료 없는 없는 토너", "negative_ingredient", (), "토너", (), ("향료",), ()),
    ("무향료 향료 없는 토너", "negative_ingredient", (), "토너", (), ("향료",), ()),
    ("알코올 프리 무알코올 토너", "negative_ingredient", (), "토너", (), ("알코올",), ()),
    ("성분에디터 성분에디터 그린토마토 토너", "long_query", ("성분에디터",), "토너", (), (), ("그린토마토",)),
    ("그린토마토 토너 성분에디터", "long_query", ("성분에디터",), "토너", (), (), ("그린토마토",)),
    ("토너 라운드랩 아이소이 라운드랩", "multi_brand_category", ("라운드랩", "아이소이"), "토너", (), (), ()),
    ("라운드랩 아이소이 토너 성분에디터 토너", "multi_brand_category", ("라운드랩", "아이소이", "성분에디터"), "토너", (), (), ()),
    ("빌리프 닥터지 라운드랩 아이소이 크림", "multi_brand_category", ("빌리프", "닥터지", "라운드랩", "아이소이"), "크림", (), (), ()),
    ("미샤 더샘 토니모리 이니스프리 토너", "multi_brand_category", ("미샤", "더샘", "토니모리", "이니스프리"), "토너", (), (), ()),
    ("판테놀 시카 나이아신아마이드 토너", "ingredient_category", (), "토너", ("판테놀", "시카", "나이아신아마이드"), (), ()),
    ("판테놀 시카 크림 세럼", "long_query", (), "크림", ("판테놀", "시카"), (), ("세럼",)),
    ("향료 없는 판테놀 시카 토너", "negative_ingredient", (), "토너", ("판테놀", "시카"), ("향료",), ()),
    ("알코올 없는 나이아신아마이드 세럼", "negative_ingredient", (), "세럼", ("나이아신아마이드",), ("알코올",), ()),
    ("에센셜오일 없는 어성초 크림", "negative_ingredient", (), "크림", ("어성초",), ("에센셜오일",), ()),
    ("독도 라운드랩 토너", "long_query", ("라운드랩",), "토너", (), (), ("독도",)),
    ("자작나무 라운드랩 크림", "long_query", ("라운드랩",), "크림", (), (), ("자작나무",)),
    ("약콩 라운드랩 토너", "long_query", ("라운드랩",), "토너", (), (), ("약콩",)),
    ("그린토마토 성분에디터 토너 패드", "long_query", ("성분에디터",), "패드", (), (), ("그린토마토",)),
    ("모공 진정 수분 토너 성분에디터", "long_query", ("성분에디터",), "토너", (), (), ("모공", "진정", "수분")),
    ("저자극 민감성 장벽 판테놀 크림", "ingredient_category", (), "크림", ("판테놀",), (), ("저자극", "민감성", "장벽")),
    ("미백 잡티 나이아신아마이드 세럼", "ingredient_category", (), "세럼", ("나이아신아마이드",), (), ("미백", "잡티")),
    ("트러블 진정 티트리 시카 토너", "ingredient_category", (), "토너", ("티트리", "시카"), (), ("트러블", "진정")),
    ("수분 보습 히알루론 세라마이드 크림", "ingredient_category", (), "크림", ("히알루론산", "세라마이드"), (), ("수분", "보습")),
    ("건성 민감 저자극 무향 크림", "negative_ingredient", (), "크림", (), ("향료",), ("건성", "민감", "저자극")),
    ("지성 모공 유분 티트리 토너", "ingredient_category", (), "토너", ("티트리",), (), ("지성", "모공", "유분")),
    ("선크림 닥터지 빌리프 선스틱", "multi_brand_category", ("닥터지", "빌리프"), "선크림", (), (), ("선스틱",)),
    ("클렌징오일 마녀공장 블랙헤드 저자극", "long_query", ("마녀공장",), "클렌징오일", (), (), ("블랙헤드", "저자극")),
    ("패드 어성초 모공 진정", "long_query", (), "패드", ("어성초",), (), ("모공", "진정")),
    ("토너패드 그린토마토 모공", "long_query", (), "토너패드", ("그린토마토",), (), ("모공",)),
    ("세럼 앰플 에센스 나이아신아마이드", "long_query", (), "세럼", ("나이아신아마이드",), (), ("앰플", "에센스")),
    ("라운드랩 브랜드 토너", "brand_category", ("라운드랩",), "토너", (), (), ()),
    ("토너 추천 라운드랩", "brand_category", ("라운드랩",), "토너", (), (), ()),
)


def build_product_search_evaluation_cases() -> list[ProductSearchEvaluationCase]:
    cases: list[ProductSearchEvaluationCase] = []
    seen_queries: set[str] = set()

    def append_case(case: ProductSearchEvaluationCase) -> None:
        if case.query in seen_queries:
            return
        seen_queries.add(case.query)
        cases.append(case)

    for index, brand in enumerate(_BRANDS, start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"brand_only_{index:03d}",
                dataset_bucket="brand_only",
                expected_query_bucket="brand_only",
                query=brand,
                expected_brands=(brand,),
            )
        )

    for index, category_query in enumerate(_CATEGORY_QUERIES, start=1):
        terms = _category_terms_for(category_query)
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"category_only_{index:03d}",
                dataset_bucket="category_only",
                expected_query_bucket="category_only",
                query=category_query,
                expected_category_terms=terms,
                expected_name_terms=terms,
            )
        )

    for index, (brand, category_query) in enumerate(_BRAND_CATEGORY_PAIRS, start=1):
        terms = _category_terms_for(category_query)
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"brand_category_{index:03d}",
                dataset_bucket="brand_category",
                expected_query_bucket="brand_category",
                query=f"{brand} {category_query}",
                expected_brands=(brand,),
                expected_category_terms=terms,
                expected_name_terms=terms,
            )
        )

    for index, (brand_a, brand_b, category_query) in enumerate(_MULTI_BRAND_CATEGORY_CASES, start=1):
        split_terms = category_query.split()
        category_seed = split_terms[-1]
        terms = _category_terms_for(category_seed)
        expected_brands = tuple(
            brand
            for brand in dict.fromkeys((brand_a, brand_b, *split_terms[:-1]))
            if brand in _BRANDS
        )
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"multi_brand_category_{index:03d}",
                dataset_bucket="multi_brand_category",
                expected_query_bucket="multi_brand_category",
                query=f"{brand_a} {brand_b} {category_query}",
                expected_brands=expected_brands,
                expected_category_terms=terms,
                expected_name_terms=terms,
            )
        )

    for index, ingredient in enumerate(_INGREDIENTS, start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"ingredient_only_{index:03d}",
                dataset_bucket="ingredient_only",
                expected_query_bucket="ingredient_only",
                query=ingredient,
                expected_ingredient_terms=(ingredient,),
                expected_name_terms=(ingredient,),
            )
        )

    for index, (ingredient, category_query) in enumerate(_INGREDIENT_CATEGORY_PAIRS, start=1):
        terms = _category_terms_for(category_query)
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"ingredient_category_{index:03d}",
                dataset_bucket="ingredient_category",
                expected_query_bucket="ingredient_category",
                query=f"{ingredient} {category_query}",
                expected_category_terms=terms,
                expected_ingredient_terms=(ingredient,),
                expected_name_terms=(ingredient, *terms),
            )
        )

    for index, (negative_term, operator, tail) in enumerate(_NEGATIVE_CASES, start=1):
        query = _negative_query_text(negative_term, operator, tail)
        tail_last = tail.split()[-1]
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"negative_ingredient_{index:03d}",
                dataset_bucket="negative_ingredient",
                expected_query_bucket="negative_ingredient",
                query=query,
                expected_brands=_extract_known_brands(query),
                expected_category_terms=_category_terms_for(tail_last),
                expected_ingredient_terms=_extract_known_ingredients(query),
                negative_ingredient_terms=(negative_term,),
                expected_name_terms=_category_terms_for(tail_last),
            )
        )

    for index, term in enumerate(_AMBIGUOUS_TERMS, start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"ambiguous_keyword_{index:03d}",
                dataset_bucket="ambiguous_keyword",
                expected_query_bucket="ambiguous_keyword",
                query=term,
                expected_name_terms=(term,),
                detail_terms=(term,),
            )
        )

    for index, (query, brand, category_query, detail_terms) in enumerate(_LONG_QUERY_CASES, start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"long_query_{index:03d}",
                dataset_bucket="long_query",
                expected_query_bucket="long_query",
                query=query,
                expected_brands=(brand,),
                expected_category_terms=_category_terms_for(category_query),
                expected_ingredient_terms=_extract_known_ingredients(query),
                expected_name_terms=detail_terms,
                detail_terms=detail_terms,
            )
        )

    for index, (
        query,
        expected_query_bucket,
        expected_brands,
        category_query,
        expected_ingredients,
        negative_terms,
        detail_terms,
    ) in enumerate(_NOISY_CASES, start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"noisy_mixed_{index:03d}",
                dataset_bucket="noisy_mixed",
                expected_query_bucket=expected_query_bucket,
                query=query,
                expected_brands=expected_brands,
                expected_category_terms=_category_terms_for(category_query),
                expected_ingredient_terms=expected_ingredients,
                negative_ingredient_terms=negative_terms,
                expected_name_terms=detail_terms or _extract_known_ingredients(query) or _extract_known_brands(query),
                detail_terms=detail_terms,
            )
        )

    for index, (query, brand, category_query, detail_terms) in enumerate(_build_long_query_variants(), start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"long_query_variant_{index:03d}",
                dataset_bucket="long_query",
                expected_query_bucket="long_query",
                query=query,
                expected_brands=(brand,),
                expected_category_terms=_category_terms_for(category_query),
                expected_ingredient_terms=_extract_known_ingredients(query),
                expected_name_terms=detail_terms,
                detail_terms=detail_terms,
            )
        )

    for index, (
        query,
        expected_brands,
        category_query,
    ) in enumerate(_build_multi_brand_order_variants(), start=1):
        append_case(
            ProductSearchEvaluationCase(
                case_id=f"multi_brand_variant_{index:03d}",
                dataset_bucket="multi_brand_category",
                expected_query_bucket="multi_brand_category",
                query=query,
                expected_brands=expected_brands,
                expected_category_terms=_category_terms_for(category_query),
                expected_name_terms=_category_terms_for(category_query),
            )
        )

    return cases


def write_product_search_evaluation_dataset(path: Path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    cases = build_product_search_evaluation_cases()
    with path.open("w", encoding="utf-8") as file:
        for case in cases:
            file.write(json.dumps(case.to_payload(), ensure_ascii=False) + "\n")
    return len(cases)


def _category_terms_for(category_query: str) -> tuple[str, ...]:
    normalized = category_query.strip()
    return _CATEGORY_EXPECTATIONS.get(normalized, (normalized,))


def _negative_query_text(negative_term: str, operator: str, tail: str) -> str:
    if operator == "없는":
        return f"{negative_term} 없는 {tail}"
    if operator == "프리":
        return f"{negative_term} 프리 {tail}"
    if operator == "무":
        return f"무{negative_term} {tail}"
    if operator == "무첨가":
        return f"{negative_term} 무첨가 {tail}"
    return f"{negative_term} {operator} {tail}"


def _extract_known_brands(query: str) -> tuple[str, ...]:
    return tuple(brand for brand in _BRANDS if brand in query)


def _extract_known_ingredients(query: str) -> tuple[str, ...]:
    return tuple(ingredient for ingredient in _INGREDIENTS if ingredient in query)


def _build_long_query_variants() -> list[tuple[str, str, str, tuple[str, ...]]]:
    variants: list[tuple[str, str, str, tuple[str, ...]]] = []
    for query, brand, category_query, detail_terms in _LONG_QUERY_CASES[:40]:
        detail_phrase = " ".join(detail_terms)
        if detail_phrase:
            variants.append((f"{detail_phrase} {brand} {category_query}", brand, category_query, detail_terms))
            variants.append((f"{brand} {category_query} {detail_phrase}", brand, category_query, detail_terms))
    return variants


def _build_multi_brand_order_variants() -> list[tuple[str, tuple[str, ...], str]]:
    variants: list[tuple[str, tuple[str, ...], str]] = []
    for brand_a, brand_b, category_query in _MULTI_BRAND_CATEGORY_CASES[:20]:
        split_terms = category_query.split()
        category_seed = split_terms[-1]
        expected_brands = tuple(
            brand
            for brand in dict.fromkeys((brand_a, brand_b, *split_terms[:-1]))
            if brand in _BRANDS
        )
        variants.append((f"{category_query} {brand_a} {brand_b}", expected_brands, category_seed))
    return variants
