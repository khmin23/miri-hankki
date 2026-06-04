import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { restaurants } from './data/restaurants'
import { signUp, signIn, signOut, onAuthStateChanged, isConfigured as firebaseConfigured, loadUserData, saveUserData, savePublicReview, getPublicReviews, getAllPublicReviews, deletePublicReview } from './firebase'

const BASE = import.meta.env.BASE_URL

/* ─── GPS 위치 기반 거리/소요시간 ────────────────────────── */
const UserLocCtx = createContext(null)
const ReviewStatsCtx = createContext({})

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getEta(item, userLoc) {
  if (!userLoc) return ''
  const km = haversine(userLoc.lat, userLoc.lng, item.lat, item.lng)
  if (km < 1) {
    const m = Math.round(km * 1000 / 10) * 10
    return `${m}m`
  } else {
    return `${km.toFixed(1)}km`
  }
}

function useUserLocation() {
  const [loc, setLoc] = useState(null)
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, maximumAge: 30000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])
  return loc
}

function asset(path) {
  return `${BASE}${path.replace(/^\//, '')}`
}

/* ─── 부가 데이터 ──────────────────────────────────────── */
const operatingHours = {
  1: '17:00 - 01:00', 2: '18:00 - 24:00', 3: '10:00 - 21:00',
  4: '09:00 - 21:00', 5: '10:00 - 15:00', 6: '11:30 - 21:00',
}
const parkingAvail = { 1: false, 2: false, 3: false, 4: false, 5: true, 6: false }
// 처음 방문자에게 추천하는 대표 메뉴 3가지 (체크리스트 기준)
const menuData = {
  1: [{ name: '마라전골', price: '28,000원' }, { name: '크림새우', price: '26,000원' }, { name: '보리새우 백짬뽕탕', price: '25,000원' }],
  2: [{ name: '돼지 안심 스테이크', price: '29,000원' }, { name: '파리지엔 뇨끼', price: '18,000원' }, { name: '한우안심 타르타르와 감자파브', price: '21,000원' }],
  3: [{ name: '파도바', price: '4,500원' }, { name: '부사노 크림프레소', price: '5,000원' }, { name: '오-부사노 피즈', price: '6,500원' }],
  4: [{ name: '연어 에그베네딕트', price: '18,000원' }, { name: '포테이토 릭 스프', price: '' }, { name: '홀리데이 라떼', price: '7,000원' }],
  5: [{ name: '돼지곰탕', price: '11,000원' }, { name: '고기 칼국수', price: '12,000원' }, { name: '수육', price: '29,000원' }],
  6: [{ name: '마파두부', price: '13,000원' }, { name: '볶음밥', price: '9,000원' }, { name: '우육면', price: '13,000원' }],
}

/* ─── 네비게이션 ────────────────────────────────────────── */
const navItems = [
  { id: 'home',   label: '홈',   icon: '🏠' },
  { id: 'search', label: '검색', icon: '🔍' },
  { id: 'map',    label: '지도', icon: '🗺️' },
  { id: 'my',     label: '마이', icon: '👤' },
]

const moodCategories = [
  { id: '전체',   label: '전체',   icon: '🍽️' },
  { id: '한식',   label: '한식',   icon: '🍚' },
  { id: '중식',   label: '중식',   icon: '🥢' },
  { id: '카페',   label: '카페',   icon: '☕' },
  { id: '브런치', label: '브런치', icon: '🥐' },
  { id: '아시안', label: '아시안', icon: '🍜' },
]
const homeMoodCategories = moodCategories

const situationCategories = [
  { id: '혼밥',   label: '혼밥',   icon: '🍚' },
  { id: '데이트', label: '데이트', icon: '❤️' },
  { id: '해장',   label: '해장',   icon: '🍲' },
  { id: '브런치', label: '브런치', icon: '🥐' },
  { id: '카페',   label: '카페',   icon: '☕' },
  { id: '얼큰한', label: '얼큰한', icon: '🌶️' },
]

const situationRecommendationMap = {
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

const accentClassNames = {
  sunset: 'accent-sunset', night: 'accent-night', espresso: 'accent-espresso',
  ocean: 'accent-ocean', forest: 'accent-forest', lime: 'accent-lime',
}

const mapCenter = [35.153, 129.1152]
const accentColors = {
  sunset: '#E8654A', night: '#163A5B', espresso: '#8B5E34',
  ocean: '#4A90C4', forest: '#2F7D46', lime: '#7BAE3C',
}

const cuisineCategories = [
  { id: '전체',   keywords: [] },
  { id: '한식',   keywords: ['한식', '곰탕', '국밥'] },
  { id: '중식',   keywords: ['중식', '마라'] },
  { id: '양식',   keywords: ['양식', '와인바', '다이닝바'] },
  { id: '브런치', keywords: ['브런치', '카페', '에스프레소바'] },
  { id: '카페',   keywords: ['카페', '에스프레소바', '브런치'] },
  { id: '아시안', keywords: ['아시안퓨전', '바오번', '우육면', '마파'] },
]

function getCuisineCategory(item) {
  const matched = cuisineCategories.find((c) => {
    if (c.id === '전체') return false
    return c.keywords.some((k) => item.category.includes(k))
  })
  return matched?.id ?? '기타'
}

function getSituationRecommendations(situation) {
  return (situationRecommendationMap[situation] ?? [])
    .map(({ id, reason }) => ({ item: restaurants.find((r) => r.id === id), reason }))
    .filter(({ item }) => Boolean(item))
}

function scoreRestaurant(item, query) {
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

function getTip(item) {
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

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:absolute;left:-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

function openMapLink(url) {
  if (!url || !url.startsWith('https://')) return
  window.location.href = url
}

function formatDate(full = false) {
  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return full
    ? `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())}`
    : `${pad(today.getMonth() + 1)}.${pad(today.getDate())}`
}

/* ─── 브레이크포인트 훅 ───────────────────────────────── */
function useBreakpoint() {
  function get() {
    const w = window.innerWidth
    if (w >= 1100) return 'desktop'
    if (w >= 768)  return 'tablet'
    return 'mobile'
  }
  const [bp, setBp] = useState(get)
  useEffect(() => {
    const h = () => setBp(get())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return bp
}

/* ─── 사이드 네비게이션 ─────────────────────────────────── */
function SideNav({ bp, activeTab, onTabChange, savedCount }) {
  const isDesktop = bp === 'desktop'
  return (
    <nav className={`side-nav${isDesktop ? ' side-nav-desktop' : ' side-nav-tablet'}`}>
      <div className="side-nav-brand">
        <span className="side-nav-logo-icon">🍽️</span>
        {isDesktop && <span className="side-nav-logo-text">부산미리한끼</span>}
      </div>
      <div className="side-nav-items">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`side-nav-btn${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={item.label}
          >
            <span className="side-nav-icon">{item.icon}</span>
            <span className="side-nav-label">{item.label}</span>
            {item.id === 'saved' && savedCount > 0 && (
              <span className="side-nav-badge">{savedCount}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

/* ─── 서브 컴포넌트 ──────────────────────────────────────── */

/* ─── 별점 표시 / 입력 컴포넌트 ──────────────────────────── */
function StarDisplay({ rating, className = '' }) {
  return (
    <span className={`star-display ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        if (rating >= n) return <span key={n} className="sd-full">★</span>
        if (rating >= n - 0.5) return (
          <span key={n} className="sd-half">
            <span className="sd-half-fill">★</span>
            <span className="sd-half-bg">★</span>
          </span>
        )
        return <span key={n} className="sd-empty">★</span>
      })}
    </span>
  )
}

function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(null)
  const display = hover ?? value
  return (
    <div className="star-input" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="si-star">
          <button type="button" className="si-half si-left"
            onClick={() => onChange(n - 0.5)}
            onMouseEnter={() => setHover(n - 0.5)} />
          <button type="button" className="si-half si-right"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)} />
          {display >= n
            ? <span className="sd-full">★</span>
            : display >= n - 0.5
            ? <span className="sd-half"><span className="sd-half-fill">★</span><span className="sd-half-bg">★</span></span>
            : <span className="sd-empty">★</span>}
        </span>
      ))}
      <span className="si-val">{display}</span>
    </div>
  )
}

function PhotoThumb({ item, className = '' }) {
  const src = item.banner ?? item.photos?.[0]?.src
  if (src) {
    return <img src={asset(src)} alt={item.name} className={className} />
  }
  return (
    <div className={`emoji-thumb ${accentClassNames[item.accent]} ${className}`}>
      <span>{item.icon}</span>
    </div>
  )
}

/** 리스트형 트렌딩 아이템 */
function TrendingItem({ item, saved, onToggleSave, onSelect }) {
  const userLoc = useContext(UserLocCtx)
  const reviewStats = useContext(ReviewStatsCtx)
  const eta = getEta(item, userLoc)
  const stats = reviewStats[item.id]
  return (
    <article className="trending-item" onClick={() => onSelect(item.id)}>
      <div className="trending-thumb">
        <PhotoThumb item={item} />
      </div>
      <div className="trending-body">
        <strong>{item.name}</strong>
        <p className="trending-sub">{item.location}</p>
        <div className="card-rating-row">
          {stats ? (
            <>
              <span className="card-star">⭐</span>
              <span className="card-avg">{stats.avg}</span>
              <span className="card-count">후기 {stats.count}</span>
            </>
          ) : (
            <span className="card-no-rating">후기 없음</span>
          )}
          {eta && <span className="card-eta-inline">· {eta}</span>}
        </div>
      </div>
      <button
        className={`heart-btn sm ${saved ? 'saved' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleSave(item.id) }}
        aria-label="찜"
      >
        {saved ? '❤️' : '🤍'}
      </button>
    </article>
  )
}


function SituationCard({ item, reason, onSelect, onOpenMap }) {
  const userLoc = useContext(UserLocCtx)
  return (
    <article className="situation-card">
      <button className="situation-card-main" onClick={() => onSelect(item.id)}>
        <div className="situation-thumb">
          <PhotoThumb item={item} />
        </div>
        <div className="situation-body">
          <div className="situation-title-row">
            <strong>{item.name}</strong>
            <span>{item.experience.vibe}</span>
          </div>
          <p>{reason}</p>
          <div className="situation-meta">
            {getEta(item, userLoc) && <span>📍 {getEta(item, userLoc)}</span>}
            <span>⏳ {item.experience.waitTime}</span>
          </div>
        </div>
      </button>
      <div className="situation-actions">
        <button onClick={() => onSelect(item.id)}>상세보기</button>
        <button onClick={() => onOpenMap(item.id)}>지도</button>
      </div>
    </article>
  )
}

const LOCATION_OPTIONS = ['내 위치', '광안리', '해운대', '서면/전포', '남포']

/* ─── 상단 앱바 ─── */
function AppTopBar({ onGoSearch, area, setArea }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="app-top-bar">
      <div className="atb-location-wrap">
        <button className="atb-location" onClick={() => setOpen((v) => !v)}>
          <span className="atb-pin">📍</span>
          <span className="atb-area">{area}</span>
          <svg className="atb-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {open && (
          <>
            <div className="atb-backdrop" onClick={() => setOpen(false)} />
            <ul className="atb-dropdown">
              {LOCATION_OPTIONS.map((loc) => (
                <li key={loc}>
                  <button
                    className={`atb-dropdown-item${area === loc ? ' active' : ''}`}
                    onClick={() => { setArea(loc); setOpen(false) }}
                  >
                    {area === loc && <span className="atb-check">✓</span>}
                    {loc}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="atb-actions">
        <button className="atb-btn" onClick={onGoSearch} aria-label="검색">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button className="atb-btn" aria-label="알림">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
      </div>
    </header>
  )
}

/* ─── 모던 카드 ─── */
function ModernCard({ item, saved, onToggleSave, onSelect }) {
  const userLoc = useContext(UserLocCtx)
  const reviewStats = useContext(ReviewStatsCtx)
  const eta     = getEta(item, userLoc)
  const moodBadges = item.mood?.slice(0, 2) || []
  const stats = reviewStats[item.id]

  return (
    <article className="m-card" onClick={() => onSelect(item.id)}>
      <div className="m-card-img-wrap">
        <PhotoThumb item={item} className="m-card-img" />
        <button
          className={`m-heart ${saved ? 'on' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(item.id) }}
          aria-label="찜"
        >{saved ? '❤️' : '🤍'}</button>
        {stats && (
          <span className="m-card-rating-badge">
            ⭐ {stats.avg} <em>({stats.count})</em>
          </span>
        )}
      </div>
      <div className="m-card-body">
        <div className="m-card-top">
          <strong className="m-card-name">{item.name}</strong>
          <span className="m-card-loc">📍 {item.location}</span>
        </div>
        <p className="m-card-hero">{item.hero}</p>
        <div className="m-card-mood">
          {moodBadges.map((m) => <span key={m} className="m-mood-tag">{m}</span>)}
        </div>
        <div className="m-card-foot">
          <span className="m-card-price">{item.price}</span>
        </div>
      </div>
    </article>
  )
}

