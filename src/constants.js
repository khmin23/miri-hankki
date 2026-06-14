/* ─── 정적 설정 / 메타 데이터 ───────────────────────────── */
import { parseAvgPrice } from './utils'

/* 가게별 부가 데이터 */
export const operatingHours = {
  1: '17:00 - 01:00', 2: '18:00 - 24:00', 3: '10:00 - 21:00',
  4: '09:00 - 21:00', 5: '10:00 - 15:00', 6: '11:30 - 21:00',
}
export const parkingAvail = { 1: false, 2: false, 3: false, 4: false, 5: true, 6: false }

// 처음 방문자에게 추천하는 대표 메뉴 3가지
export const menuData = {
  1: [{ name: '마라전골', price: '28,000원' }, { name: '크림새우', price: '26,000원' }, { name: '보리새우 백짬뽕탕', price: '25,000원' }],
  2: [{ name: '돼지 안심 스테이크', price: '29,000원' }, { name: '파리지엔 뇨끼', price: '18,000원' }, { name: '한우안심 타르타르와 감자파브', price: '21,000원' }],
  3: [{ name: '파도바', price: '4,500원' }, { name: '부사노 크림프레소', price: '5,000원' }, { name: '오-부사노 피즈', price: '6,500원' }],
  4: [{ name: '연어 에그베네딕트', price: '18,000원' }, { name: '포테이토 릭 스프', price: '' }, { name: '홀리데이 라떼', price: '7,000원' }],
  5: [{ name: '돼지곰탕', price: '11,000원' }, { name: '고기 칼국수', price: '12,000원' }, { name: '수육', price: '29,000원' }],
  6: [{ name: '마파두부', price: '13,000원' }, { name: '볶음밥', price: '9,000원' }, { name: '우육면', price: '13,000원' }],
}

/* 네비게이션 */
export const navItems = [
  { id: 'home',   label: '홈',   icon: '🏠' },
  { id: 'search', label: '검색', icon: '🔍' },
  { id: 'map',    label: '지도', icon: '🗺️' },
  { id: 'my',     label: '마이', icon: '👤' },
]

export const moodCategories = [
  { id: '전체',   label: '전체',   icon: '🍽️' },
  { id: '한식',   label: '한식',   icon: '🍚' },
  { id: '중식',   label: '중식',   icon: '🥢' },
  { id: '양식',   label: '양식',   icon: '🍷' },
  { id: '카페',   label: '카페',   icon: '☕' },
  { id: '브런치', label: '브런치', icon: '🥐' },
  { id: '아시안', label: '아시안', icon: '🍜' },
]
export const homeMoodCategories = moodCategories

export const situationCategories = [
  { id: '혼밥',   label: '혼밥',   icon: '🍚' },
  { id: '데이트', label: '데이트', icon: '❤️' },
  { id: '해장',   label: '해장',   icon: '🍲' },
  { id: '브런치', label: '브런치', icon: '🥐' },
  { id: '카페',   label: '카페',   icon: '☕' },
  { id: '얼큰한', label: '얼큰한', icon: '🌶️' },
]

export const situationRecommendationMap = {
  혼밥: [
    { id: 5, reason: '혼자 앉기 편한 한식, 맑은 돼지곰탕으로 부담 없는 한 끼' },
    { id: 6, reason: '가성비 좋고 1인분 주문 가능한 아시안 퓨전' },
    { id: 1, reason: '1인 주문이 되는 중식, 얼큰한 국물로 든든하게' },
  ],
  데이트: [
    { id: 2, reason: '와인과 코스 요리로 특별한 저녁 분위기' },
    { id: 4, reason: '오션뷰와 브런치 메뉴가 함께 잡히는 낮 데이트' },
    { id: 3, reason: '바다 앞 감성 카페에서 마무리하는 데이트 코스' },
  ],
  해장: [
    { id: 5, reason: '맑고 담백한 돼지곰탕으로 속을 편하게 채우기 좋음' },
    { id: 1, reason: '얼큰한 백짬뽕탕 국물로 시원하게 풀기 좋음' },
  ],
  브런치: [
    { id: 4, reason: '에그베네딕트·팬케이크와 광안대교 뷰를 함께 즐기는 곳' },
    { id: 3, reason: '시그니처 커피와 디저트로 여유롭게 시작하는 아침' },
  ],
  카페: [
    { id: 3, reason: '에스프레소와 시그니처 음료를 중심으로 가볍게 방문' },
    { id: 4, reason: '통창 오션뷰와 라떼를 함께 즐기기 좋은 브런치 카페' },
  ],
  얼큰한: [
    { id: 1, reason: '보리새우 백짬뽕·마라전골로 확실하게 얼큰한 저녁' },
    { id: 6, reason: '마파두부와 향신료 가득한 우육면으로 칼칼하게' },
  ],
}

