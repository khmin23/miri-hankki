import React, { useEffect, useMemo, useRef, useState } from 'react'
import { restaurants } from './data/restaurants'

const BASE = import.meta.env.BASE_URL

function asset(path) {
  return `${BASE}${path.replace(/^\//, '')}`
}

/* ─── 부가 데이터 ──────────────────────────────────────── */
const operatingHours = {
  1: '17:00 - 01:00', 2: '18:00 - 24:00', 3: '10:00 - 21:00',
  4: '09:00 - 21:00', 5: '10:00 - 15:00', 6: '11:30 - 21:00',
}
const parkingAvail = { 1: false, 2: false, 3: false, 4: false, 5: true, 6: false }
const menuData = {
  1: [{ name: '마라전골', price: '18,000원' }, { name: '가지튀김', price: '7,000원' }, { name: '계란볶음밥', price: '5,000원' }],
  2: [{ name: '한우웰링턴 코스', price: '65,000원' }, { name: '파리지엔 뇨끼', price: '24,000원' }, { name: '치즈 플레이트', price: '18,000원' }],
  3: [{ name: '에스프레소', price: '4,500원' }, { name: '샤케라또', price: '7,500원' }, { name: '카푸치노', price: '5,500원' }],
  4: [{ name: '에그베네딕트', price: '18,000원' }, { name: '팬케이크', price: '15,000원' }, { name: '파스타', price: '16,000원' }],
  5: [{ name: '돼지곰탕', price: '9,000원' }, { name: '고기 칼국수', price: '11,000원' }, { name: '삼겹구이', price: '13,000원' }],
  6: [{ name: '마파두부', price: '11,000원' }, { name: '볶음밥', price: '9,000원' }, { name: '우육면', price: '12,000원' }],
}

/* ─── 네비게이션 ────────────────────────────────────────── */
const navItems = [
  { id: 'home',   label: '홈',   icon: '🏠' },
  { id: 'search', label: '검색', icon: '🔍' },
  { id: 'map',    label: '지도', icon: '🗺️' },
  { id: 'saved',  label: '저장', icon: '🔖' },
  { id: 'my',     label: '마이', icon: '👤' },
]

