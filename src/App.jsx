import React, { useEffect, useMemo, useRef, useState } from 'react'
import { restaurants } from './data/restaurants'

const BASE = import.meta.env.BASE_URL

function asset(path) {
  return `${BASE}${path.replace(/^\//, '')}`
}

/* ─── 부가 데이터 ──────────────────────────────────────── */
const restaurantRatings  = { 1: 4.7, 2: 4.8, 3: 4.6, 4: 4.7, 5: 4.8, 6: 4.5 }
const reviewCounts       = { 1: 1234, 2: 987, 3: 753, 4: 621, 5: 2345, 6: 489 }
const operatingHours     = {
  1: '17:00 - 01:00', 2: '18:00 - 24:00', 3: '10:00 - 21:00',
  4: '09:00 - 21:00', 5: '10:00 - 15:00', 6: '11:30 - 21:00',
}
const parkingAvail       = { 1: false, 2: false, 3: false, 4: false, 5: true, 6: false }
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
  { id: '혼밥',   label: '혼밥',   icon: '🍚' },
  { id: '가성비', label: '가성비', icon: '💰' },
  { id: '데이트', label: '데이트', icon: '❤️' },
  { id: '카페',   label: '카페',   icon: '☕' },
  { id: '야식',   label: '야식',   icon: '🌙' },
]

const popularAreas = [
  { name: '광안리', emoji: '🌊', location: '광안리' },
  { name: '서면',   emoji: '🏙️', location: '서면' },
  { name: '해운대', emoji: '🏖️', location: '해운대' },
  { name: '전포',   emoji: '☕',  location: '전포' },
]

const accentClassNames = {
  sunset: 'accent-sunset', night: 'accent-night', espresso: 'accent-espresso',
  ocean: 'accent-ocean', forest: 'accent-forest', lime: 'accent-lime',
}

const mapPinPositions = {
  1: { x: 388, y: 136 }, 2: { x: 438, y: 152 }, 3: { x: 304, y: 232 },
  4: { x: 350, y: 184 }, 5: { x: 202, y: 488 }, 6: { x: 272, y: 202 },
}

const cuisineCategories = [
  { id: '전체',  keywords: [] },
  { id: '한식',  keywords: ['한식', '곰탕', '국밥'] },
  { id: '중식',  keywords: ['중식', '마라'] },
  { id: '양식',  keywords: ['양식', '와인바', '다이닝바'] },
  { id: '브런치', keywords: ['브런치'] },
  { id: '카페',  keywords: ['카페', '에스프레소바'] },
  { id: '아시안', keywords: ['아시안퓨전', '바오번', '우육면', '마파'] },
]

function getCuisineCategory(item) {
  const matched = cuisineCategories.find((c) => {
    if (c.id === '전체') return false
    return c.keywords.some((k) => item.category.includes(k))
  })
  return matched?.id ?? '기타'
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
    if (item.tags.some((t) => t.toLowerCase().includes(kw))) score += 4
    if (item.mood.some((m) => m.toLowerCase().includes(kw))) score += 4
    if (item.points.some((p) => p.toLowerCase().includes(kw))) score += 2
  })
  if (/데이트|기념일|무드|와인/.test(query)         && item.mood.includes('데이트'))     score += 8
  if (/브런치|오전|오션뷰|바다/.test(query)         && item.mood.includes('오션뷰'))     score += 8
  if (/혼밥|든든|국물|한식/.test(query)            && item.mood.includes('혼밥가능'))   score += 8
  if (/커피|카페|디저트|가볍게/.test(query)         && item.category.includes('카페'))   score += 8
  if (/바오|마파|우육면|이국적|향신료/.test(query)  && item.name === '바오하우스 광안점') score += 8
  if (/마라|얼큰|친구|저녁모임/.test(query)        && item.name === '푸안 광안점')      score += 8
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
        <p className="rec-rating">⭐ {restaurantRatings[item.id]} <span>({reviewCounts[item.id]?.toLocaleString()})</span></p>
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
        <p className="trending-meta">⭐ {restaurantRatings[item.id]} · {item.eta}</p>
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