function InteractiveMap({ items, activeId, onActive, mode = 'overview' }) {
  const userLoc = useContext(UserLocCtx)
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef([])
  const userMarkerRef = useRef(null)

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [items, activeId],
  )

  useEffect(() => {
    if (!mapEl.current || mapRef.current || !window.L) return undefined

    const map = window.L.map(mapEl.current, {
      center: activeItem?.lat && activeItem?.lng ? [activeItem.lat, activeItem.lng] : mapCenter,
      zoom: mode === 'focused' ? 16 : 14,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(map)
    window.L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current = []
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return

    window.__miriSelectRestaurant = (id) => onActive?.(Number(id))

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current = []

    const coords = []
    items.forEach((item) => {
      if (!item.lat || !item.lng) return
      coords.push([item.lat, item.lng])
      const active = item.id === activeId
      const color = accentColors[item.accent] ?? '#E8654A'
      const icon = window.L.divIcon({
        html: `
          <button type="button" class="custom-marker${active ? ' active' : ''}" style="background:${color}" onclick="window.__miriSelectRestaurant && window.__miriSelectRestaurant(${item.id})">
            <span class="custom-marker-inner">${item.icon}</span>
          </button>
        `,
        className: 'custom-marker-shell',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = window.L.marker([item.lat, item.lng], {
        icon,
        zIndexOffset: active ? 1000 : 0,
      })
        .addTo(map)
        .on('click', () => onActive?.(item.id))

      marker.getElement()?.addEventListener('click', () => onActive?.(item.id))
      marker.getElement()?.addEventListener('touchend', () => onActive?.(item.id), { passive: true })
      markerRefs.current.push(marker)
    })

    window.setTimeout(() => {
      map.invalidateSize()
      if (mode === 'focused' && activeItem?.lat && activeItem?.lng) {
        map.setView([activeItem.lat, activeItem.lng], 16, { animate: true })
      } else if (coords.length === 1) {
        map.setView(coords[0], 15, { animate: true })
      } else if (coords.length > 1) {
        map.fitBounds(window.L.latLngBounds(coords), {
          paddingTopLeft: [46, 42],
          paddingBottomRight: [46, 88],
          maxZoom: 15,
          animate: true,
          duration: 0.45,
        })
      }
    }, 80)
  }, [items, activeId, onActive, mode, activeItem])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeItem?.lat || !activeItem?.lng) return
    if (mode === 'focused') {
      map.setView([activeItem.lat, activeItem.lng], 16, { animate: true })
    }
    window.setTimeout(() => map.invalidateSize(), 60)
  }, [activeItem, mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }
    if (!userLoc) return
    const icon = window.L.divIcon({
      html: `<div class="user-loc-marker"><div class="user-loc-dot"></div><div class="user-loc-ring"></div></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    userMarkerRef.current = window.L.marker([userLoc.lat, userLoc.lng], { icon, zIndexOffset: 2000 }).addTo(map)
  }, [userLoc])

  return (
    <div className="interactive-map">
      {!window.L && <div className="map-loading">지도를 불러오는 중입니다.</div>}
      <div id="map" ref={mapEl} className="leaflet-map" />
    </div>
  )
}

/* ─── 내 음식 지도 ─────────────────────────────────────── */
function MyFoodMap({ visitRecords, onSelect }) {
  const [activeId, setActiveId] = useState(null)

  // 방문한 식당 고유 목록 (방문 횟수 포함)
  const visitedItems = useMemo(() => {
    const countMap = {}
    visitRecords.forEach((v) => {
      if (!countMap[v.restaurantId]) countMap[v.restaurantId] = { count: 0, lastDish: v.dish, lastDate: v.date }
      countMap[v.restaurantId].count += 1
      countMap[v.restaurantId].lastDish = v.dish
      countMap[v.restaurantId].lastDate = v.date
    })
    return restaurants
      .filter((r) => countMap[r.id])
      .map((r) => ({ ...r, visitCount: countMap[r.id].count, lastDish: countMap[r.id].lastDish, lastDate: countMap[r.id].lastDate }))
  }, [visitRecords])

  const activeItem = visitedItems.find((r) => r.id === activeId) ?? visitedItems[0] ?? null

  if (visitedItems.length === 0) {
    return <div className="my-saved-empty"><span>🗺️</span><p>방문 기록을 추가하면 지도에 표시돼요</p></div>
  }

  return (
    <div className="my-food-map-wrap">
      <InteractiveMap
        items={visitedItems}
        activeId={activeId ?? visitedItems[0]?.id}
        onActive={setActiveId}
        mode="overview"
      />
      {activeItem && (
        <button className="my-food-map-info" onClick={() => onSelect(activeItem.id)}>
          <span className="mfm-icon">{activeItem.icon}</span>
          <div className="mfm-body">
            <strong>{activeItem.name}</strong>
            <p>{activeItem.lastDish} · {activeItem.lastDate}</p>
          </div>
          <div className="mfm-right">
            <span className="mfm-cnt">{activeItem.visitCount}회</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </button>
      )}
      <div className="my-food-map-list">
        {visitedItems.map((r) => (
          <button
            key={r.id}
            className={`mfm-chip${activeId === r.id || (!activeId && visitedItems[0]?.id === r.id) ? ' active' : ''}`}
            onClick={() => setActiveId(r.id)}
          >
            <span>{r.icon}</span>
            <span>{r.name}</span>
            <span className="mfm-chip-cnt">{r.visitCount}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── 로그인 / 회원가입 화면 ───────────────────────────── */
function AuthScreen({ onDone, onSkip }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar]     = useState('🌊')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('이메일과 비밀번호를 입력해주세요'); return }
    if (mode === 'signup') {
      if (password !== confirm) { setError('비밀번호가 일치하지 않아요'); return }
      if (!nickname.trim()) { setError('닉네임을 입력해주세요'); return }
    }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요'); return }
    setLoading(true)
    try {
      const user = mode === 'signup'
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password)
      if (mode === 'signup') {
        const profileData = { name: nickname.trim(), avatar }
        window.localStorage.setItem('miri-hankki-profile', JSON.stringify(profileData))
        onDone(user, profileData)
      } else {
        onDone(user, null)
      }
    } catch (e) {
      const msg = {
        'auth/email-already-in-use': '이미 사용 중인 이메일이에요',
        'auth/user-not-found':       '등록되지 않은 이메일이에요',
        'auth/wrong-password':       '비밀번호가 틀렸어요',
        'auth/invalid-email':        '이메일 형식이 올바르지 않아요',
        'auth/too-many-requests':    '잠시 후 다시 시도해주세요',
        'auth/invalid-credential':   '이메일 또는 비밀번호가 틀렸어요',
      }[e.code] || '오류가 발생했어요. 다시 시도해주세요'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      {onSkip && (
        <button className="auth-close-btn" onClick={onSkip} aria-label="닫기">✕</button>
      )}
      <div className="auth-inner">
        <div className="auth-logo">🌊</div>
        <h1 className="auth-title">부산 미리한끼</h1>
        <p className="auth-sub">{mode === 'login' ? '다시 오셨군요! 로그인해주세요' : '부산 맛집 여정을 시작해요'}</p>

        <div className="auth-tab-row">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError('') }}>로그인</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>회원가입</button>
        </div>

        <div className="auth-form">
          <input className="auth-input" type="email" placeholder="이메일" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input className="auth-input" type="password" placeholder="비밀번호 (6자 이상)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => mode === 'login' && e.key === 'Enter' && handleSubmit()} />
          {mode === 'signup' && (
            <>
              <input className="auth-input" type="password" placeholder="비밀번호 확인" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} />
              <input className="auth-input" placeholder="닉네임 (예: 광안 미식가)" value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                maxLength={12} />
              <div className="ps-avatar-grid" style={{ marginTop: 4 }}>
                {PROFILE_AVATARS.map((em) => (
                  <button key={em} type="button"
                    className={`ps-avatar-btn${avatar === em ? ' active' : ''}`}
                    onClick={() => setAvatar(em)}>{em}</button>
                ))}
              </div>
            </>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button className={`auth-submit${loading ? ' loading' : ''}`} onClick={handleSubmit} disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 프로필 설정 화면 ─────────────────────────────────── */
const PROFILE_AVATARS = ['🌊','🍱','🥢','🍜','☕','🥐','🍖','🌶️','🍣','🥗','🍙','🍷']

function ProfileSetup({ onDone }) {
  const [name, setName]     = useState('')
  const [avatar, setAvatar] = useState('🌊')

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const profile = { name: trimmed, avatar }
    window.localStorage.setItem('miri-hankki-profile', JSON.stringify(profile))
    onDone(profile)
  }

  return (
    <div className="profile-setup">
      <div className="ps-inner">
        <div className="ps-selected-avatar">{avatar}</div>
        <h1 className="ps-title">미리한끼에<br/>오신 걸 환영해요 🎉</h1>
        <p className="ps-sub">닉네임과 아바타를 설정해주세요</p>

        <div className="ps-avatar-grid">
          {PROFILE_AVATARS.map((em) => (
            <button
              key={em}
              className={`ps-avatar-btn${avatar === em ? ' active' : ''}`}
              onClick={() => setAvatar(em)}
            >{em}</button>
          ))}
        </div>

        <input
          className="ps-name-input"
          placeholder="닉네임 입력 (예: 광안 미식가)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={12}
        />
        <button
          className={`ps-submit${name.trim() ? '' : ' disabled'}`}
          onClick={handleSubmit}
          disabled={!name.trim()}
        >🍽️ 시작하기</button>
      </div>
    </div>
  )
}

/* ─── 스플래시 화면 ─────────────────────────────────────── */
function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="splash">
      <div className="splash-bg">
        <img src={asset('/busan-bg.png')} alt="" aria-hidden="true" />
      </div>
      <div className="splash-overlay" />
      <div className="splash-content">
        <div className="splash-logo-area">
          <div className="splash-brand-mark" aria-hidden="true">
            <span className="brand-cloche">◜</span>
            <span className="brand-pin">●</span>
          </div>
          <h1 className="splash-title">
            <span className="title-ko">부산</span>
            <span className="title-ko accent">미리한끼</span>
          </h1>
          <p className="splash-subtitle">부산에서, 미리 만나는 맛있는 한 끼 ❤️</p>
        </div>
      </div>
    </div>
  )
}

/* ─── 프로모 배너 슬라이드 ─────────────────────────────── */
const PROMO_SLIDES = [
  { area: '광안리', img: '/promo-bg.jpg',  grad: null,                                     tag: '직접 가본 것처럼 미리 확인', title: '사진·분위기·메뉴·웨이팅까지', bold: '광안리 맛집' },
  { area: '서면',   img: null,             grad: 'linear-gradient(135deg,#163A5B,#1e5080)', tag: '직접 가본 것처럼 미리 확인', title: '부산의 중심에서',             bold: '서면 맛집'   },
  { area: '남포',   img: null,             grad: 'linear-gradient(135deg,#3b2a1a,#6b4423)', tag: '직접 가본 것처럼 미리 확인', title: '역사가 담긴',                 bold: '남포 맛집'   },
  { area: '해운대', img: null,             grad: 'linear-gradient(135deg,#0a6e8a,#1a9bb5)', tag: '직접 가본 것처럼 미리 확인', title: '바다를 품은',                 bold: '해운대 맛집' },
]

function PromoBanner({ onAreaSelect }) {
  const [idx, setIdx]   = useState(0)
  const [drag, setDrag] = useState(null)
  const timerRef        = useRef(null)
  const total           = PROMO_SLIDES.length

  function resetTimer() {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % total), 4500)
  }

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current) }, [])

  function goTo(next) {
    setIdx(((next % total) + total) % total)
    resetTimer()
  }

  function onTouchStart(e) { setDrag({ startX: e.touches[0].clientX, startIdx: idx }) }
  function onTouchEnd(e) {
    if (!drag) return
    const dx = e.changedTouches[0].clientX - drag.startX
    if (dx < -40)      goTo(drag.startIdx + 1)
    else if (dx > 40)  goTo(drag.startIdx - 1)
    setDrag(null)
  }
  function onMouseDown(e) { setDrag({ startX: e.clientX, startIdx: idx }) }
  function onMouseUp(e) {
    if (!drag) return
    const dx = e.clientX - drag.startX
    if (dx < -40)      goTo(drag.startIdx + 1)
    else if (dx > 40)  goTo(drag.startIdx - 1)
    setDrag(null)
  }

  const slide = PROMO_SLIDES[idx]
  const bgStyle = slide.img
    ? { backgroundImage: `url("${asset(slide.img)}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: slide.grad }

  return (
    <div
      className="home-promo"
      style={{ ...bgStyle, cursor: drag ? 'grabbing' : 'grab' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={() => setDrag(null)}
      onClick={() => { if (onAreaSelect && !drag) onAreaSelect(slide.area) }}
    >
      <div className="promo-left">
        <span className="promo-tag">{slide.tag}</span>
        <p className="promo-title">{slide.title}<br/><b>{slide.bold}</b>을 찾아보세요</p>
      </div>
      <div className="promo-dots">
        {PROMO_SLIDES.map((_, i) => (
          <button key={i} className={`promo-dot${i === idx ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); goTo(i) }} />
        ))}
      </div>
    </div>
  )
}

// "1인 22,000 ~ 35,000원대" → 평균 가격 추출
function parseAvgPrice(priceStr) {
  const m = priceStr?.match(/1인\s+([\d,]+)\s*~\s*([\d,]+)/)
  if (!m) return 0
  const min = parseInt(m[1].replace(/,/g, ''))
  const max = parseInt(m[2].replace(/,/g, ''))
  return Math.round((min + max) / 2)
}

const PRICE_FILTERS = [
  { id: '전체',    label: '전체',       test: () => true },
  { id: '1만이하', label: '1만원 이하', test: (item) => parseAvgPrice(item.price) <= 10000 },
  { id: '1~2만',   label: '1~2만원',    test: (item) => { const p = parseAvgPrice(item.price); return p > 10000 && p <= 20000 } },
  { id: '2만이상', label: '2만원 이상', test: (item) => parseAvgPrice(item.price) > 20000 },
]

const TRAIT_FILTERS = [
  { id: '웨이팅적음', label: '웨이팅 적음', icon: '✅', test: (item) => item.experience?.waitTime?.includes('대기 없음') },
  { id: '조용함',     label: '조용함',       icon: '🤫', test: (item) => item.experience?.noise === '낮음' },
  { id: '혼밥가능',   label: '혼밥 가능',    icon: '🍱', test: (item) => item.experience?.soloOk === true },
  { id: '분위기있음', label: '분위기 있음',  icon: '✨', test: (item) => item.experience?.vibe === '감성' },
]

/* ─── 하루 코스 슬롯 정의 ─────────────────────────────── */
// 각 슬롯에 어울리는 식당 후보 (id 배열)
const COURSE_SLOTS = [
  { slot: '브런치', time: '09:00~', candidates: [4, 3] },       // 워킹홀리데이, 까사부사노
  { slot: '점심',   time: '12:00~', candidates: [5, 6, 4, 3] }, // 나막집, 바오하우스, 워킹홀리데이, 까사부사노
  { slot: '카페',   time: '14:00~', candidates: [3, 4] },        // 까사부사노, 워킹홀리데이
  { slot: '저녁',   time: '18:00~', candidates: [1, 2, 6] },     // 푸안, 무벳, 바오하우스
]

function generateCourse() {
  const used = new Set()
  return COURSE_SLOTS.map((slot) => {
    // 아직 안 쓴 후보 중 랜덤 선택
    const available = slot.candidates.filter((id) => !used.has(id))
    const id = available[Math.floor(Math.random() * available.length)]
    used.add(id)
    return { ...slot, id }
  })
}

/* ─── 하루 코스 컴포넌트 ──────────────────────────────── */
function DayCoursePlanner({ onSelect, onSaveCourse }) {
  const [course, setCourse] = useState(null)
  const [saved, setSaved] = useState(false)

  function handleGenerate() {
    setCourse(generateCourse())
    setSaved(false)
  }

  function handleSave() {
    if (!course) return
    const steps = course.map((step) => {
      const rest = restaurants.find((r) => r.id === step.id)
      return { slot: step.slot, time: step.time, restaurantId: step.id, restaurantName: rest?.name ?? '' }
    })
    onSaveCourse({ id: Date.now(), date: formatDate(true), steps })
    setSaved(true)
  }

  return (
    <section className="day-course-section">
      <div className="day-course-hd">
        <div>
          <h2>🗓️ 하루 코스 짜줘</h2>
          <p>버튼을 누르면 브런치부터 저녁까지 랜덤으로 추천해드려요</p>
        </div>
        <button className="day-generate-btn" onClick={handleGenerate}>
          {course ? '🎲 다시 뽑기' : '🎲 코스 뽑기'}
        </button>
      </div>

      {course && (
        <>
          <div className="day-course-timeline">
            {course.map((step, i) => {
              const rest = restaurants.find((r) => r.id === step.id)
              if (!rest) return null
              return (
                <div key={i} className="day-step">
                  <div className="day-step-left">
                    <div className="day-step-time">{step.time}</div>
                    <div className={`day-step-dot${i === course.length - 1 ? ' last' : ''}`} />
                    {i < course.length - 1 && <div className="day-step-line" />}
                  </div>
                  <button className="day-step-card" onClick={() => onSelect(rest.id)}>
                    <div className="day-step-thumb"><PhotoThumb item={rest} /></div>
                    <div className="day-step-info">
                      <span className="day-step-slot">{step.slot}</span>
                      <strong>{rest.name}</strong>
                      <p>{rest.hero}</p>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
          <button
            className={`day-save-btn${saved ? ' saved' : ''}`}
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? '✅ 저장됨' : '🔖 이 코스 저장하기'}
          </button>
        </>
      )}
    </section>
  )
}

/* ─── 홈 화면 ───────────────────────────────────────────── */
function HomeScreen({ savedIds, onToggleSave, onSelect, onGoSearch, onGoMap, onOpenMapItem, onSaveCourse }) {
  const [moodFilter, setMoodFilter]   = useState('전체')
  const [priceFilter, setPriceFilter] = useState('전체')
  const [traitFilter, setTraitFilter] = useState(null)
  const [situation, setSituation]     = useState('혼밥')
  const [area, setArea]               = useState('내 위치')
  const userLoc                       = useContext(UserLocCtx)

  const NEARBY_KM = 5

  const areaFiltered = useMemo(() => {
    if (area === '내 위치') {
      if (!userLoc) return restaurants
      return restaurants.filter((item) => haversine(userLoc.lat, userLoc.lng, item.lat, item.lng) <= NEARBY_KM)
    }
    return restaurants.filter((item) => item.location.includes(area))
  }, [area, userLoc])

  const filtered = useMemo(() => {
    let list = areaFiltered
    // 음식 카테고리
    if (moodFilter !== '전체') {
      const cat = cuisineCategories.find((c) => c.id === moodFilter)
      if (cat?.keywords.length > 0) list = list.filter((item) => cat.keywords.some((k) => item.category.includes(k)))
    }
    // 가격
    const pf = PRICE_FILTERS.find((f) => f.id === priceFilter)
    if (pf && pf.id !== '전체') list = list.filter(pf.test)
    // 특징
    const tf = TRAIT_FILTERS.find((f) => f.id === traitFilter)
    if (tf) list = list.filter(tf.test)
    return list
  }, [moodFilter, priceFilter, traitFilter, areaFiltered])

  const situationItems = useMemo(() => getSituationRecommendations(situation), [situation])

  return (
    <div className="home-screen">

      {/* ── 상단 앱바 ── */}
      <AppTopBar onGoSearch={onGoSearch} area={area} setArea={setArea} />

      {/* ── 프로모 배너 ── */}
      <PromoBanner onAreaSelect={(a) => setArea(a)} />

      {/* ── 음식 카테고리 필터 ── */}
      <div className="home-cat-row">
        {homeMoodCategories.map((c) => (
          <button
            key={c.id}
            className={`hcat-chip${moodFilter === c.id ? ' active' : ''}`}
            onClick={() => setMoodFilter(c.id)}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* ── 가격 + 특징 필터 ── */}
      <div className="home-filter-row">
        <div className="home-filter-group">
          {PRICE_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-pill${priceFilter === f.id ? ' active' : ''}`}
              onClick={() => setPriceFilter(f.id)}
            >{f.label}</button>
          ))}
        </div>
        <div className="home-filter-group">
          {TRAIT_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-pill${traitFilter === f.id ? ' active' : ''}`}
              onClick={() => setTraitFilter(traitFilter === f.id ? null : f.id)}
            >{f.icon} {f.label}</button>
          ))}
        </div>
      </div>

      {/* ── 결과 헤더 ── */}
      {area === '내 위치' && !userLoc && (
        <div className="home-loc-notice">
          📍 위치 권한을 허용하면 주변 가게만 보여드려요
        </div>
      )}
      <div className="home-list-hd">
        <span className="home-cnt">
          {filtered.length}곳
          {moodFilter !== '전체' ? ` · ${moodFilter}` : ''}
          {priceFilter !== '전체' ? ` · ${PRICE_FILTERS.find(f=>f.id===priceFilter)?.label}` : ''}
          {traitFilter ? ` · ${TRAIT_FILTERS.find(f=>f.id===traitFilter)?.label}` : ''}
          {area !== '내 위치' ? ` · ${area}` : ''}
        </span>
        <button className="home-sort" onClick={onGoMap}>🗺️ 지도로 보기</button>
      </div>

      {/* ── 메인 카드 그리드 ── */}
      {filtered.length > 0 ? (
        <div className="home-v2-grid">
          {filtered.map((item) => (
            <ModernCard
              key={item.id}
              item={item}
              saved={savedIds.includes(item.id)}
              onToggleSave={onToggleSave}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className="home-empty-state">
          <div className="home-empty-icon">🍽️</div>
          <p className="home-empty-title">조건에 맞는 맛집이 없어요</p>
          <p className="home-empty-sub">필터를 바꿔서 다시 찾아볼까요?</p>
          <button className="home-empty-btn" onClick={() => setMoodFilter('전체')}>전체 보기</button>
        </div>
      )}

      {/* ── 상황별 추천 ── */}
      <section className="home-situation-section">
        <div className="home-sit-hd">
          <h2>상황별 추천</h2>
        </div>
        <div className="home-sit-chips">
          {situationCategories.map((cat) => (
            <button
              key={cat.id}
              className={`sit-chip${situation === cat.id ? ' active' : ''}`}
              onClick={() => setSituation(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <div className="home-sit-list">
          {situationItems.map(({ item, reason }) => (
            <ModernSituationCard
              key={`${situation}-${item.id}`}
              item={item}
              reason={reason}
              onSelect={onSelect}
              onGoMap={onOpenMapItem}
            />
          ))}
        </div>
      </section>

      {/* ── 하루 코스 ── */}
      <DayCoursePlanner onSelect={onSelect} onSaveCourse={onSaveCourse} />

      {/* ── 하단 여백 ── */}
      <div style={{ height: 24 }} />
    </div>
  )
}

function ModernSituationCard({ item, reason, onSelect, onGoMap }) {
  const userLoc = useContext(UserLocCtx)
  return (
    <article className="msit-card" onClick={() => onSelect(item.id)}>
      <div className="msit-thumb">
        <PhotoThumb item={item} className="msit-img" />
      </div>
      <div className="msit-body">
        <strong className="msit-name">{item.name}</strong>
        <p className="msit-reason">{reason}</p>
        <div className="msit-meta">
          {getEta(item, userLoc) && <span>📍 {getEta(item, userLoc)}</span>}
          <span>{item.price}</span>
        </div>
      </div>
      <svg className="msit-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </article>
  )
}

/* ─── 검색 / 키워드 추천 화면 ──────────────────────────── */
function SearchScreen({ savedIds, onToggleSave, onSelect }) {
  const userLoc = useContext(UserLocCtx)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [allResults, setAllResults] = useState(null)
  const inputRef = useRef(null)

  function handleSearch() {
    if (!query.trim()) return
    const ranked = restaurants
      .map((item) => ({ item, ...scoreRestaurant(item, query) }))
      .sort((a, b) => b.score - a.score)
    setAllResults(ranked)
    const best = ranked[0]
    if (!best || best.score === 0) {
      setResult({ item: restaurants[0], matches: [], reason: '질문이 아직 구체적이지 않아서 가장 무난한 곳을 먼저 골랐어요.' })
    } else {
      setResult({ item: best.item, matches: best.matches, reason: best.reason })
    }
  }

  const exampleQueries = [
    '오늘 비 오는데 따뜻한 국물 뭐가 좋을까?',
    '광안리 데이트 코스 추천해줘',
    '혼자 가기 좋은 점심 맛집',
    '분위기 좋은 카페 어디 있어?',
  ]

  return (
    <div className="search-screen">
      <div className="search-header-bar">
        <div className="search-input-wrap">
          <span>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="지역, 음식, 맛집을 검색해보세요"
          />
          {query && <button className="clear-btn" onClick={() => { setQuery(''); setResult(null); setAllResults(null) }}>✕</button>}
        </div>
        <button className="search-go-btn" onClick={handleSearch}>검색</button>
      </div>

      {!result && (
        <>
          <div className="keyword-section">
            <div className="keyword-badge">🔍 키워드 추천</div>
            <h3>어떤 분위기로 찾으세요?</h3>
            <p className="keyword-desc">음식, 분위기, 상황을 입력하면 태그와 연결해 맞는 맛집을 찾아드려요.</p>
            <div className="example-queries">
              {exampleQueries.map((q) => (
                <button key={q} className="example-chip" onClick={() => { setQuery(q) }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <section className="home-section" style={{ marginTop: 8 }}>
            <div className="section-header"><h2>전체 맛집</h2></div>
            <div className="trending-list">
              {restaurants.map((item) => (
                <TrendingItem key={item.id} item={item} saved={savedIds.includes(item.id)} onToggleSave={onToggleSave} onSelect={onSelect} />
              ))}
            </div>
          </section>
        </>
      )}

      {result && (
        <div className="ai-result-area">
          <div className="ai-best-card" onClick={() => onSelect(result.item.id)}>
            <div className="ai-best-photo">
              <PhotoThumb item={result.item} />
              <div className="ai-best-badge">🔍 키워드 매칭</div>
            </div>
            <div className="ai-best-body">
              <strong>{result.item.name}</strong>
              <p className="ai-reason">{result.reason}</p>
              {result.matches?.length > 0 && (
                <div className="matched-tags">
                  {result.matches.map((m) => (
                    <span key={m} className="matched-tag">#{m}</span>
                  ))}
                </div>
              )}
              {getEta(result.item, userLoc) && <p className="item-eta">{getEta(result.item, userLoc)}</p>}
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <h2>추천 결과</h2>
            <button className="see-more" onClick={() => { setResult(null); setAllResults(null); setQuery('') }}>다시 검색</button>
          </div>
          <div className="ai-result-grid">
            {allResults?.slice(0, 3).map(({ item, matches }) => (
              <article key={item.id} className="ai-result-card" onClick={() => onSelect(item.id)}>
                <div className="ai-result-img"><PhotoThumb item={item} /></div>
                <p className="rec-location">{item.location}</p>
                <strong>{item.name.length > 8 ? item.name.slice(0, 8) + '…' : item.name}</strong>
                {matches?.length > 0 && (
                  <div className="matched-tags" style={{ marginTop: 4 }}>
                    {matches.slice(0, 2).map((m) => (
                      <span key={m} className="matched-tag">#{m}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 지도 화면 ─────────────────────────────────────────── */
function MapScreen({ mapSelectedId, setMapSelectedId, onSelect, bp }) {
  const userLoc = useContext(UserLocCtx)
  const [categoryFilter, setCategoryFilter] = useState('전체')

  const filteredItems = useMemo(() => {
    if (categoryFilter === '전체') return restaurants
    const cat = cuisineCategories.find((c) => c.id === categoryFilter)
    if (!cat || cat.keywords.length === 0) return restaurants
    return restaurants.filter((r) => cat.keywords.some((k) => r.category.includes(k)))
  }, [categoryFilter])

  const mapItem = useMemo(
    () => filteredItems.find((r) => r.id === mapSelectedId) ?? filteredItems[0] ?? restaurants[0],
    [filteredItems, mapSelectedId],
  )

  const isWeb = bp === 'tablet' || bp === 'desktop'

  if (isWeb) {
    return (
      <div className="map-screen-web">
        <div className="map-side-panel">
          <div className="map-side-header">
            <h3 className="map-side-title">맛집 지도</h3>
            <p className="map-side-sub">{filteredItems.length}곳</p>
          </div>
          <div className="map-filter-bar">
            {moodCategories.map((c) => (
              <button
                key={c.id}
                className={`map-filter-chip${categoryFilter === c.id ? ' active' : ''}`}
                onClick={() => setCategoryFilter(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div className="map-side-list">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className={`map-list-item${mapItem.id === item.id ? ' active' : ''}`}
                onClick={() => setMapSelectedId(item.id)}
              >
                <div className="map-list-thumb"><PhotoThumb item={item} /></div>
                <div className="map-list-info">
                  <strong>{item.name}</strong>
                  <p>{getCuisineCategory(item)} · {item.location}</p>
                  {getEta(item, userLoc) && <p className="map-list-eta">{getEta(item, userLoc)}</p>}
                </div>
                {mapItem.id === item.id && <span className="map-list-active-dot" />}
              </button>
            ))}
          </div>
          <div className="map-side-actions">
            <button className="map-side-btn primary" onClick={() => onSelect(mapItem.id)}>상세보기</button>
            <button className="map-side-btn" onClick={() => openMapLink(mapItem.links.naver)}>네이버 지도</button>
            <button className="map-side-btn" onClick={() => openMapLink(mapItem.links.kakao)}>카카오맵</button>
          </div>
        </div>
        <div className="map-main-panel">
          <InteractiveMap items={filteredItems} activeId={mapItem.id} onActive={setMapSelectedId} mode="overview" />
          <div className="map-selected-overlay" onClick={() => onSelect(mapItem.id)}>
            <div className="map-selected-thumb"><PhotoThumb item={mapItem} /></div>
            <div className="map-selected-info">
              <strong>{mapItem.name}</strong>
              <p>{mapItem.category} · {mapItem.location}{getEta(mapItem, userLoc) ? ` · ${getEta(mapItem, userLoc)}` : ''}</p>
            </div>
            <span className="map-chevron">›</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="map-screen">
      <div className="map-body" style={{ position: 'relative' }}>
        <div className="map-chip-overlay">
          {moodCategories.map((c) => (
            <button
              key={c.id}
              className={`map-chip${categoryFilter === c.id ? ' active' : ''}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="map-real-wrap">
          <InteractiveMap items={filteredItems} activeId={mapItem.id} onActive={setMapSelectedId} mode="overview" />
        </div>
      </div>

      <div className="map-bottom-card">
        <div className="map-bottom-inner" onClick={() => onSelect(mapItem.id)}>
          <div className="map-bottom-thumb">
            <PhotoThumb item={mapItem} />
          </div>
          <div className="map-bottom-info">
            <strong>{mapItem.name}</strong>
            <p>{mapItem.category} · {mapItem.location}</p>
            {getEta(mapItem, userLoc) && <p className="item-eta">{getEta(mapItem, userLoc)}</p>}
          </div>
          <span className="map-chevron">›</span>
        </div>
        <div className="map-bottom-actions">
          <div className="map-action-row">
            <button className="map-btn naver" onClick={() => openMapLink(mapItem.links.naver)}>네이버 지도</button>
            <button className="map-btn kakao" onClick={() => openMapLink(mapItem.links.kakao)}>카카오맵</button>
            <button className="map-btn google" onClick={() => openMapLink(mapItem.links.google)}>구글지도</button>
            <button className="map-btn detail" onClick={() => onSelect(mapItem.id)}>상세정보</button>
          </div>
          <div className="map-place-section">
            <p className="map-place-title">가게 선택</p>
            <div className="map-place-scroll">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`map-place-card ${mapSelectedId === item.id ? 'active' : ''}`}
                  onClick={() => setMapSelectedId(item.id)}
                >
                  <span className="map-place-thumb"><PhotoThumb item={item} /></span>
                  <span className="map-place-copy">
                    <strong>{item.name}</strong>
                    <small>{getCuisineCategory(item)}{getEta(item, userLoc) ? ` · ${getEta(item, userLoc)}` : ''}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ─── 마이 화면 ─────────────────────────────────────────── */
function MyScreen({ savedIds, onToggleSave, onSelect, onGoMap, visitRecords, setVisitRecords, reviews, setReviews, savedCourses, onDeleteCourse, isInstalledApp, installPrompt, onInstall, showInstallGuide, setShowInstallGuide, profile, onEditProfile, onLogout, firebaseUser, onLogin }) {
  const [activeFilter, setActiveFilter] = useState('전체')
  const [rouletteItem, setRouletteItem] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [toast, setToast] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editText, setEditText] = useState('')

  // ── 뱃지: 실제 기록 기반 계산 ──
  const visitCounts = useMemo(() => {
    const counts = {}
    visitRecords.forEach((v) => { counts[v.restaurantId] = (counts[v.restaurantId] || 0) + 1 })
    return counts
  }, [visitRecords])

  const BADGES = useMemo(() => {
    const soloVisits = reviews.filter((r) => r.soloVisit).length
    const cafeVisits = visitRecords.filter((v) => {
      const r = restaurants.find((r) => r.id === v.restaurantId)
      return r?.category?.includes('카페') || r?.category?.includes('브런치') || r?.category?.includes('에스프레소')
    }).length
    const spicyVisits = visitRecords.filter((v) => {
      const r = restaurants.find((r) => r.id === v.restaurantId)
      return r?.category?.includes('마라') || r?.tags?.includes('매운맛') || r?.mood?.includes('얼큰')
    }).length
    const revisitCount = visitRecords.filter((v) => v.revisit).length
    const maxSameVisits = Math.max(0, ...Object.values(visitCounts))
    return [
      { icon: '🍱', label: '혼밥 입문자',    desc: '혼밥 가능 가게 3회 방문',  earned: soloVisits >= 3 },
      { icon: '☕', label: '카페 헌터',      desc: '카페·브런치 3회 방문',      earned: cafeVisits >= 3 },
      { icon: '📝', label: '리뷰 마스터',    desc: '리뷰 3개 작성',             earned: reviews.length >= 3 },
      { icon: '🌶️', label: '매운맛 챌린저', desc: '얼큰한 가게 3회 방문',      earned: spicyVisits >= 3 },
      { icon: '🔄', label: '재방문왕',       desc: '재방문 5회 달성',           earned: revisitCount >= 5 },
      { icon: '💝', label: '단골 마스터',    desc: '같은 가게 3회 방문',        earned: maxSameVisits >= 3 },
    ]
  }, [visitRecords, reviews, visitCounts])

  // ── 취향 분석: 실제 기록 기반 계산 ──
  const TASTE_CATS = useMemo(() => {
    if (visitRecords.length === 0) return []
    const GROUP_COLORS = { '카페·브런치': 'var(--sea)', '아시안·퓨전': 'var(--coral)', '한식': '#5db75d', '양식': '#9b59b6', '기타': 'var(--text-muted)' }
    const catCount = {}
    visitRecords.forEach((v) => {
      const r = restaurants.find((r) => r.id === v.restaurantId)
      if (!r) return
      const cat = r.category || ''
      const group = (cat.includes('카페') || cat.includes('브런치') || cat.includes('에스프레소')) ? '카페·브런치'
        : (cat.includes('아시안') || cat.includes('중식') || cat.includes('마라') || cat.includes('바오')) ? '아시안·퓨전'
        : (cat.includes('한식') || cat.includes('곰탕') || cat.includes('국밥')) ? '한식'
        : (cat.includes('양식') || cat.includes('다이닝') || cat.includes('와인')) ? '양식'
        : '기타'
      catCount[group] = (catCount[group] || 0) + 1
    })
    return Object.entries(catCount)
      .map(([label, count]) => ({ label, pct: Math.round(count / visitRecords.length * 100), color: GROUP_COLORS[label] || 'var(--text-muted)' }))
      .sort((a, b) => b.pct - a.pct)
  }, [visitRecords])

  // ── 취향 분석 칩 ──
  const TASTE_CHIPS = useMemo(() => {
    if (visitRecords.length === 0) return []
    const chips = []
    const soloCount = reviews.filter((r) => r.soloVisit).length
    if (soloCount > 0) chips.push(`🍱 혼밥 인증 ${soloCount}회`)
    const revisitRatio = Math.round(visitRecords.filter((v) => v.revisit).length / visitRecords.length * 100)
    if (revisitRatio > 0) chips.push(`🔄 재방문 비율 ${revisitRatio}%`)
    const locCount = {}
    visitRecords.forEach((v) => { if (v.location) locCount[v.location] = (locCount[v.location] || 0) + 1 })
    const topLoc = Object.entries(locCount).sort((a, b) => b[1] - a[1])[0]
    if (topLoc) chips.push(`📍 단골 지역 ${topLoc[0]}`)
    if (savedIds.length > 0) chips.push(`🔖 저장한 가게 ${savedIds.length}곳`)
    return chips
  }, [visitRecords, savedIds, reviews])

  const FILTER_MAP = {
    '혼밥': ['혼밥가능'],
    '카페': ['카페', '에스프레소바'],
    '야식': ['야식', '저녁추천'],
    '데이트': ['데이트'],
    '재방문': [],
  }
  const FILTER_TAGS = ['전체', '혼밥', '카페', '야식', '데이트', '재방문']

  const savedRestaurants = restaurants.filter((r) => savedIds.includes(r.id))
  const filteredSaved = activeFilter === '전체' || activeFilter === '재방문'
    ? savedRestaurants
    : savedRestaurants.filter((r) => (FILTER_MAP[activeFilter] || []).some((kw) => r.tags?.includes(kw)))

  function showToast(msg) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  function deleteVisit(i) {
    setVisitRecords((prev) => prev.filter((_, idx) => idx !== i))
    showToast('기록을 삭제했어요')
  }

  function deleteReview(i) {
    const r = reviews[i]
    setReviews((prev) => prev.filter((_, idx) => idx !== i))
    deletePublicReview(r.firestoreId)
    showToast('리뷰를 삭제했어요')
  }

  function startEdit(i) {
    setEditingIdx(i)
    setEditText(reviews[i].text)
  }

  function saveEdit(i) {
    setReviews((prev) => prev.map((r, idx) => idx === i ? { ...r, text: editText } : r))
    setEditingIdx(null)
    showToast('리뷰를 수정했어요')
  }

  const SETTINGS = [
    { icon: '🔔', label: '알림 설정',  sub: '새 맛집 알림 켜짐',   action: () => showToast('알림 설정은 준비 중이에요') },
    { icon: '👤', label: '계정 설정',  sub: '닉네임·프로필 수정', action: () => {
      const newName = window.prompt('닉네임을 입력하세요', profile?.name ?? '')
      if (newName && newName.trim()) onEditProfile({ ...profile, name: newName.trim() })
    }},
    { icon: '💬', label: '문의하기',   sub: '의견을 보내주세요',  action: () => showToast('문의: contact@mirihankki.com') },
    { icon: '🚪', label: '로그아웃', sub: '계정에서 로그아웃',
      action: async () => { await signOut(); onLogout() }
    },
  ]

  function spin() {
    if (isSpinning) return
    setIsSpinning(true)
    let count = 0
    const t = window.setInterval(() => {
      setRouletteItem(restaurants[Math.floor(Math.random() * restaurants.length)])
      count++
      if (count >= 20) { window.clearInterval(t); setIsSpinning(false) }
    }, 90)
  }

  if (!firebaseUser) {
    return (
      <div className="my-login-wall">
        <div className="my-login-icon">👤</div>
        <h2 className="my-login-title">로그인이 필요해요</h2>
        <p className="my-login-desc">
          마이 기능을 이용하려면<br />로그인 또는 회원가입이 필요해요
        </p>
        <ul className="my-login-features">
          <li>🍽️ 내 음식 기록 저장</li>
          <li>📊 취향 분석</li>
          <li>🏅 배지 수집</li>
          <li>✏️ 리뷰 &amp; 메모 작성</li>
          <li>🗺️ 내 음식 지도</li>
        </ul>
        <button className="my-login-btn" onClick={onLogin}>로그인 / 회원가입</button>
        <p className="my-login-notice">회원가입은 무료이며 언제든지 탈퇴할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="my-screen">

      {/* 토스트 알림 */}
      {toast && <div className="my-toast">{toast}</div>}

      {/* ── 1. 프로필 헤로 ── */}
      <div className="my-hero">
        <div className="my-hero-content">
          <div className="my-avatar-lg">{profile?.avatar ?? '🌊'}</div>
          <div className="my-hero-info">
            <strong className="my-hero-name">{profile?.name ?? '미식가'}</strong>
            <p className="my-hero-bio">부산의 숨은 맛집을 찾아서 🗺️</p>
          </div>
          <button className="my-edit-profile-btn" onClick={() => {
            const newName = window.prompt('닉네임을 입력하세요', profile?.name ?? '')
            if (newName && newName.trim()) onEditProfile({ ...profile, name: newName.trim() })
          }} aria-label="프로필 수정">✏️</button>
        </div>
        <div className="my-stats-row">
          {[
            { num: visitRecords.length, label: '이번 달 방문' },
            { num: savedIds.length,     label: '저장한 맛집' },
            { num: reviews.length,      label: '작성한 리뷰' },
          ].map((s) => (
            <div key={s.label} className="my-stat-card">
              <span className="my-stat-num">{s.num}</span>
              <span className="my-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 앱 설치 배너 */}
      {!isInstalledApp && (
        <div className="my-install-card">
          <div>
            <strong>앱으로 설치하면 더 편해요</strong>
            <p>홈 화면에서 바로 실행할 수 있어요</p>
          </div>
          <button className="install-btn" onClick={onInstall}>설치</button>
        </div>
      )}
      {showInstallGuide && !isInstalledApp && (
        <div className="install-guide-box">
          <button className="close-x" onClick={() => setShowInstallGuide(false)}>✕</button>
          <p>📱 iPhone: 공유 버튼 → 홈 화면에 추가</p>
          <p>🤖 Android: 메뉴 → 앱 설치</p>
        </div>
      )}

      {/* ── 2. 내 음식 기록 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">🍽️ 내 음식 기록</span>
          <span className="my-section-count">{visitRecords.length}건</span>
        </div>
        {visitRecords.length === 0 ? (
          <div className="my-saved-empty"><span>🍽️</span><p>방문 기록이 없어요</p></div>
        ) : (
          <div className="my-visits">
            {visitRecords.map((v, i) => (
              <div key={i} className="my-visit-card" onClick={() => onSelect(v.restaurantId)} style={{ cursor: 'pointer' }}>
                <div className="my-visit-thumb">
                  {v.photo
                    ? <img src={asset(v.photo)} alt={v.dish} />
                    : <span>{v.icon}</span>
                  }
                </div>
                <div className="my-visit-info">
                  <div className="my-visit-top">
                    <strong>{v.name}</strong>
                    <span className="my-visit-date">{v.date}</span>
                  </div>
                  <p className="my-visit-dish">{v.dish}</p>
                  <div className="my-visit-tags">
                    <span className="my-tag my-tag-loc">📍 {v.location}</span>
                    <span className={`my-tag ${v.revisit ? 'my-tag-yes' : 'my-tag-no'}`}>
                      {v.revisit ? '✅ 재방문 예정' : '❌ 비추'}
                    </span>
                  </div>
                </div>
                <button
                  className="my-visit-del"
                  onClick={(e) => { e.stopPropagation(); deleteVisit(i) }}
                  aria-label="기록 삭제"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. 저장한 맛집 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">🔖 저장한 맛집</span>
          <span className="my-section-count">{savedIds.length}곳</span>
        </div>
        <div className="my-filter-chips">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              className={`my-chip ${activeFilter === tag ? 'active' : ''}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {filteredSaved.length > 0 ? (
          <div className="my-saved-list">
            {filteredSaved.map((r) => (
              <div key={r.id} className="my-saved-card" onClick={() => onSelect(r.id)}>
                <div className="my-saved-thumb-wrap">
                  <PhotoThumb item={r} className="my-saved-thumb" />
                </div>
                <div className="my-saved-info">
                  <strong>{r.name}</strong>
                  <p className="my-saved-loc">📍 {r.location}</p>
                  <p className="my-saved-price">{r.price}</p>
                </div>
                <button
                  className="my-saved-heart"
                  onClick={(e) => { e.stopPropagation(); onToggleSave(r.id); showToast('저장을 해제했어요') }}
                  aria-label="저장 해제"
                >❤️</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="my-saved-empty">
            <span>🔖</span>
            <p>{activeFilter === '전체' ? '저장한 맛집이 없어요' : `'${activeFilter}' 맛집이 없어요`}</p>
          </div>
        )}
      </section>

      {/* ── 4. 취향 분석 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">📊 내 취향 분석</span>
        </div>
        {TASTE_CATS.length === 0 ? (
          <div className="my-saved-empty"><span>📊</span><p>방문 기록이 쌓이면 취향을 분석해드려요</p></div>
        ) : (
          <>
            <div className="my-taste-bars">
              {TASTE_CATS.map((c) => (
                <div key={c.label} className="my-taste-row">
                  <span className="my-taste-label">{c.label}</span>
                  <div className="my-taste-bar">
                    <div className="my-taste-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                  </div>
                  <span className="my-taste-pct">{c.pct}%</span>
                </div>
              ))}
            </div>
            {TASTE_CHIPS.length > 0 && (
              <div className="my-taste-chips">
                {TASTE_CHIPS.map((c) => (
                  <span key={c} className="my-taste-chip">{c}</span>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── 5. 배지 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">🏅 내 배지</span>
          <span className="my-section-count">{BADGES.filter((b) => b.earned).length}/{BADGES.length} 획득</span>
        </div>
        <div className="my-badges-grid">
          {BADGES.map((b, i) => (
            <div
              key={i}
              className={`my-badge ${b.earned ? 'earned' : 'locked'}`}
              onClick={() => showToast(b.earned ? `🏅 "${b.label}" 배지 획득!` : `🔒 ${b.desc} 달성하면 열려요`)}
            >
              <span className="my-badge-icon">{b.icon}</span>
              <span className="my-badge-label">{b.label}</span>
              <span className="my-badge-desc">{b.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 룰렛 ── */}
      <div className="my-roulette-card">
        <p className="my-section-label">오늘 뭐 먹지?</p>
        <div className={`roulette-display ${isSpinning ? 'spinning' : ''}`}>
          {rouletteItem ? (
            <>
              <span className="roulette-icon">{rouletteItem.icon}</span>
              <strong>{rouletteItem.name}</strong>
            </>
          ) : (
            <span className="roulette-icon">🎰</span>
          )}
        </div>
        <button className={`roulette-btn ${isSpinning ? 'spinning' : ''}`} onClick={spin} disabled={isSpinning}>
          {isSpinning ? '고르는 중...' : '🎲 룰렛 돌리기'}
        </button>
        {rouletteItem && !isSpinning && (
          <button
            className="my-more-btn"
            style={{ marginTop: 10, display: 'block', textAlign: 'center', width: '100%' }}
            onClick={() => onSelect(rouletteItem.id)}
          >
            {rouletteItem.name} 상세보기 →
          </button>
        )}
      </div>

      {/* ── 6. 내 음식 지도 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">🗺️ 내 음식 지도</span>
          {visitRecords.length > 0 && <span className="my-section-count">{[...new Set(visitRecords.map((v) => v.restaurantId))].length}곳</span>}
        </div>
        <MyFoodMap visitRecords={visitRecords} onSelect={onSelect} />
      </section>

      {/* ── 7. 저장된 코스 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">🗓️ 저장된 코스</span>
          <span className="my-section-count">{savedCourses.length}개</span>
        </div>
        {savedCourses.length === 0 ? (
          <div className="my-saved-empty"><span>🗓️</span><p>저장된 코스가 없어요</p></div>
        ) : (
          <div className="my-courses">
            {savedCourses.map((c) => (
              <div key={c.id} className="my-course-item">
                <div className="my-course-hd">
                  <span className="my-course-date">{c.date}</span>
                  <button className="my-review-del" onClick={() => onDeleteCourse(c.id)}>삭제</button>
                </div>
                <div className="my-course-steps">
                  {c.steps.map((step, i) => (
                    <div key={i} className="my-course-step">
                      <span className="my-course-slot">{step.slot}</span>
                      <span className="my-course-time">{step.time}</span>
                      <strong className="my-course-name" onClick={() => onSelect(step.restaurantId)}>{step.restaurantName}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 8. 리뷰 & 메모 ── */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">✏️ 내 리뷰 &amp; 메모</span>
          <span className="my-section-count">{reviews.length}건</span>
        </div>
        {reviews.length === 0 ? (
          <div className="my-saved-empty"><span>✏️</span><p>작성한 리뷰가 없어요</p></div>
        ) : (
          <div className="my-reviews">
            {reviews.map((rev, i) => (
              <div key={i} className="my-review-item">
                <div className="my-review-top">
                  <strong>{rev.name}</strong>
                  <div className="my-review-actions">
                    <span className="my-review-date">{rev.date}</span>
                    <button className="my-review-edit" onClick={() => startEdit(i)}>수정</button>
                    <button className="my-review-del" onClick={() => deleteReview(i)}>삭제</button>
                  </div>
                </div>
                <StarDisplay rating={rev.rating} className="my-review-stars" />
                {editingIdx === i ? (
                  <div className="my-review-edit-area">
                    <textarea
                      className="my-review-textarea"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div className="my-review-edit-btns">
                      <button className="my-review-save-btn" onClick={() => saveEdit(i)}>저장</button>
                      <button className="my-review-cancel-btn" onClick={() => setEditingIdx(null)}>취소</button>
                    </div>
                  </div>
                ) : (
                  <p className="my-review-text">{rev.text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 8. 설정 ── */}
      <section className="my-section my-settings-section">
        <div className="my-section-hd">
          <span className="my-section-title">⚙️ 설정</span>
        </div>
        <div className="my-settings-list">
          {SETTINGS.map((item, i) => (
            <div key={i} className="my-settings-item" onClick={item.action}>
              <span className="my-settings-icon">{item.icon}</span>
              <div className="my-settings-texts">
                <strong>{item.label}</strong>
                {item.sub && <p>{item.sub}</p>}
              </div>
              <span className="my-chevron">›</span>
            </div>
          ))}
        </div>
      </section>

      <div className="my-app-info">
        <p>부산 미리한끼 v1.0</p>
        <p>광안리 · 남구 맛집 큐레이션</p>
      </div>
    </div>
  )
}

/* ─── 상세 모달 ─────────────────────────────────────────── */
function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave, visitRecords, setVisitRecords, reviews, setReviews, profile, firebaseUser }) {
  const userLoc = useContext(UserLocCtx)
  const scrollRef = useRef(null)
  const [tip, setTip]       = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

  // 방문 기록 추가
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitDish, setVisitDish]         = useState('')
  const [visitRevisit, setVisitRevisit]   = useState(true)

  // 리뷰 작성
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating]     = useState(5)
  const [reviewText, setReviewText]         = useState('')
  const [soloVisit, setSoloVisit]           = useState(false)

  // 이 가게에 해당하는 내 기록
  const myVisits  = (visitRecords || []).filter((v) => v.restaurantId === item.id)
  const myReviews = (reviews || []).filter((r) => r.restaurantId === item.id)

  // 혼밥 인증
  const soloVerified = myReviews.some((r) => r.soloVisit)

  // 공개 리뷰 (다른 사람들)
  const [publicReviews, setPublicReviews] = useState([])
  const [publicLoading, setPublicLoading] = useState(false)

  useEffect(() => {
    setPublicLoading(true)
    getPublicReviews(item.id).then((data) => {
      setPublicReviews(data)
      setPublicLoading(false)
    })
  }, [item.id])

  const avgRating = publicReviews.length > 0
    ? (publicReviews.reduce((s, r) => s + r.rating, 0) / publicReviews.length).toFixed(1)
    : null

  function handleAddVisit() {
    if (!visitDish.trim()) return
    setVisitRecords((prev) => [{
      restaurantId: item.id,
      name: item.name,
      icon: item.icon,
      dish: visitDish.trim(),
      date: formatDate(true),
      revisit: visitRevisit,
      photo: item.banner ?? item.photos?.[0]?.src ?? null,
      location: item.location,
    }, ...prev])
    setVisitDish('')
    setShowVisitForm(false)
  }

  async function handleAddReview() {
    if (!reviewText.trim()) return
    setReviewText('')
    setSoloVisit(false)
    setShowReviewForm(false)
    const firestoreId = await savePublicReview({
      restaurantId: item.id,
      rating: reviewRating,
      text: reviewText.trim(),
      soloVisit,
      nickname: profile?.name || '익명',
      uid: firebaseUser?.uid || null,
    })
    const review = {
      restaurantId: item.id,
      name: item.name,
      rating: reviewRating,
      text: reviewText.trim(),
      date: formatDate(),
      soloVisit,
      firestoreId: firestoreId ?? null,
    }
    setReviews((prev) => [review, ...prev])
    getPublicReviews(item.id).then(setPublicReviews)
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    setTip('')
    setPhotoIdx(0)
  }, [item.id])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const hours   = operatingHours[item.id] || '정보 없음'
  const parking = parkingAvail[item.id] ? '주차 가능' : '주차 불가'
  const menus   = menuData[item.id] || []

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="detail-panel" ref={scrollRef}>

        <div className="detail-photo-wrap">
          {(item.banner || item.photos?.length > 0) ? (
            <img
              src={asset(item.banner ?? (item.photos[photoIdx]?.src ?? item.photos[0].src))}
              alt={item.name}
              className="detail-photo-img"
            />
          ) : (
            <div className={`detail-photo-placeholder ${accentClassNames[item.accent]}`}>
              <span>{item.icon}</span>
            </div>
          )}
          <div className="detail-photo-overlay">
            <button className="detail-back-btn" onClick={onClose} aria-label="닫기">←</button>
            <button className="detail-share-btn" onClick={() => onShare(item)} aria-label="공유">↗</button>
          </div>
        </div>

        <div className="detail-body">

          {/* ── 가게명 + 저장 ── */}
          <div className="detail-title-row">
            <div>
              <h2 className="detail-name">{item.name}</h2>
              <div className="detail-title-sub">
                <span>{item.location}</span>
                <span className="detail-sep">·</span>
                <span>{getCuisineCategory(item)}</span>
                {getEta(item, userLoc) && <><span className="detail-sep">·</span><span>📍 {getEta(item, userLoc)}</span></>}
              </div>
            </div>
            <button
              className={`detail-heart ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(item.id)}
            >{saved ? '❤️' : '🤍'}</button>
          </div>

          <p className="detail-hero-text">{item.hero}</p>

          {/* ── 방문 전 체크 ── */}
          <h3 className="detail-section-title">방문 전 체크</h3>
          <div className="detail-precheck">
            <div className="precheck-item">
              <span className="precheck-icon">⏳</span>
              <div><strong>웨이팅</strong><p>{item.experience?.waitTime || '정보 없음'}</p></div>
            </div>
            <div className="precheck-item">
              <span className="precheck-icon">📋</span>
              <div><strong>예약</strong><p>{item.links?.reservation ? '예약 가능' : '예약 불가'}</p></div>
            </div>
            <div className="precheck-item">
              <span className="precheck-icon">🕐</span>
              <div><strong>영업시간</strong><p>{hours}</p></div>
            </div>
            <div className="precheck-item">
              <span className="precheck-icon">🅿️</span>
              <div><strong>주차</strong><p>{parking}</p></div>
            </div>
          </div>

          {/* ── 분위기 & 좌석 ── */}
          {item.experience && (
            <>
              <h3 className="detail-section-title">분위기 & 좌석</h3>
              {soloVerified && (
                <div className="solo-verified-badge">
                  🍱 혼밥 인증 <span>내가 직접 혼밥으로 방문했어요</span>
                </div>
              )}
              <div className="detail-exp-grid">
                {[
                  { label: '소음', val: item.experience.noise === '낮음' ? '조용함' : item.experience.noise === '높음' ? '시끄러움' : '보통', good: item.experience.noise === '낮음' },
                  { label: '분위기', val: item.experience.vibe, good: true },
                  { label: '음식 양', val: item.experience.portion, good: item.experience.portion === '많음' },
                  { label: '혼밥', val: item.experience.soloOk ? '가능' : '불가', good: item.experience.soloOk },
                ].map(({ label, val, good }) => (
                  <div key={label} className={`exp-badge ${good ? 'good' : ''}`}>
                    <small>{label}</small>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
              <dl className="detail-exp-list">
                <div><dt>좌석</dt><dd>{item.experience.seating}</dd></div>
              </dl>
            </>
          )}

          {/* ── 저장 + 길찾기 ── */}
          <div className="detail-action-row">
            <button className={`detail-save-btn ${saved ? 'saved' : ''}`} onClick={() => onToggleSave(item.id)}>
              {saved ? '💖 저장됨' : '🤍 저장하기'}
            </button>
            <button className="detail-dir-btn" onClick={() => openMapLink(item.links.naver)}>🗺️ 길찾기</button>
          </div>
          <div className="detail-divider" />

          {/* ── 가게 내부 ── */}
          {item.media?.interior?.src && (
            <div className="detail-section">
              <h3>가게 내부</h3>
              <div className="interior-viewer-card">
                {item.media.interior.type === 'html360' ? (
                  <iframe title={`${item.name} 가게 내부`} src={asset(item.media.interior.src)} loading="lazy" allow="autoplay" />
                ) : item.media.interior.type === 'image' ? (
                  <img src={asset(item.media.interior.src)} alt={`${item.name} 가게 내부`} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                ) : (
                  <video controls playsInline poster={item.media.interior.poster ? asset(item.media.interior.poster) : undefined} src={asset(item.media.interior.src)} />
                )}
              </div>
            </div>
          )}

          {/* ── 음식 사진 ── */}
          {item.photos?.length > 0 && (
            <div className="detail-section">
              <h3>음식 사진</h3>
              <div className="detail-photo-grid">
                {item.photos.map((p, i) => (
                  <figure key={p.src} className="detail-photo-fig" onClick={() => setPhotoIdx(i)}>
                    <img src={asset(p.src)} alt={p.alt} loading="lazy" />
                    <figcaption>{p.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* ── 추천 메뉴 TOP 3 ── */}
          {menus.length > 0 && (
            <div className="detail-section">
              <h3>처음이라면 이걸 드세요</h3>
              {menus.map((m, i) => (
                <div key={m.name} className="detail-top-menu">
                  <span className="top-menu-rank">{i + 1}</span>
                  <span className="top-menu-name">{m.name}</span>
                  {m.price && <span className="top-menu-price">{m.price}</span>}
                </div>
              ))}
            </div>
          )}

          {/* ── 전체 메뉴 ── */}
          {item.menu?.length > 0 && (
            <div className="detail-menu-section">
              <h3>전체 메뉴</h3>
              {item.menu.map((cat) => (
                <div key={cat.category} className="menu-category">
                  <div className="menu-category-label">{cat.category}</div>
                  {cat.items.map((m) => (
                    <div key={m.name} className="detail-menu-item">
                      <div className="menu-icon-name">
                        <div className="menu-dot" />
                        <div className="menu-name-wrap">
                          <span>{m.name}{m.spicy ? ' 🌶️'.repeat(m.spicy) : ''}</span>
                          {m.desc && <span className="menu-desc">{m.desc}</span>}
                        </div>
                      </div>
                      <span className="menu-price-tag">{m.price}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── 추천 상황 ── */}
          {item.mood?.length > 0 && (
            <div className="detail-section">
              <h3>이런 분들께 추천</h3>
              <div className="detail-mood-tags">
                {item.mood.map((m) => <span key={m} className="detail-mood-tag">{m}</span>)}
              </div>
            </div>
          )}

          {/* ── 에디터 포인트 ── */}
          <div className="detail-section">
            <h3>에디터 포인트</h3>
            <ul className="detail-points">
              {item.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>

          <div className="detail-section">
            <h3>지도 연결</h3>
            <div className="detail-map-links">
              <button className="map-link naver" onClick={() => openMapLink(item.links.naver)}>네이버 지도</button>
              <button className="map-link kakao" onClick={() => openMapLink(item.links.kakao)}>카카오맵</button>
              <button className="map-link google" onClick={() => openMapLink(item.links.google)}>구글맵</button>
              {item.links.reservation
                ? <button className="map-link reservation" onClick={() => openMapLink(item.links.reservation)}>예약</button>
                : <a className="map-link phone" href={`tel:${item.phone}`}>전화</a>
              }
            </div>
          </div>

          <div className="detail-section tip-box">
            <div className="tip-head">
              <h3>방문 팁</h3>
              <button className="tip-reveal-btn" onClick={() => setTip(getTip(item))}>팁 보기</button>
            </div>
            <p className="tip-text">{tip || '버튼을 누르면 이 장소를 더 잘 즐기는 방법을 알려드려요.'}</p>
          </div>

          {(() => {
            const nearby = restaurants
              .filter((r) => r.id !== item.id && haversine(item.lat, item.lng, r.lat, r.lng) <= 1)
              .sort((a, b) => haversine(item.lat, item.lng, a.lat, a.lng) - haversine(item.lat, item.lng, b.lat, b.lng))
            if (nearby.length === 0) return null
            return (
              <div className="detail-section">
                <h3>근처 1km 이내 맛집</h3>
                <div className="detail-nearby-list">
                  {nearby.map((r) => (
                    <button key={r.id} className="nearby-rest-card" onClick={() => { onClose(); setTimeout(() => onOpenMap(r.id), 50) }}>
                      <div className="nearby-rest-thumb"><PhotoThumb item={r} /></div>
                      <div className="nearby-rest-info">
                        <strong>{r.name}</strong>
                        <small>{r.location} · {Math.round(haversine(item.lat, item.lng, r.lat, r.lng) * 1000)}m</small>
                      </div>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ── 다른 사람들의 리뷰 ── */}
          <div className="detail-section">
            <div className="public-review-hd">
              <h3>후기</h3>
              {avgRating && (
                <div className="public-avg">
                  <StarDisplay rating={Number(avgRating)} className="public-avg-star" />
                  <strong>{avgRating}</strong>
                  <small>({publicReviews.length}명)</small>
                </div>
              )}
            </div>
            {publicLoading ? (
              <p className="detail-my-empty">불러오는 중...</p>
            ) : publicReviews.length === 0 ? (
              <p className="detail-my-empty">아직 후기가 없어요. 첫 번째 후기를 남겨보세요!</p>
            ) : (
              <div className="public-reviews">
                {publicReviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="public-review-item">
                    <div className="public-review-top">
                      <span className="public-review-nick">{r.nickname}</span>
                      <StarDisplay rating={r.rating} className="public-review-stars" />
                    </div>
                    {r.soloVisit && <span className="public-solo-badge">🍱 혼밥</span>}
                    <p className="public-review-text">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 내 방문 기록 ── */}
          <div className="detail-section detail-my-block">
            <div className="detail-my-hd">
              <h3>📍 내 방문 기록</h3>
              {!showVisitForm && (
                <button className="detail-my-add-btn" onClick={() => setShowVisitForm(true)}>+ 추가</button>
              )}
            </div>

            {myVisits.length > 0 && (
              <div className="detail-my-visits">
                {myVisits.map((v, i) => (
                  <div key={i} className="detail-my-visit-row">
                    <span className="detail-my-visit-date">{v.date}</span>
                    <span className="detail-my-visit-dish">{v.dish}</span>
                    <span className={`detail-my-visit-tag ${v.revisit ? 'yes' : 'no'}`}>
                      {v.revisit ? '✅ 재방문' : '❌ 비추'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showVisitForm && (
              <div className="detail-my-form">
                <input
                  className="detail-my-input"
                  placeholder="먹은 메뉴를 입력하세요"
                  value={visitDish}
                  onChange={(e) => setVisitDish(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVisit()}
                />
                <div className="detail-my-toggle-row">
                  <button
                    className={`detail-my-toggle ${visitRevisit ? 'active' : ''}`}
                    onClick={() => setVisitRevisit(true)}
                  >✅ 재방문 예정</button>
                  <button
                    className={`detail-my-toggle ${!visitRevisit ? 'active-no' : ''}`}
                    onClick={() => setVisitRevisit(false)}
                  >❌ 비추</button>
                </div>
                <div className="detail-my-form-btns">
                  <button className="detail-my-save" onClick={handleAddVisit}>저장</button>
                  <button className="detail-my-cancel" onClick={() => { setShowVisitForm(false); setVisitDish('') }}>취소</button>
                </div>
              </div>
            )}

            {myVisits.length === 0 && !showVisitForm && (
              <p className="detail-my-empty">아직 방문 기록이 없어요</p>
            )}
          </div>

          {/* ── 내 리뷰 & 메모 ── */}
          <div className="detail-section detail-my-block">
            <div className="detail-my-hd">
              <h3>✏️ 내 리뷰 &amp; 메모</h3>
              {!showReviewForm && (
                <button className="detail-my-add-btn" onClick={() => setShowReviewForm(true)}>+ 작성</button>
              )}
            </div>

            {myReviews.length > 0 && (
              <div className="detail-my-reviews">
                {myReviews.map((r, i) => (
                  <div key={i} className="detail-my-review-row">
                    <div className="detail-my-review-top">
                      <StarDisplay rating={r.rating} className="detail-my-stars" />
                      <span className="detail-my-review-date">{r.date}</span>
                    </div>
                    <p className="detail-my-review-text">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {showReviewForm && (
              <div className="detail-my-form">
                <div className="detail-star-row">
                  <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                </div>
                <button
                  className={`solo-toggle-btn${soloVisit ? ' active' : ''}`}
                  onClick={() => setSoloVisit((v) => !v)}
                  type="button"
                >
                  {soloVisit ? '🍱 혼밥으로 방문했어요 ✓' : '🍱 혼밥으로 방문했어요'}
                </button>
                <textarea
                  className="detail-my-textarea"
                  placeholder="한 줄 메모를 남겨보세요 (최대 500자)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <div className="detail-my-form-btns">
                  <button className="detail-my-save" onClick={handleAddReview}>저장</button>
                  <button className="detail-my-cancel" onClick={() => { setShowReviewForm(false); setReviewText(''); setSoloVisit(false) }}>취소</button>
                </div>
              </div>
            )}

            {myReviews.length === 0 && !showReviewForm && (
              <p className="detail-my-empty">아직 작성한 리뷰가 없어요</p>
            )}
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  )
}

/* ─── 메인 앱 ────────────────────────────────────────────── */
export default function App() {
  const bp      = useBreakpoint()
  const isWeb   = bp !== 'mobile'
  const userLoc = useUserLocation()

  const [firebaseUser, setFirebaseUser]   = useState(() => {
    // 초기값: localStorage 세션 확인 (Firebase가 로드되기 전 깜빡임 방지)
    try { const s = localStorage.getItem('miri-hankki-session'); return s ? JSON.parse(s) : null }
    catch { return null }
  })
  const [profile, setProfile] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-profile'); return s ? JSON.parse(s) : null }
    catch { return null }
  })
  const [showSplash, setShowSplash]       = useState(() => !isWeb)
  const [showProfileSetup, setShowProfileSetup] = useState(() => {
    try {
      const s = localStorage.getItem('miri-hankki-session')
      const p = localStorage.getItem('miri-hankki-profile')
      return !!(s && !p)
    } catch { return false }
  })
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  // Firestore 로드 완료 여부 (로드 전엔 자동 저장 막기)
  const [dataLoaded, setDataLoaded] = useState(() => !(() => {
    try { return !!localStorage.getItem('miri-hankki-session') } catch { return false }
  })())
  const [activeTab, setActiveTab]         = useState('home')
  const [selectedId, setSelectedId]       = useState(null)
  const [mapSelectedId, setMapSelectedId] = useState(restaurants[0].id)
  const [installPrompt, setInstallPrompt]     = useState(null)
  const [isInstalledApp, setIsInstalledApp]   = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  )
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const s = window.localStorage.getItem('miri-hankki-saved')
      const p = s ? JSON.parse(s) : []
      return Array.isArray(p) ? p.filter((id) => restaurants.some((r) => r.id === id)) : []
    } catch { return [] }
  })
  const [showCopyMessage, setShowCopyMessage] = useState(false)

  // 방문 기록 (전역 공유)
  const [visitRecords, setVisitRecords] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-visits-v2'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })

  // 리뷰 (전역 공유)
  const [reviews, setReviews] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-reviews-v2'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })

  // 가게별 별점 통계 (Firestore 전체 후기 기준)
  const [reviewStats, setReviewStats] = useState({})
  useEffect(() => {
    getAllPublicReviews(200).then((data) => {
      const acc = {}
      data.forEach((r) => {
        const id = r.restaurantId
        if (!acc[id]) acc[id] = { sum: 0, count: 0 }
        acc[id].sum += r.rating
        acc[id].count += 1
      })
      const stats = {}
      Object.entries(acc).forEach(([id, { sum, count }]) => {
        stats[Number(id)] = { avg: (sum / count).toFixed(1), count }
      })
      setReviewStats(stats)
    })
  }, [])

  // Firebase 인증 상태 실시간 동기화 + Firestore 데이터 로드
  useEffect(() => {
    const unsub = onAuthStateChanged(async (user) => {
      setFirebaseUser(user)
      if (user) {
        localStorage.setItem('miri-hankki-session', JSON.stringify(user))
        // Firestore에서 유저 데이터 로드
        const data = await loadUserData(user.uid)
        if (data) {
          if (Array.isArray(data.savedIds))     setSavedIds(data.savedIds)
          if (Array.isArray(data.visitRecords)) setVisitRecords(data.visitRecords)
          if (Array.isArray(data.reviews))      setReviews(data.reviews)
          if (data.profile) {
            setProfile(data.profile)
            localStorage.setItem('miri-hankki-profile', JSON.stringify(data.profile))
          } else {
            const stored = (() => { try { const s = localStorage.getItem('miri-hankki-profile'); return s ? JSON.parse(s) : null } catch { return null } })()
            if (stored) { setProfile(stored) } else { setShowProfileSetup(true) }
          }
        } else {
          // 신규 유저 또는 Firestore 데이터 없음
          const stored = (() => { try { const s = localStorage.getItem('miri-hankki-profile'); return s ? JSON.parse(s) : null } catch { return null } })()
          if (stored) { setProfile(stored) } else { setShowProfileSetup(true) }
        }
        setDataLoaded(true)
      } else {
        localStorage.removeItem('miri-hankki-session')
        setDataLoaded(true)
      }
    })
    return unsub
  }, [])

  // 웹 환경에서는 스플래시 자동 스킵
  useEffect(() => {
    if (isWeb && showSplash) setShowSplash(false)
  }, [isWeb])

  useEffect(() => {
    document.body.style.setProperty('--app-bg-mobile', `url("${asset('/busan-bg.png')}")`)
    document.body.style.setProperty('--app-bg-wide',   `url("${asset('/busan-bg-wide.png')}")`)
    return () => {
      document.body.style.removeProperty('--app-bg-mobile')
      document.body.style.removeProperty('--app-bg-wide')
    }
  }, [])

  useEffect(() => {
    function onBefore(e) { e.preventDefault(); setInstallPrompt(e) }
    function onInstalled() { setInstallPrompt(null); setIsInstalledApp(true); setShowInstallGuide(false) }
    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = (selectedId || activeTab === 'map') ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId, activeTab])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-saved', JSON.stringify(savedIds))
  }, [savedIds])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-visits-v2', JSON.stringify(visitRecords))
  }, [visitRecords])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-reviews-v2', JSON.stringify(reviews))
  }, [reviews])

  // 저장된 코스
  const [savedCourses, setSavedCourses] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-courses'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })
  useEffect(() => {
    window.localStorage.setItem('miri-hankki-courses', JSON.stringify(savedCourses))
  }, [savedCourses])

  // Firestore 자동 저장 (로그인 상태 + 로드 완료 후)
  useEffect(() => {
    if (!firebaseUser || !dataLoaded) return
    const t = setTimeout(() => {
      saveUserData(firebaseUser.uid, { savedIds, visitRecords, reviews, profile })
    }, 1500) // 1.5초 debounce
    return () => clearTimeout(t)
  }, [savedIds, visitRecords, reviews, profile, firebaseUser, dataLoaded])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab])

  function toggleSave(id) {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleShare(item) {
    try {
      await copyToClipboard(item.links.naver)
      setShowCopyMessage(true)
      window.setTimeout(() => setShowCopyMessage(false), 1800)
    } catch { /* ignore */ }
  }

  function openMap(id) {
    setMapSelectedId(id)
    setSelectedId(null)
    setActiveTab('map')
  }

  async function handleInstallApp() {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
      return
    }
    setShowInstallGuide(true)
  }

  const selectedItem = restaurants.find((r) => r.id === selectedId) ?? null

  return (
    <UserLocCtx.Provider value={userLoc}>
    <ReviewStatsCtx.Provider value={reviewStats}>
    <div className="app-wrapper">
      <div className="app-frame">
        {showSplash && !isWeb ? (
          <Splash onDone={() => setShowSplash(false)} />
        ) : (
          <div className={`app-layout${isWeb ? ' app-layout-web' : ''}`}>
            {isWeb && (
              <SideNav
                bp={bp}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                savedCount={savedIds.length}
              />
            )}

            <main className="main-content">
              {activeTab === 'home' && (
                <HomeScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                  onGoSearch={() => setActiveTab('search')}
                  onGoMap={() => setActiveTab('map')}
                  onOpenMapItem={(id) => { setMapSelectedId(id); setActiveTab('map') }}
                  onSaveCourse={(c) => setSavedCourses((prev) => [c, ...prev])}
                />
              )}
              <div style={{ display: activeTab === 'search' ? 'block' : 'none' }}>
                <SearchScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                />
              </div>
              {activeTab === 'map' && (
                <MapScreen
                  mapSelectedId={mapSelectedId}
                  setMapSelectedId={setMapSelectedId}
                  onSelect={setSelectedId}
                  bp={bp}
                />
              )}
              {activeTab === 'my' && (
                <MyScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                  onGoMap={() => setActiveTab('map')}
                  visitRecords={visitRecords}
                  setVisitRecords={setVisitRecords}
                  reviews={reviews}
                  setReviews={setReviews}
                  savedCourses={savedCourses}
                  onDeleteCourse={(id) => setSavedCourses((prev) => prev.filter((c) => c.id !== id))}
                  isInstalledApp={isInstalledApp}
                  installPrompt={installPrompt}
                  onInstall={handleInstallApp}
                  showInstallGuide={showInstallGuide}
                  setShowInstallGuide={setShowInstallGuide}
                  profile={profile}
                  onEditProfile={(p) => { setProfile(p); window.localStorage.setItem('miri-hankki-profile', JSON.stringify(p)) }}
                  onLogout={() => {
                    setFirebaseUser(null); setProfile(null)
                    setSavedIds([]); setVisitRecords([]); setReviews([])
                    setDataLoaded(true)
                    localStorage.removeItem('miri-hankki-session')
                    localStorage.removeItem('miri-hankki-profile')
                  }}
                  firebaseUser={firebaseUser}
                  onLogin={() => setShowAuthOverlay(true)}
                />
              )}
            </main>

            {!isWeb && (
              <nav className="bottom-nav">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className={activeTab === item.id ? 'active' : ''}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <small>{item.label}</small>
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}

        {/* 로그인 / 프로필 오버레이 */}
        {showAuthOverlay && (
          <AuthScreen
            onDone={(user, profileData) => {
              setFirebaseUser(user)
              setShowAuthOverlay(false)
              if (profileData) {
                setProfile(profileData)
                window.localStorage.setItem('miri-hankki-profile', JSON.stringify(profileData))
                saveUserData(user.uid, { savedIds, visitRecords, reviews, profile: profileData })
              }
            }}
            onSkip={() => setShowAuthOverlay(false)}
          />
        )}
        {showProfileSetup && firebaseUser && !profile && (
          <ProfileSetup onDone={(p) => {
            setProfile(p)
            setShowProfileSetup(false)
            saveUserData(firebaseUser.uid, { savedIds, visitRecords, reviews, profile: p })
          }} />
        )}

        {showCopyMessage && <div className="toast">📋 링크를 복사했어요.</div>}

        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onShare={handleShare}
            onOpenMap={openMap}
            saved={savedIds.includes(selectedItem.id)}
            onToggleSave={toggleSave}
            visitRecords={visitRecords}
            setVisitRecords={setVisitRecords}
            reviews={reviews}
            setReviews={setReviews}
            profile={profile}
            firebaseUser={firebaseUser}
          />
        )}
      </div>
    </div>
    </ReviewStatsCtx.Provider>
    </UserLocCtx.Provider>
  )
}