const homeMoodCategories = [
  { id: '전체',   label: '전체',   icon: '🍽️' },
  { id: '한식',   label: '한식',   icon: '🍚' },
  { id: '중식',   label: '중식',   icon: '🥢' },
  { id: '카페',   label: '카페',   icon: '☕' },
  { id: '브런치', label: '브런치', icon: '🥐' },
  { id: '아시안', label: '아시안', icon: '🍜' },
]

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
    { id: 5, reason: '혼자 앉기 편하고 맑은 국물로 부담 없는 한 끼' },
    { id: 3, reason: '해변 산책 전후 가볍게 머물기 좋은 커피 코스' },
    { id: 1, reason: '1인 주문이 가능하고 얼큰하게 먹기 좋은 중식' },
  ],
  데이트: [
    { id: 2, reason: '조용한 분위기와 와인 구성이 잘 맞는 저녁 코스' },
    { id: 4, reason: '오션뷰와 브런치 메뉴가 함께 잡히는 낮 데이트' },
    { id: 3, reason: '바다 앞에서 짧게 들르기 좋은 감성 카페' },
  ],
  해장: [
    { id: 5, reason: '맑고 담백한 돼지곰탕으로 속을 편하게 채우기 좋음' },
    { id: 1, reason: '얼큰한 마라전골로 강한 국물 맛을 원할 때' },
    { id: 6, reason: '마파두부와 우육면으로 든든하게 풀기 좋은 선택' },
  ],
  브런치: [
    { id: 4, reason: '브런치 메뉴와 광안대교 뷰를 함께 보기 좋은 곳' },
    { id: 3, reason: '커피와 디저트로 가볍게 이어가기 좋은 코스' },
    { id: 2, reason: '늦은 시간까지 여유롭게 이어지는 다이닝 선택지' },
  ],
  카페: [
    { id: 3, reason: '에스프레소와 시그니처 음료를 중심으로 가볍게 방문' },
    { id: 4, reason: '통창 오션뷰와 라떼를 함께 즐기기 좋은 브런치 카페' },
    { id: 2, reason: '커피 뒤 저녁 다이닝까지 자연스럽게 이어가기 좋음' },
  ],
  얼큰한: [
    { id: 1, reason: '마라전골 중심으로 확실하게 매콤한 저녁' },
    { id: 6, reason: '향신료 있는 마파두부와 우육면이 잘 맞는 곳' },
    { id: 5, reason: '담백한 국물에 고기 칼국수까지 든든하게 가능' },
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

const mapPinPositions = {
  1: { x: 388, y: 136 }, 2: { x: 438, y: 152 }, 3: { x: 304, y: 232 },
  4: { x: 350, y: 184 }, 5: { x: 202, y: 488 }, 6: { x: 272, y: 202 },
}

const cuisineCategories = [
  { id: '전체',   keywords: [] },
  { id: '한식',   keywords: ['한식', '곰탕', '국밥'] },
  { id: '중식',   keywords: ['중식', '마라'] },
  { id: '양식',   keywords: ['양식', '와인바', '다이닝바'] },
  { id: '브런치', keywords: ['브런치'] },
  { id: '카페',   keywords: ['카페', '에스프레소바'] },
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
  if (!normalized) return { score: 0, reason: '질문을 입력하면 취향에 맞춘 추천을 드릴게요.' }
  const keywords = normalized.split(/\s+/).filter(Boolean)
  let score = 0
  keywords.forEach((kw) => {
    if (item.name.toLowerCase().includes(kw))     score += 6
    if (item.category.toLowerCase().includes(kw)) score += 4
    if (item.location.toLowerCase().includes(kw)) score += 3
    if (item.hero.toLowerCase().includes(kw))     score += 3
    if (item.price.toLowerCase().includes(kw))    score += 2
    if (item.tags.some((t) => t.toLowerCase().includes(kw)))  score += 4
    if (item.mood.some((m) => m.toLowerCase().includes(kw)))  score += 4
    if (item.points.some((p) => p.toLowerCase().includes(kw))) score += 2
  })
  if (/데이트|기념일|무드|와인/.test(query)        && item.mood.includes('데이트'))   score += 8
  if (/브런치|오전|오션뷰|바다/.test(query)        && item.mood.includes('오션뷰'))   score += 8
  if (/혼밥|든든|국물|한식/.test(query)           && item.mood.includes('혼밥가능')) score += 8
  if (/커피|카페|디저트|가볍게/.test(query)        && item.category.includes('카페')) score += 8
  if (/바오|마파|우육면|이국적|향신료/.test(query) && item.name === '바오하우스 광안점') score += 8
  if (/마라|얼큰|친구|저녁모임/.test(query)       && item.name === '푸안 광안점')   score += 8
  const reasonParts = [`${item.location}에서 찾기 쉬운 동선`, `${item.category} 중심의 메뉴 구성`, item.recommend]
  return {
    score,
    reason: `${reasonParts[0]}, ${reasonParts[1]}이고 ${reasonParts[2].replace('추천', '잘 맞습니다')}.`,
  }
}

function getTip(item) {
  const tips = {
    1: '마라전골은 처음부터 맵기보다 기본 단계로 시작한 뒤 가지튀김과 볶음밥을 이어서 주문하면 만족도가 높아요.',
    2: '무벳은 해 질 무렵 방문하면 분위기가 가장 살아나고, 와인 한 잔과 치즈 플레이트를 먼저 고르면 코스 선택이 쉬워져요.',
    3: '까사부사노는 에스프레소 한 잔과 샤케라또를 나눠 마셔보면 매력을 비교하기 좋아요.',
    4: '위킹홀리데이는 창가 좌석 선호가 높아서 오픈 시간대 방문이 가장 안정적이에요.',
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
  window.location.href = url
}

/* ─── 서브 컴포넌트 ──────────────────────────────────────── */

function PhotoThumb({ item, className = '' }) {
  if (item.photos?.[0]) {
    return <img src={asset(item.photos[0].src)} alt={item.name} className={className} />
  }
  return (
    <div className={`emoji-thumb ${accentClassNames[item.accent]} ${className}`}>
      <span>{item.icon}</span>
    </div>
  )
}

/** 가로 스크롤 추천 카드 */
function RecommendCard({ item, saved, onToggleSave, onSelect }) {
  return (
    <article className="rec-card" onClick={() => onSelect(item.id)}>
      <div className="rec-card-img">
        <PhotoThumb item={item} />
        <button
          className={`heart-btn ${saved ? 'saved' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(item.id) }}
          aria-label="찜"
        >
          {saved ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="rec-card-body">
        <p className="rec-location">{item.location}</p>
        <strong className="rec-name">{item.name.length > 8 ? item.name.slice(0, 8) + '…' : item.name}</strong>
      </div>
    </article>
  )
}

/** 리스트형 트렌딩 아이템 */
function TrendingItem({ item, saved, onToggleSave, onSelect }) {
  return (
    <article className="trending-item" onClick={() => onSelect(item.id)}>
      <div className="trending-thumb">
        <PhotoThumb item={item} />
      </div>
      <div className="trending-body">
        <strong>{item.name}</strong>
        <p className="trending-sub">{item.category} · {item.location}</p>
        <p className="trending-meta">{item.eta}</p>
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

/** 데스크탑 카드 그리드용 */
function RestaurantCard({ item, saved, onToggleSave, onSelect, isSelected, onHover }) {
  return (
    <article
      className={`rest-card${isSelected ? ' rest-card-selected' : ''}`}
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => onHover?.(item.id)}
    >
      <div className="rest-card-img">
        <PhotoThumb item={item} />
        <button
          className={`heart-btn ${saved ? 'saved' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSave(item.id) }}
          aria-label="찜"
        >
          {saved ? '❤️' : '🤍'}
        </button>
        {item.mood?.includes('데이트') && <span className="rest-card-badge">❤️ 데이트</span>}
      </div>
      <div className="rest-card-body">
        <p className="rest-card-loc">{item.location}</p>
        <strong className="rest-card-name">{item.name}</strong>
        <p className="rest-card-cat">{item.category}</p>
        <div className="rest-card-tags">
          {item.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="rest-tag">#{tag}</span>
          ))}
        </div>
        <div className="rest-card-foot">
          <span className="rest-card-eta">📍 {item.eta}</span>
          <span className="rest-card-price">{item.price}</span>
        </div>
      </div>
    </article>
  )
}