function RealMap({ item }) {
  const query = item.mapQuery || `${item.name} ${item.address}`
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`
  return (
    <div className="real-map">
      <iframe title={`${item.name} 지도`} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </div>
  )
}

/* ─── 스플래시 화면 ─────────────────────────────────────── */
function Splash({ onEnter, onAI }) {
  return (
    <div className="splash">
      <div className="splash-bg">
        <img src={asset('/busan-bg.svg')} alt="" aria-hidden="true" />
      </div>
      <div className="splash-overlay" />
      <div className="splash-content">
        <div className="splash-logo-area">
          <img src={asset('/app-icon-192.png')} alt="앱 아이콘" className="splash-icon" />
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
function HomeScreen({ savedIds, onToggleSave, onSelect, onGoSearch, onGoMap }) {
  const [moodFilter, setMoodFilter] = useState('전체')
  const [areaFilter, setAreaFilter]   = useState(null)

  const filtered = useMemo(() => {
    return restaurants.filter((item) => {
      if (areaFilter && item.location !== areaFilter) return false
      if (moodFilter === '전체')   return true
      if (moodFilter === '혼밥')   return item.experience?.soloOk
      if (moodFilter === '가성비') return parseFloat(item.price) < 15000 || item.price.includes('9,000') || item.price.includes('10,000') || item.price.includes('5,000') || item.price.includes('12,000')
      if (moodFilter === '데이트') return item.mood.includes('데이트') || item.mood.includes('기념일')
      if (moodFilter === '카페')   return item.category.includes('카페')
      if (moodFilter === '야식')   return item.mood.includes('저녁모임') || item.mood.includes('캐주얼')
      return true
    })
  }, [moodFilter, areaFilter])

  const featured = useMemo(() => restaurants.slice(0, 3), [])

  return (
    <div className="home-screen">
      {/* 헤더 */}
      <div className="home-header">
        <div className="home-location">
          <span className="location-pin">📍</span>
          <span className="location-text">부산광역시 · {areaFilter || '광안리'}</span>
          {areaFilter && (
            <button className="area-clear" onClick={() => setAreaFilter(null)}>✕</button>
          )}
        </div>
        <button className="header-icon-btn" onClick={() => onGoMap()}>🗺️</button>
      </div>

      {/* 검색창 */}
      <button className="home-search-bar" onClick={onGoSearch}>
        <span className="search-icon">🔍</span>
        <span className="search-placeholder">지역, 음식, 맛집을 검색해보세요</span>
      </button>

      {/* 오늘의 추천 */}
      <section className="home-section">
        <div className="section-header">
          <h2>오늘의 추천 한끼</h2>
          <button className="see-more" onClick={onGoSearch}>더보기</button>
        </div>
        <div className="rec-scroll">
          {featured.map((item) => (
            <RecommendCard
              key={item.id}
              item={item}
              saved={savedIds.includes(item.id)}
              onToggleSave={onToggleSave}
              onSelect={onSelect}
            />
          ))}
        </div>
      </section>

      {/* 카테고리 */}
      <div className="mood-chips">
        {homeMoodCategories.map((c) => (
          <button
            key={c.id}
            className={`mood-chip ${moodFilter === c.id ? 'active' : ''}`}
            onClick={() => setMoodFilter(c.id)}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* 인기 지역 */}
      <section className="home-section">
        <div className="section-header">
          <h2>인기 지역</h2>
        </div>
        <div className="area-cards">
          {popularAreas.map((area) => (
            <button
              key={area.name}
              className={`area-card ${areaFilter === area.location ? 'active' : ''}`}
              onClick={() => setAreaFilter(areaFilter === area.location ? null : area.location)}
            >
              <span className="area-emoji">{area.emoji}</span>
              <span className="area-name">{area.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 지금 뜨는 맛집 */}
      <section className="home-section">
        <div className="section-header">
          <h2>지금 뜨는 맛집</h2>
          {moodFilter !== '전체' && (
            <button className="see-more" onClick={() => setMoodFilter('전체')}>전체 보기</button>
          )}
        </div>
        {filtered.length > 0 ? (
          <div className="trending-list">
            {filtered.map((item) => (
              <TrendingItem
                key={item.id}
                item={item}
                saved={savedIds.includes(item.id)}
                onToggleSave={onToggleSave}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="empty-box">
            <p>조건에 맞는 맛집이 없어요 😅</p>
            <button onClick={() => { setMoodFilter('전체'); setAreaFilter(null) }}>필터 초기화</button>
          </div>
        )}
      </section>

      <div style={{ height: 16 }} />
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
          {/* AI 예시 */}
          <div className="ai-section">
            <div className="ai-badge">✨ AI 추천</div>
            <h3>어떤 한 끼를 찾으세요?</h3>
            <p className="ai-desc">궁금한 걸 자유롭게 물어보세요. 부산 맛집을 찾아드릴게요.</p>
            <div className="example-queries">
              {exampleQueries.map((q) => (
                <button key={q} className="example-chip" onClick={() => { setQuery(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 전체 목록 */}
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
          {/* 베스트 추천 */}
          <div className="ai-best-card" onClick={() => onSelect(result.item.id)}>
            <div className="ai-best-photo">
              <PhotoThumb item={result.item} />
              <div className="ai-best-badge">✨ AI 추천</div>
            </div>
            <div className="ai-best-body">
              <strong>{result.item.name}</strong>
              <p className="ai-reason">{result.reason}</p>
              <p className="rec-rating">⭐ {restaurantRatings[result.item.id]} · {result.item.eta}</p>
            </div>
          </div>

          {/* 전체 순위 */}
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
                <p className="rec-rating">⭐ {restaurantRatings[item.id]}</p>
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
  const [mapCategory, setMapCategory] = useState('전체')
  const mapItem = useMemo(
    () => restaurants.find((r) => r.id === mapSelectedId) ?? restaurants[0],
    [mapSelectedId],
  )

  const mapCategories = ['전체', '한식', '카페', '양식', '아시안']

  function handleMapCategory(label) {
    setMapCategory(label)
    if (label === '전체') {
      setMapSelectedId(restaurants[0].id)
      return
    }

    const firstMatch = restaurants.find((item) => getCuisineCategory(item) === label)
    if (firstMatch) setMapSelectedId(firstMatch.id)
  }

  return (
    <div className="map-screen">
      {/* 필터 칩 */}
      <div className="map-filter-chips">
        {mapCategories.map((label) => (
          <button
            key={label}
            className={`map-chip ${mapCategory === label ? 'active' : ''}`}
            onClick={() => handleMapCategory(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div className="map-body">
        <div className="map-real-wrap">
          <RealMap item={mapItem} />
        </div>
      </div>

      {/* 하단 카드 */}
      <div className="map-bottom-card">
        <div className="map-bottom-inner" onClick={() => onSelect(mapItem.id)}>
          <div className="map-bottom-thumb">
            <PhotoThumb item={mapItem} />
          </div>
          <div className="map-bottom-info">
            <strong>{mapItem.name}</strong>
            <p>{mapItem.category} · {mapItem.location}</p>
            <p className="rec-rating">⭐ {restaurantRatings[mapItem.id]} · {mapItem.eta}</p>
          </div>
          <span className="map-chevron">›</span>
        </div>
        <div className="map-bottom-actions">
          <div className="map-place-scroll">
            {restaurants.map((item) => (
              <button
                key={item.id}
                className={`map-place-chip ${mapSelectedId === item.id ? 'active' : ''}`}
                onClick={() => setMapSelectedId(item.id)}
              >
                <span>{item.icon}</span> {item.name.slice(0, 5)}
              </button>
            ))}
          </div>
          <div className="map-action-row">
            <button className="map-btn naver" onClick={() => openMapLink(mapItem.links.naver)}>네이버 지도</button>
            <button className="map-btn kakao" onClick={() => openMapLink(mapItem.links.kakao)}>카카오맵</button>
            <button className="map-btn google" onClick={() => openMapLink(mapItem.links.google)}>구글지도</button>
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
      {/* 프로필 섹션 */}
      <div className="my-profile-card">
        <div className="my-avatar">🧑</div>
        <div>
          <strong>부산 미리한끼 유저</strong>
          <p>저장 {savedIds.length}곳 · 방문 예정 {savedIds.length}곳</p>
        </div>
      </div>

      {/* 앱 설치 */}
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

      {/* 룰렛 */}
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

      {/* 내 리스트 */}
      <div className="my-list-section">
        <p className="my-section-label">내 리스트</p>
        <div className="my-list-items">
          {[
            { icon: '🔖', label: '저장한 맛집', count: savedIds.length },
            { icon: '📍', label: '광안리', count: restaurants.filter(r => r.location === '광안리').length },
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

/* ─── 상세 모달 (완전 재설계) ────────────────────────────── */
function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave }) {
  const scrollRef = useRef(null)
  const [tip, setTip]     = useState('')
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

  const rating  = restaurantRatings[item.id] || 4.5
  const reviews = reviewCounts[item.id] || 500
  const hours   = operatingHours[item.id] || '정보 없음'
  const parking = parkingAvail[item.id] ? '주차 가능' : '주차 불가'
  const menus   = menuData[item.id] || []

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="detail-panel" ref={scrollRef}>

        {/* 사진 헤더 */}
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

        {/* 메인 정보 */}
        <div className="detail-body">

          {/* 이름 + 찜 */}
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

          {/* 별점 */}
          <div className="detail-rating-row">
            <span className="detail-stars">⭐ {rating}</span>
            <span className="detail-review-count">리뷰 {reviews.toLocaleString()}</span>
          </div>

          {/* 메타 그리드 */}
          <div className="detail-meta-grid">
            <div className="meta-chip"><span>📍</span><span>{item.eta}</span></div>
            <div className="meta-chip"><span>🕐</span><span>{hours}</span></div>
            <div className="meta-chip"><span>🅿️</span><span>{parking}</span></div>
            <div className="meta-chip"><span>💬</span><span>{item.experience?.noise === '낮음' ? '조용함' : item.experience?.noise === '높음' ? '활발함' : '보통'}</span></div>
          </div>

          {/* 한 줄 소개 */}
          <p className="detail-hero-text">{item.hero}</p>

          {/* 대표 메뉴 */}
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

          {/* 액션 버튼 */}
          <div className="detail-action-row">
            <button
              className={`detail-save-btn ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(item.id)}
            >{saved ? '💖 저장됨' : '🤍 저장하기'}</button>
            <button className="detail-dir-btn" onClick={() => openMapLink(item.links.naver)}>🗺️ 길찾기</button>
          </div>

          <div className="detail-divider" />

          {/* 음식 사진 더보기 */}
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

          {/* 방문 경험 */}
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

          {/* 에디터 포인트 */}
          <div className="detail-section">
            <h3>에디터 포인트</h3>
            <ul className="detail-points">
              {item.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>

          {/* 지도 연결 */}
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

          {/* 방문 팁 */}
          <div className="detail-section tip-box">
            <div className="tip-head">
              <h3>방문 팁</h3>
              <button className="tip-reveal-btn" onClick={() => setTip(getTip(item))}>팁 보기</button>
            </div>
            <p className="tip-text">{tip || '버튼을 누르면 이 장소를 더 잘 즐기는 방법을 알려드려요.'}</p>
          </div>

          {/* 근처 */}
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
  const [showSplash, setShowSplash]     = useState(true)
  const [activeTab, setActiveTab]       = useState('home')
  const [selectedId, setSelectedId]     = useState(null)
  const [mapSelectedId, setMapSelectedId] = useState(restaurants[0].id)
  const [installPrompt, setInstallPrompt]   = useState(null)
  const [isInstalledApp, setIsInstalledApp] = useState(
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

            {/* 하단 탭 */}
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
