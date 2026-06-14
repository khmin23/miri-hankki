/* ─── 추천 / 검색 / 코스 로직 ───────────────────────────── */
import { restaurants } from './data/restaurants'
import { cuisineCategories, situationRecommendationMap, COURSE_SLOTS } from './constants'

/** 가게 카테고리 → 분류 라벨 */
export function getCuisineCategory(item) {
  const matched = cuisineCategories.find((c) => {
    if (c.id === '전체') return false
    return c.keywords.some((k) => item.category.includes(k))
  })
  return matched?.id ?? '기타'
}

/** 상황별 추천 목록 */
export function getSituationRecommendations(situation) {
  return (situationRecommendationMap[situation] ?? [])
    .map(({ id, reason }) => ({ item: restaurants.find((r) => r.id === id), reason }))
    .filter(({ item }) => Boolean(item))
}

/** 키워드 기반 가게 점수화 */
export function scoreRestaurant(item, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return { score: 0, matches: [], reason: '키워드를 입력하면 취향에 맞춘 추천을 드릴게요.' }
  const keywords = normalized.split(/\s+/).filter(Boolean)
  let score = 0
  const matchedSet = new Set()
  keywords.forEach((kw) => {
    if (item.name.toLowerCase().includes(kw))     score += 6
    if (item.category.toLowerCase().includes(kw)) { score += 4; matchedSet.add(item.category) }
    if (item.location.toLowerCase().includes(kw)) { score += 3; matchedSet.add(item.location) }
    if (item.hero.toLowerCase().includes(kw))     score += 3
    if (item.price.toLowerCase().includes(kw))    score += 2
    item.tags.forEach((t) => { if (t.toLowerCase().includes(kw)) { score += 4; matchedSet.add(t) } })
    item.mood.forEach((m) => { if (m.toLowerCase().includes(kw)) { score += 4; matchedSet.add(m) } })
    item.points.forEach((p) => { if (p.toLowerCase().includes(kw)) score += 2 })
  })
  if (/데이트|기념일|무드|와인/.test(query)        && item.mood.includes('데이트'))   { score += 8; matchedSet.add('데이트 무드') }
  if (/브런치|오전|오션뷰|바다/.test(query)        && item.mood.includes('오션뷰'))   { score += 8; matchedSet.add('오션뷰') }
  if (/혼밥|든든|국물|한식/.test(query)           && item.mood.includes('혼밥가능')) { score += 8; matchedSet.add('혼밥 가능') }
  if (/커피|카페|디저트|가볍게/.test(query)        && item.category.includes('카페')) { score += 8; matchedSet.add('카페') }
  if (/바오|마파|우육면|이국적|향신료/.test(query) && item.name === '바오하우스 광안점') { score += 8; matchedSet.add('아시안퓨전') }
  if (/마라|얼큰|친구|저녁모임/.test(query)       && item.name === '푸안 광안점')   { score += 8; matchedSet.add('마라') }
  const reasonParts = [`${item.location}에서 찾기 쉬운 동선`, `${item.category} 중심의 메뉴 구성`, item.recommend]
  return {
    score,
    matches: [...matchedSet].slice(0, 5),
    reason: `${reasonParts[0]}, ${reasonParts[1]}이고 ${reasonParts[2].replace('추천', '잘 맞습니다')}.`,
  }
}

/** 가게별 방문 팁 */
export function getTip(item) {
  const tips = {
    1: '마라전골은 처음부터 맵기보다 기본 단계로 시작한 뒤 가지튀김과 볶음밥을 이어서 주문하면 만족도가 높아요.',
    2: '무벳은 해 질 무렵 방문하면 분위기가 가장 살아나고, 와인 한 잔과 치즈 플레이트를 먼저 고르면 코스 선택이 쉬워져요.',
    3: '까사부사노는 에스프레소 한 잔과 샤케라또를 나눠 마셔보면 매력을 비교하기 좋아요.',
    4: '워킹홀리데이는 창가 좌석 선호가 높아서 오픈 시간대 방문이 가장 안정적이에요.',
    5: '나막집은 돼지곰탕으로 맑은 국물 스타일을 먼저 보고, 든든하게 먹고 싶다면 고기 칼국수를 함께 고르면 좋아요.',
    6: '바오하우스는 마파두부와 볶음밥을 함께 먹으면 향신료와 고소함의 균형이 좋아요.',
  }
  return tips[item.id] ?? '대표 메뉴 하나와 사이드 하나를 조합해서 방문하면 이 집의 강점을 더 또렷하게 느낄 수 있어요.'
}

/**
 * 하루 코스 생성. 가능하면 중복 없이 채우되,
 * 후보가 이미 모두 사용된 슬롯은 후보 중 랜덤으로 채워
 * 슬롯이 비는(undefined) 일이 없도록 한다.
 */
export function generateCourse() {
  const used = new Set()
  return COURSE_SLOTS.map((slot) => {
    const fresh = slot.candidates.filter((id) => !used.has(id))
    const pool = fresh.length > 0 ? fresh : slot.candidates
    const id = pool[Math.floor(Math.random() * pool.length)]
    used.add(id)
    return { ...slot, id }
  })
}