function SituationCard({ item, reason, onSelect, onOpenMap }) {
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
            <span>📍 {item.eta}</span>
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

/** 지도 SVG */
function ApproximateMap({ items, selectedId, onSelect }) {
  return (
    <div className="approx-map">
      <svg viewBox="0 0 800 600" role="img">
        <rect width="800" height="600" fill="#17304f" />
        <path d="M 520 0 L 800 0 L 800 600 L 470 600 C 500 450 500 300 485 170 C 480 100 495 42 520 0 Z" fill="#256d93" />
        <path d="M 0 0 H 520 C 492 70 480 132 486 200 C 496 322 492 450 470 600 H 0 Z" fill="#27384f" />
        <path d="M 506 72 C 560 96 612 96 678 90 C 724 86 764 98 796 122" fill="none" stroke="#d7e7f6" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
        <path d="M 86 0 V 600 M 214 0 V 520 M 346 0 V 488 M 458 0 V 438" stroke="#42546d" strokeWidth="3" />
        <path d="M 0 82 H 520 M 0 160 H 520 M 0 264 H 498 M 0 362 H 486 M 0 452 H 446" stroke="#42546d" strokeWidth="3" />
        <text x="292" y="118" fill="#9db4d1" fontSize="22" fontWeight="800" textAnchor="middle">광안리</text>
        <text x="178" y="318" fill="#8199b7" fontSize="18" fontWeight="800" textAnchor="middle">남천동</text>
        <text x="652" y="74" fill="#b4d5e8" fontSize="16" fontWeight="800" textAnchor="middle">광안대교</text>
        {items.map((item) => {
          const pos = mapPinPositions[item.id]
          const active = selectedId === item.id
          return (
            <g key={item.id} className="map-svg-pin" onClick={() => onSelect(item.id)} tabIndex="0" role="button" aria-label={`${item.name} 선택`}
               onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item.id)}>
              <circle cx={pos.x} cy={pos.y} r={active ? 26 : 19} fill={active ? '#E8654A' : '#111827'} stroke={active ? '#ffd4c8' : '#74869d'} strokeWidth={active ? 5 : 2} />
              <text x={pos.x} y={pos.y + 7} textAnchor="middle" fontSize={active ? 18 : 14}>{item.icon}</text>
              {active && (
                <>
                  <rect x={pos.x - 62} y={pos.y - 64} width="124" height="30" rx="10" fill="#E8654A" />
                  <text x={pos.x} y={pos.y - 44} textAnchor="middle" fontSize="13" fontWeight="900" fill="white">{item.name}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function InteractiveMap({ items, activeId, onActive, mode = 'overview' }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef([])

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

  return (
    <div className="interactive-map">
      {!window.L && <div className="map-loading">지도를 불러오는 중입니다.</div>}
      <div id="map" ref={mapEl} className="leaflet-map" />
    </div>
  )
}

/* ─── 스플래시 화면 ─────────────────────────────────────── */
function Splash({ onEnter, onAI }) {
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
        <div className="splash-actions">
          <button className="splash-btn-primary" onClick={onEnter}>🍽️ 맛집 찾기</button>
          <button className="splash-btn-secondary" onClick={onAI}>✨ AI 추천받기</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 홈 화면 ───────────────────────────────────────────── */
function HomeScreen({ savedIds, onToggleSave, onSelect, onGoSearch, onGoMap, onOpenMapItem }) {
  const [moodFilter, setMoodFilter] = useState('전체')
  const [heroSearch, setHeroSearch]  = useState('')
  const [situation, setSituation]    = useState('혼밥')
  const [selectedMapId, setSelectedMapId] = useState(restaurants[0].id)

  const filtered = useMemo(() => {
    return restaurants.filter((item) => {
      if (moodFilter !== '전체' && getCuisineCategory(item) !== moodFilter) return false
      if (heroSearch.trim()) {
        const q = heroSearch.toLowerCase()
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [moodFilter, heroSearch])

  useEffect(() => {
    if (!filtered.some((item) => item.id === selectedMapId)) {
      setSelectedMapId(filtered[0]?.id ?? restaurants[0].id)
    }
  }, [filtered, selectedMapId])

  const selectedMapItem = useMemo(
    () => filtered.find((item) => item.id === selectedMapId) ?? filtered[0] ?? restaurants[0],
    [filtered, selectedMapId],
  )

  const situationItems = useMemo(() => getSituationRecommendations(situation), [situation])

  return (
    <div className="home-screen">

      {/* ── Hero Banner ── */}
      <div className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h1 className="home-hero-title">부산에서, 지금 딱 맞는 한 끼</h1>
            <p className="home-hero-sub">광안리 · 남천동 로컬 맛집을 미리 골라두세요 🌊</p>
          </div>
          <div className="home-hero-search-wrap">
            <input
              className="home-hero-input"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && heroSearch && onGoSearch()}
              placeholder="🔍 맛집, 지역, 음식을 검색해보세요"
            />
            <button className="home-hero-ai-btn" onClick={onGoSearch}>✨ AI 추천</button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="home-filter-bar">
        {homeMoodCategories.map((c) => (
          <button
            key={c.id}
            className={`home-filter-chip${moodFilter === c.id ? ' active' : ''}`}
            onClick={() => setMoodFilter(c.id)}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* ── Main Grid: Cards + Map Sidebar ── */}
      <div className="home-main-grid">

        {/* 카드 영역 */}
        <div className="home-cards-col">
          {(moodFilter !== '전체' || heroSearch) && (
            <p className="home-results-label">
              {filtered.length}곳
              {moodFilter !== '전체' ? ` · ${moodFilter}` : ''}
              {heroSearch ? ` · "${heroSearch}"` : ''}
            </p>
          )}
          {filtered.length > 0 ? (
            <div className="home-card-grid">
              {filtered.map((item) => (
                <RestaurantCard
                  key={item.id}
                  item={item}
                  saved={savedIds.includes(item.id)}
                  onToggleSave={onToggleSave}
                  onSelect={onSelect}
                  isSelected={selectedMapId === item.id}
                  onHover={setSelectedMapId}
                />
              ))}
            </div>
          ) : (
            <div className="empty-box">
              <p>조건에 맞는 맛집이 없어요 😅</p>
              <button onClick={() => { setMoodFilter('전체'); setHeroSearch('') }}>필터 초기화</button>
            </div>
          )}
        </div>

        {/* 지도 사이드바 */}
        <div className="home-map-col">
          <div className="home-map-sticky">
            <div className="home-map-box">
              <InteractiveMap
                items={filtered.length > 0 ? filtered : restaurants}
                activeId={selectedMapItem?.id}
                onActive={setSelectedMapId}
                mode="overview"
              />
            </div>

            {selectedMapItem && (
              <button className="home-sidebar-card" onClick={() => onSelect(selectedMapItem.id)}>
                <div className="home-sidebar-thumb">
                  <PhotoThumb item={selectedMapItem} />
                </div>
                <div className="home-sidebar-info">
                  <strong>{selectedMapItem.name}</strong>
                  <p>{getCuisineCategory(selectedMapItem)} · {selectedMapItem.location}</p>
                  <em>{selectedMapItem.eta}</em>
                </div>
                <span className="map-chevron">›</span>
              </button>
            )}

            <div className="home-sidebar-btns">
              <button onClick={() => selectedMapItem && onSelect(selectedMapItem.id)}>상세보기</button>
              <button onClick={() => onGoMap()}>🗺️ 전체 지도</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 상황별 추천 ── */}
      <section className="home-section situation-section">
        <div className="section-header">
          <h2>상황별 추천</h2>
        </div>
        <div className="situation-chips">
          {situationCategories.map((category) => (
            <button
              key={category.id}
              className={`situation-chip ${situation === category.id ? 'active' : ''}`}
              onClick={() => setSituation(category.id)}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
        <div className="situation-list">
          {situationItems.map(({ item, reason }) => (
            <SituationCard
              key={`${situation}-${item.id}`}
              item={item}
              reason={reason}
              onSelect={onSelect}
              onOpenMap={onOpenMapItem}
            />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <span className="home-footer-brand">🍽️ 부산 미리한끼</span>
          <p>광안리 · 남천동 로컬 맛집 큐레이션</p>
          <p className="home-footer-copy">© 2025 미리한끼. Made with ❤️ in Busan.</p>
        </div>
      </footer>
    </div>
  )
}

/* ─── 검색 / AI 추천 화면 ────────────────────────────────── */
function SearchScreen({ savedIds, onToggleSave, onSelect }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [allResults, setAllResults] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSearch() {
    if (!query.trim()) return
    const ranked = restaurants
      .map((item) => ({ item, ...scoreRestaurant(item, query) }))
      .sort((a, b) => b.score - a.score)
    setAllResults(ranked)
    const best = ranked[0]
    if (!best || best.score === 0) {
      setResult({ item: restaurants[0], reason: '질문이 아직 구체적이지 않아서 가장 무난한 곳을 먼저 골랐어요.' })
    } else {
      setResult({ item: best.item, reason: best.reason })
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
          <div className="ai-section">
            <div className="ai-badge">✨ AI 추천</div>
            <h3>어떤 한 끼를 찾으세요?</h3>
            <p className="ai-desc">궁금한 걸 자유롭게 물어보세요. 부산 맛집을 찾아드릴게요.</p>
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
              <div className="ai-best-badge">✨ AI 추천</div>
            </div>
            <div className="ai-best-body">
              <strong>{result.item.name}</strong>
              <p className="ai-reason">{result.reason}</p>
              <p className="item-eta">{result.item.eta}</p>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <h2>추천 결과</h2>
            <button className="see-more" onClick={() => { setResult(null); setAllResults(null); setQuery('') }}>다시 검색</button>
          </div>
          <div className="ai-result-grid">
            {allResults?.slice(0, 3).map(({ item }) => (
              <article key={item.id} className="ai-result-card" onClick={() => onSelect(item.id)}>
                <div className="ai-result-img"><PhotoThumb item={item} /></div>
                <p className="rec-location">{item.location}</p>
                <strong>{item.name.length > 8 ? item.name.slice(0, 8) + '…' : item.name}</strong>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 지도 화면 ─────────────────────────────────────────── */
function MapScreen({ mapSelectedId, setMapSelectedId, onSelect }) {
  const mapItem = useMemo(
    () => restaurants.find((r) => r.id === mapSelectedId) ?? restaurants[0],
    [mapSelectedId],
  )

  return (
    <div className="map-screen">
      <div className="map-body">
        <div className="map-real-wrap">
          <InteractiveMap items={restaurants} activeId={mapItem.id} onActive={setMapSelectedId} mode="overview" />
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
            <p className="item-eta">{mapItem.eta}</p>
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
              {restaurants.map((item) => (
                <button
                  key={item.id}
                  className={`map-place-card ${mapSelectedId === item.id ? 'active' : ''}`}
                  onClick={() => setMapSelectedId(item.id)}
                >
                  <span className="map-place-thumb"><PhotoThumb item={item} /></span>
                  <span className="map-place-copy">
                    <strong>{item.name}</strong>
                    <small>{getCuisineCategory(item)} · {item.eta}</small>
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

/* ─── 저장 화면 ─────────────────────────────────────────── */
function SavedScreen({ savedIds, onToggleSave, onSelect }) {
  const savedItems = restaurants.filter((r) => savedIds.includes(r.id))
  return (
    <div className="saved-screen">
      <div className="screen-title-row">
        <h2>저장한 맛집</h2>
        <span className="saved-count">{savedItems.length}곳</span>
      </div>
      {savedItems.length > 0 ? (
        <div className="trending-list">
          {savedItems.map((item) => (
            <TrendingItem key={item.id} item={item} saved onToggleSave={onToggleSave} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="empty-box big">
          <span>🔖</span>
          <p>아직 저장한 맛집이 없어요</p>
          <small>맛집 카드의 하트를 누르면 저장돼요</small>
        </div>
      )}
    </div>
  )
}

/* ─── 마이 화면 ─────────────────────────────────────────── */
function MyScreen({ savedIds, isInstalledApp, installPrompt, onInstall, showInstallGuide, setShowInstallGuide }) {
  const [rouletteItem, setRouletteItem] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)

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

  return (
    <div className="my-screen">
      <div className="my-profile-card">
        <div className="my-avatar">🧑</div>
        <div>
          <strong>부산 미리한끼 유저</strong>
          <p>저장 {savedIds.length}곳 · 방문 예정 {savedIds.length}곳</p>
        </div>
      </div>

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
      </div>

      <div className="my-list-section">
        <p className="my-section-label">내 리스트</p>
        <div className="my-list-items">
          {[
            { icon: '🔖', label: '저장한 맛집', count: savedIds.length },
            { icon: '📍', label: '광안리', count: restaurants.filter((r) => r.location === '광안리').length },
            { icon: '🍽️', label: '전체 등록 맛집', count: restaurants.length },
          ].map((item) => (
            <div key={item.label} className="my-list-item">
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <span className="my-list-count">{item.count}</span>
              <span className="my-chevron">›</span>
            </div>
          ))}
        </div>
      </div>

      <div className="my-app-info">
        <p>부산 미리한끼 v1.0</p>
        <p>광안리 · 남구 맛집 큐레이션</p>
      </div>
    </div>
  )
}

/* ─── 상세 모달 ─────────────────────────────────────────── */
function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave }) {
  const scrollRef = useRef(null)
  const [tip, setTip]       = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

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
          {item.photos?.length > 0 ? (
            <img
              src={asset(item.photos[photoIdx]?.src ?? item.photos[0].src)}
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
          {item.photos?.length > 1 && (
            <div className="photo-counter">{photoIdx + 1}/{item.photos.length}</div>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-title-row">
            <div>
              <h2 className="detail-name">{item.name}</h2>
              <p className="detail-category">{item.category} · {item.location}</p>
            </div>
            <button
              className={`detail-heart ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(item.id)}
            >{saved ? '❤️' : '🤍'}</button>
          </div>

          <div className="detail-meta-grid">
            <div className="meta-chip"><span>📍</span><span>{item.eta}</span></div>
            <div className="meta-chip"><span>🕐</span><span>{hours}</span></div>
            <div className="meta-chip"><span>🅿️</span><span>{parking}</span></div>
            <div className="meta-chip"><span>💬</span><span>{item.experience?.noise === '낮음' ? '조용함' : item.experience?.noise === '높음' ? '활발함' : '보통'}</span></div>
          </div>

          <p className="detail-hero-text">{item.hero}</p>

          {menus.length > 0 && (
            <div className="detail-menu-section">
              <h3>대표 메뉴</h3>
              {menus.map((m) => (
                <div key={m.name} className="detail-menu-item">
                  <div className="menu-icon-name">
                    <div className="menu-dot" />
                    <span>{m.name}</span>
                  </div>
                  <span className="menu-price-tag">{m.price}</span>
                </div>
              ))}
            </div>
          )}

          <div className="detail-action-row">
            <button
              className={`detail-save-btn ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(item.id)}
            >{saved ? '💖 저장됨' : '🤍 저장하기'}</button>
            <button className="detail-dir-btn" onClick={() => openMapLink(item.links.naver)}>🗺️ 길찾기</button>
          </div>

          <div className="detail-divider" />

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

          {item.media?.interior?.src && (
            <div className="detail-section">
              <h3>가게 내부</h3>
              <div className="interior-viewer-card">
                {item.media.interior.type === 'html360' ? (
                  <iframe
                    title={`${item.name} 가게 내부`}
                    src={asset(item.media.interior.src)}
                    loading="lazy"
                  />
                ) : (
                  <video
                    controls
                    playsInline
                    poster={item.media.interior.poster ? asset(item.media.interior.poster) : undefined}
                    src={asset(item.media.interior.src)}
                  />
                )}
              </div>
            </div>
          )}

          {item.experience && (
            <div className="detail-section">
              <h3>방문 경험</h3>
              <div className="detail-exp-grid">
                {[
                  { label: '혼밥', val: item.experience.soloOk ? '가능' : '불가', good: item.experience.soloOk },
                  { label: '소음', val: item.experience.noise, good: item.experience.noise === '낮음' },
                  { label: '분위기', val: item.experience.vibe, good: true },
                  { label: '음식 양', val: item.experience.portion, good: item.experience.portion === '많음' },
                ].map(({ label, val, good }) => (
                  <div key={label} className={`exp-badge ${good ? 'good' : ''}`}>
                    <small>{label}</small>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
              <dl className="detail-exp-list">
                <div><dt>대기시간</dt><dd>{item.experience.waitTime}</dd></div>
                <div><dt>좌석</dt><dd>{item.experience.seating}</dd></div>
              </dl>
            </div>
          )}

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

          <div className="detail-section">
            <h3>근처에서 함께 가볼 곳</h3>
            <div className="detail-nearby">
              {item.nearbyExternal.map((n) => (
                <a key={n.name} className="nearby-card" href={n.link} target="_blank" rel="noreferrer">
                  <span className="nearby-icon">{n.icon}</span>
                  <div>
                    <strong>{n.name}</strong>
                    <small>{n.category}</small>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  )
}

/* ─── 메인 앱 ────────────────────────────────────────────── */
export default function App() {
  const [showSplash, setShowSplash]       = useState(true)
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
    document.body.style.overflow = selectedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-saved', JSON.stringify(savedIds))
  }, [savedIds])

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
    <div className="app-wrapper">
      <div className="app-frame">
        {showSplash ? (
          <Splash
            onEnter={() => setShowSplash(false)}
            onAI={() => { setShowSplash(false); setActiveTab('search') }}
          />
        ) : (
          <>
            <main className="main-content">
              {activeTab === 'home' && (
                <HomeScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                  onGoSearch={() => setActiveTab('search')}
                  onGoMap={() => setActiveTab('map')}
                  onOpenMapItem={(id) => { setMapSelectedId(id); setActiveTab('map') }}
                />
              )}
              {activeTab === 'search' && (
                <SearchScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                />
              )}
              {activeTab === 'map' && (
                <MapScreen
                  mapSelectedId={mapSelectedId}
                  setMapSelectedId={setMapSelectedId}
                  onSelect={setSelectedId}
                />
              )}
              {activeTab === 'saved' && (
                <SavedScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                />
              )}
              {activeTab === 'my' && (
                <MyScreen
                  savedIds={savedIds}
                  isInstalledApp={isInstalledApp}
                  installPrompt={installPrompt}
                  onInstall={handleInstallApp}
                  showInstallGuide={showInstallGuide}
                  setShowInstallGuide={setShowInstallGuide}
                />
              )}
            </main>

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
          </>
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
          />
        )}
      </div>
    </div>
  )
}