export const accentClassNames = {
  sunset: 'accent-sunset', night: 'accent-night', espresso: 'accent-espresso',
  ocean: 'accent-ocean', forest: 'accent-forest', lime: 'accent-lime',
}

export const accentColors = {
  sunset: '#E8654A', night: '#163A5B', espresso: '#8B5E34',
  ocean: '#4A90C4', forest: '#2F7D46', lime: '#7BAE3C',
}

export const mapCenter = [35.153, 129.1152]

export const cuisineCategories = [
  { id: '전체',   keywords: [] },
  { id: '한식',   keywords: ['한식', '곰탕', '국밥'] },
  { id: '중식',   keywords: ['중식', '마라'] },
  { id: '양식',   keywords: ['양식', '와인바', '다이닝바'] },
  { id: '브런치', keywords: ['브런치', '카페', '에스프레소바'] },
  { id: '카페',   keywords: ['카페', '에스프레소바', '브런치'] },
  { id: '아시안', keywords: ['아시안퓨전', '바오번', '우육면', '마파'] },
]

export const LOCATION_OPTIONS = ['내 위치', '광안리', '해운대', '서면/전포', '남포']

export const PRICE_FILTERS = [
  { id: '전체',    label: '전체',       test: () => true },
  { id: '1만이하', label: '1만원 이하', test: (item) => parseAvgPrice(item.price) <= 10000 },
  { id: '1~2만',   label: '1~2만원',    test: (item) => { const p = parseAvgPrice(item.price); return p > 10000 && p <= 20000 } },
  { id: '2만이상', label: '2만원 이상', test: (item) => parseAvgPrice(item.price) > 20000 },
]

export const TRAIT_FILTERS = [
  { id: '웨이팅적음', label: '웨이팅 적음', icon: '✅', test: (item) => item.experience?.waitTime?.includes('대기 없음') },
  { id: '조용함',     label: '조용함',       icon: '🤫', test: (item) => item.experience?.noise === '낮음' },
  { id: '혼밥가능',   label: '혼밥 가능',    icon: '🍱', test: (item) => item.experience?.soloOk === true },
  { id: '분위기있음', label: '분위기 있음',  icon: '✨', test: (item) => item.experience?.vibe === '감성' },
]

/* 하루 코스 슬롯 정의 — 각 슬롯에 어울리는 식당 후보 id */
export const COURSE_SLOTS = [
  { slot: '브런치', time: '09:00~', candidates: [4, 3] },       // 워킹홀리데이, 까사부사노
  { slot: '점심',   time: '12:00~', candidates: [5, 6, 4, 3] }, // 나막집, 바오하우스, 워킹홀리데이, 까사부사노
  { slot: '카페',   time: '14:00~', candidates: [3, 4] },        // 까사부사노, 워킹홀리데이
  { slot: '저녁',   time: '18:00~', candidates: [1, 2, 6] },     // 푸안, 무벳, 바오하우스
]

/* 프로모 배너 슬라이드 */
export const PROMO_SLIDES = [
  { area: '광안리', img: '/promo-bg.jpg',  grad: null,                                     tag: '직접 가본 것처럼 미리 확인', title: '사진·분위기·메뉴·웨이팅까지', bold: '광안리 맛집' },
  { area: '서면',   img: null,             grad: 'linear-gradient(135deg,#163A5B,#1e5080)', tag: '직접 가본 것처럼 미리 확인', title: '부산의 중심에서',             bold: '서면 맛집'   },
  { area: '남포',   img: null,             grad: 'linear-gradient(135deg,#3b2a1a,#6b4423)', tag: '직접 가본 것처럼 미리 확인', title: '역사가 담긴',                 bold: '남포 맛집'   },
  { area: '해운대', img: null,             grad: 'linear-gradient(135deg,#0a6e8a,#1a9bb5)', tag: '직접 가본 것처럼 미리 확인', title: '바다를 품은',                 bold: '해운대 맛집' },
]

export const PROFILE_AVATARS = ['🌊','🍱','🥢','🍜','☕','🥐','🍖','🌶️','🍣','🥗','🍙','🍷']
