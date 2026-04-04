import { useEffect, useMemo, useRef, useState } from 'react'
import { locationOptions, moodOptions, restaurants } from './data/restaurants'

const navItems = [
  { id: 'home', label: '둘러보기', mobile: '홈', icon: '🏠' },
  { id: 'map', label: '맛집지도', mobile: '지도', icon: '🗺️' },
  { id: 'recommend', label: '오늘뭐먹지', mobile: '룰렛', icon: '🎲' },
  { id: 'saved', label: '찜한목록', mobile: '찜', icon: '❤️' },
]

const sortOptions = [
  { id: 'popular', label: '인기순' },
  { id: 'distance', label: '거리순' },
]

const quickFilters = [
  { id: '전체', label: '전체', icon: '✨' },
  { id: '데이트', label: '데이트', icon: '💑' },
  { id: '혼밥가능', label: '혼밥', icon: '🍽️' },
  { id: '오션뷰', label: '오션뷰', icon: '🌊' },
  { id: '브런치', label: '브런치', icon: '🥐' },
  { id: '캐주얼', label: '캐주얼', icon: '🛵' },
]

const accentClassNames = {
  sunset: 'accent-sunset',
  night: 'accent-night',
  espresso: 'accent-espresso',
  ocean: 'accent-ocean',
  forest: 'accent-forest',
  lime: 'accent-lime',
}

const cuisineCategories = [
  { id: '전체', label: '전체', icon: '🍽️', keywords: [] },
  { id: '한식', label: '한식', icon: '🍚', keywords: ['한식', '곰탕', '국밥'] },
  { id: '중식', label: '중식', icon: '🥢', keywords: ['중식', '마라'] },
  { id: '양식', label: '양식', icon: '🍷', keywords: ['양식', '와인바', '다이닝바'] },
  { id: '카페', label: '카페', icon: '☕', keywords: ['카페', '에스프레소바'] },
  { id: '브런치', label: '브런치', icon: '🥐', keywords: ['브런치'] },
  { id: '아시안', label: '아시안', icon: '🍜', keywords: ['베트남음식', '쌀국수'] },
]

function getCuisineCategory(item) {
  const matched = cuisineCategories.find((category) => {
    if (category.id === '전체') return false
    return category.keywords.some((keyword) => item.category.includes(keyword))
  })

  return matched?.id ?? '기타'
}

function scoreRestaurant(item, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return { score: 0, reason: '질문을 입력하면 취향에 맞춘 추천을 드릴게요.' }
  }

  const keywords = normalized.split(/\s+/).filter(Boolean)
  let score = 0

  keywords.forEach((keyword) => {
    if (item.name.toLowerCase().includes(keyword)) score += 6
    if (item.category.toLowerCase().includes(keyword)) score += 4
    if (item.location.toLowerCase().includes(keyword)) score += 3
    if (item.hero.toLowerCase().includes(keyword)) score += 3
    if (item.price.toLowerCase().includes(keyword)) score += 2
    if (item.tags.some((tag) => tag.toLowerCase().includes(keyword))) score += 4
    if (item.mood.some((mood) => mood.toLowerCase().includes(keyword))) score += 4
    if (item.points.some((point) => point.toLowerCase().includes(keyword))) score += 2
  })

  if (/데이트|기념일|무드|와인/.test(query) && item.mood.includes('데이트')) score += 8
  if (/브런치|오전|오션뷰|바다/.test(query) && item.mood.includes('오션뷰')) score += 8
  if (/혼밥|든든|국물|한식/.test(query) && item.mood.includes('혼밥가능')) score += 8
  if (/커피|카페|디저트|가볍게/.test(query) && item.category.includes('카페')) score += 8
  if (/쌀국수|이국적|동남아|가벼운 점심/.test(query) && item.name === '까몬') score += 8
  if (/마라|얼큰|친구|저녁모임/.test(query) && item.name === '푸안 광안점') score += 8

  const reasonParts = [
    `${item.location}에서 찾기 쉬운 동선`,
    `${item.category} 중심의 메뉴 구성`,
    item.recommend,
  ]

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
    4: '위킹홀리데이는 창가 좌석 선호가 높아서 오픈 시간대 방문이 가장 안정적이고, 브런치 메뉴 뒤에 커피를 이어가면 흐름이 좋아요.',
    5: '나막집은 기본 곰탕으로 먼저 국물 스타일을 보고, 양이 아쉽다면 수육이나 특 곰탕을 추가하는 방식이 부담이 적어요.',
    6: '까몬은 쌀국수와 반미를 함께 주문하면 식감 차이가 좋아서 만족도가 높고, 점심 피크 전 방문이 가장 쾌적해요.',
  }

  return tips[item.id] ?? '대표 메뉴 하나와 사이드 하나를 조합해서 방문하면 이 집의 강점을 더 또렷하게 느낄 수 있어요.'
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  return Promise.resolve()
}

function sortRestaurants(items, sortBy) {
  const cloned = [...items]

  if (sortBy === 'distance') {
    return cloned.sort((a, b) => a.distance - b.distance)
  }

  return cloned.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating
    return b.reviewCount - a.reviewCount
  })
}

function RestaurantCard({ item, saved, onToggleSave, onSelect, onOpenMap }) {
  return (
    <article className="card-surface restaurant-card">
      <button className={`restaurant-hero ${accentClassNames[item.accent]}`} onClick={() => onSelect(item.id)}>
        <div className="hero-badge-row">
          <span className="eyebrow">{item.location}</span>
          <span className="hero-delivery-tag">{item.deliveryTag}</span>
        </div>
        <span className="restaurant-icon">{item.icon}</span>
        <div className="restaurant-hero-copy">
          <h3>{item.name}</h3>
          <p>{item.category}</p>
        </div>
      </button>

      <div className="restaurant-body">
        <div className="meta-row">
          <span>⭐ {item.rating.toFixed(1)}</span>
          <span>리뷰 {item.reviewCount}</span>
          <span>{item.eta}</span>
        </div>
        <p className="restaurant-copy">{item.hero}</p>
        <div className="featured-menu-row">
          <strong>대표 메뉴</strong>
          <span>{item.featuredMenu}</span>
          <small>{item.distance.toFixed(1)}km</small>
        </div>
        <div className="chip-row">
          {item.highlight.map((entry) => (
            <span className="chip" key={entry}>{entry}</span>
          ))}
        </div>
        <div className="card-actions">
          <button className="button button-dark" onClick={() => onSelect(item.id)}>상세보기</button>
          <button className="button button-soft" onClick={() => onOpenMap(item.id)}>지도확인</button>
          <button className={`icon-button ${saved ? 'saved' : ''}`} onClick={() => onToggleSave(item.id)} aria-label="찜 토글">
            {saved ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </article>
  )
}

function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave }) {
  const scrollRef = useRef(null)
  const [tip, setTip] = useState('')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    setTip('')
  }, [item.id])

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={`modal-title-${item.id}`}>
      <button className="modal-backdrop" onClick={onClose} aria-label="닫기" />
      <section className="modal-panel">
        <div className={`modal-hero ${accentClassNames[item.accent]}`}>
          <div className="modal-top-actions">
            <button className="glass-button" onClick={() => onShare(item)}>공유</button>
            <button className="glass-button" onClick={() => onToggleSave(item.id)}>{saved ? '찜해제' : '찜하기'}</button>
            <button className="glass-button" onClick={onClose}>닫기</button>
          </div>
          <span className="modal-icon">{item.icon}</span>
          <p className="eyebrow">{item.location}</p>
          <h2 id={`modal-title-${item.id}`}>{item.name}</h2>
          <p className="modal-subtitle">{item.category}</p>
        </div>

        <div className="modal-content" ref={scrollRef}>
          <section className="info-block standout">
            <p className="eyebrow dark">한 줄 소개</p>
            <h3>{item.hero}</h3>
            <p>{item.recommend}</p>
          </section>

          <section className="detail-grid">
            <div className="info-block">
              <p className="eyebrow dark">가격대</p>
              <strong>{item.price}</strong>
            </div>
            <div className="info-block">
              <p className="eyebrow dark">주소</p>
              <strong>{item.address}</strong>
            </div>
          </section>

          <section className="link-grid">
            <a className="link-card" href={item.links.naver} target="_blank" rel="noreferrer">네이버 지도</a>
            <a className="link-card" href={item.links.kakao} target="_blank" rel="noreferrer">카카오맵</a>
            <a className="link-card" href={item.links.google} target="_blank" rel="noreferrer">구글맵</a>
            {item.links.reservation ? (
              <a className="link-card accent" href={item.links.reservation} target="_blank" rel="noreferrer">예약하기</a>
            ) : (
              <a className="link-card accent" href={`tel:${item.phone}`}>전화 문의</a>
            )}
          </section>

          <section className="info-block">
            <p className="eyebrow dark">에디터 포인트</p>
            <ul className="point-list">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="info-block tip-panel">
            <div className="tip-header">
              <div>
                <p className="eyebrow dark">추천 팁</p>
                <h3>실사용 기준으로 고른 방문 포인트</h3>
              </div>
              <button className="button button-soft" onClick={() => setTip(getTip(item))}>팁 보기</button>
            </div>
            <p>{tip || '버튼을 누르면 이 장소를 더 잘 즐기는 방법을 보여드려요.'}</p>
          </section>

          <section className="info-block">
            <p className="eyebrow dark">근처 함께 보기 좋은 곳</p>
            <div className="nearby-grid">
              {item.nearbyExternal.map((nearby) => (
                <a key={nearby.name} className="nearby-card" href={nearby.link} target="_blank" rel="noreferrer">
                  <span>{nearby.icon}</span>
                  <strong>{nearby.name}</strong>
                  <small>{nearby.category}</small>
                </a>
              ))}
            </div>
          </section>

          <div className="modal-footer-actions">
            <button className="button button-soft" onClick={() => onShare(item)}>링크 복사</button>
            <button className="button button-dark" onClick={() => onOpenMap(item.id)}>지도에서 보기</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [selectedId, setSelectedId] = useState(null)
  const [mapSelectedId, setMapSelectedId] = useState(restaurants[0].id)
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = window.localStorage.getItem('miri-hankki-saved')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [aiQuery, setAiQuery] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [showCopyMessage, setShowCopyMessage] = useState(false)
  const [locFilter, setLocFilter] = useState('전체')
  const [moodFilter, setMoodFilter] = useState('전체')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [quickFilter, setQuickFilter] = useState('전체')
  const [sortBy, setSortBy] = useState('popular')
  const [rouletteItem, setRouletteItem] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedId])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-saved', JSON.stringify(savedIds))
  }, [savedIds])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((item) => {
      const locationMatch = locFilter === '전체' || item.location === locFilter
      const moodMatch = moodFilter === '전체' || item.mood.includes(moodFilter)
      const categoryMatch =
        categoryFilter === '전체' || getCuisineCategory(item) === categoryFilter
      const quickMatch =
        quickFilter === '전체' ||
        item.mood.includes(quickFilter) ||
        item.category.includes(quickFilter) ||
        item.tags.includes(quickFilter)

      return locationMatch && moodMatch && categoryMatch && quickMatch
    })
  }, [categoryFilter, locFilter, moodFilter, quickFilter])

  const homeSections = useMemo(() => {
    return cuisineCategories
      .filter((category) => category.id !== '전체')
      .map((category) => ({
        ...category,
        items: sortRestaurants(
          filteredRestaurants.filter((item) => getCuisineCategory(item) === category.id),
          sortBy,
        ),
      }))
      .filter((category) => category.items.length > 0)
  }, [filteredRestaurants, sortBy])

  const sortedFilteredRestaurants = useMemo(
    () => sortRestaurants(filteredRestaurants, sortBy),
    [filteredRestaurants, sortBy],
  )

  const selectedItem = useMemo(
    () => restaurants.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  )

  const mapItem = useMemo(
    () => restaurants.find((item) => item.id === mapSelectedId) ?? restaurants[0],
    [mapSelectedId],
  )

  const savedRestaurants = useMemo(
    () => restaurants.filter((item) => savedIds.includes(item.id)),
    [savedIds],
  )

  const heroHighlights = useMemo(
    () => [
      { title: '오늘의 추천', value: `${filteredRestaurants.length}곳`, description: '지금 조건에 맞는 맛집' },
      { title: '가장 많은 지역', value: '광안리', description: '바다 코스와 함께 보기 좋음' },
      { title: '빠른 필터', value: quickFilter, description: '배달앱처럼 바로 고르기' },
    ],
    [filteredRestaurants.length, quickFilter],
  )

  function handleAiSearch() {
    const ranked = restaurants
      .map((item) => ({ item, ...scoreRestaurant(item, aiQuery) }))
      .sort((a, b) => b.score - a.score)

    const best = ranked[0]
    if (!best || best.score === 0) {
      setAiResult({ id: restaurants[0].id, reason: '질문이 아직 구체적이지 않아서 가장 무난하게 즐기기 좋은 곳을 먼저 골랐어요. 원하는 분위기나 메뉴를 조금 더 적어주면 더 정확해집니다.' })
      return
    }

    setAiResult({ id: best.item.id, reason: best.reason })
  }

  function toggleSave(id) {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]))
  }

  async function handleShare(item) {
    await copyToClipboard(item.links.naver)
    setShowCopyMessage(true)
    window.setTimeout(() => setShowCopyMessage(false), 1800)
  }

  function openMap(id) {
    setMapSelectedId(id)
    setSelectedId(null)
    setActiveTab('map')
  }

  function spinRoulette() {
    if (isSpinning) return
    setIsSpinning(true)

    let spins = 0
    const timer = window.setInterval(() => {
      const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)]
      setRouletteItem(randomRestaurant)
      spins += 1
      if (spins >= 20) {
        window.clearInterval(timer)
        setIsSpinning(false)
      }
    }, 90)
  }

  return (
    <div className="app-shell">
      {showCopyMessage && <div className="toast">네이버 지도 링크를 복사했어요.</div>}

      <header className="topbar">
        <button className="brand" onClick={() => setActiveTab('home')}>
          <span className="brand-mark">🌊</span>
          <span>
            <strong>부산 미리한끼</strong>
            <small>AI 대신 취향 중심으로 정리한 맛집 큐레이션</small>
          </span>
        </button>
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-shell">
        {activeTab === 'home' && (
          <>
            <section className="hero-panel">
              <div className="hero-copy-block">
                <p className="eyebrow">Busan Food Home</p>
                <h1>한식부터 카페까지, 앱 홈처럼 카테고리로 바로 고르세요.</h1>
                <p>
                  배민이나 쿠팡이츠처럼 먼저 카테고리를 고르고, 그 안에서 분위기와 지역으로 더 좁혀보세요.
                  취향 문장 검색도 함께 쓸 수 있게 구성했습니다.
                </p>
                <div className="hero-stat-grid">
                  {heroHighlights.map((entry) => (
                    <div className="hero-stat-card" key={entry.title}>
                      <small>{entry.title}</small>
                      <strong>{entry.value}</strong>
                      <span>{entry.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hero-search-panel">
                <label htmlFor="query" className="eyebrow dark">취향 입력</label>
                <div className="hero-search-row">
                  <input
                    id="query"
                    value={aiQuery}
                    onChange={(event) => setAiQuery(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAiSearch()}
                    placeholder="예: 조용한 데이트 디너, 바다 보이는 브런치, 혼밥 가능한 국물 메뉴"
                  />
                  <button className="button button-dark" onClick={handleAiSearch}>추천받기</button>
                </div>
                {aiResult && (
                  <div className="result-card">
                    <p className="eyebrow dark">추천 결과</p>
                    <h2>{restaurants.find((item) => item.id === aiResult.id)?.name}</h2>
                    <p>{aiResult.reason}</p>
                    <button className="button button-soft" onClick={() => setSelectedId(aiResult.id)}>자세히 보기</button>
                  </div>
                )}
              </div>
            </section>

            <section className="category-home card-surface">
              <div className="section-headline-row compact">
                <div>
                  <p className="eyebrow dark">Category Home</p>
                  <h2>카테고리로 바로 탐색</h2>
                </div>
                <p className="section-caption">누르면 바로 해당 음식군 위주로 홈이 재구성됩니다.</p>
              </div>

              <div className="category-grid">
                {cuisineCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`category-tile ${categoryFilter === category.id ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(category.id)}
                  >
                    <span>{category.icon}</span>
                    <strong>{category.label}</strong>
                    <small>
                      {category.id === '전체'
                        ? '전체 맛집 보기'
                        : `${restaurants.filter((item) => getCuisineCategory(item) === category.id).length}곳`}
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <section className="quick-filter-strip card-surface">
              <div className="section-headline-row compact">
                <div>
                  <p className="eyebrow dark">Quick Picks</p>
                  <h2>빠르게 고르는 퀵필터</h2>
                </div>
                <button className="text-action" onClick={() => setQuickFilter('전체')}>
                  전체 해제
                </button>
              </div>

              <div className="quick-filter-row">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={`quick-filter-pill ${quickFilter === filter.id ? 'active' : ''}`}
                    onClick={() => {
                      setQuickFilter(filter.id)
                      if (filter.id !== '전체' && moodOptions.includes(filter.id)) {
                        setMoodFilter(filter.id)
                      }
                    }}
                  >
                    <span>{filter.icon}</span>
                    <strong>{filter.label}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="section-headline-row">
              <div>
                <p className="eyebrow dark">Quick Filters</p>
                <h2>지역과 분위기로 더 좁혀보기</h2>
              </div>
              <div className="filter-stack">
                <select value={locFilter} onChange={(event) => setLocFilter(event.target.value)}>
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)}>
                  {moodOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="sort-tabs" role="tablist" aria-label="정렬 방식">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      className={sortBy === option.id ? 'active' : ''}
                      onClick={() => setSortBy(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {categoryFilter === '전체' ? (
              <section className="category-sections">
                {homeSections.map((section) => (
                  <section className="category-section" key={section.id}>
                    <div className="section-headline-row compact">
                      <div>
                        <p className="eyebrow dark">{section.label}</p>
                        <h2>{section.icon} {section.label} 추천</h2>
                      </div>
                      <button className="text-action" onClick={() => setCategoryFilter(section.id)}>
                        이 카테고리만 보기
                      </button>
                    </div>
                    <div className="restaurant-grid">
                      {section.items.map((item) => (
                        <RestaurantCard
                          key={item.id}
                          item={item}
                          saved={savedIds.includes(item.id)}
                          onToggleSave={toggleSave}
                          onSelect={setSelectedId}
                          onOpenMap={openMap}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </section>
            ) : (
              <section className="category-section">
                <div className="section-headline-row compact">
                  <div>
                    <p className="eyebrow dark">Selected Category</p>
                    <h2>
                      {cuisineCategories.find((entry) => entry.id === categoryFilter)?.icon} {categoryFilter} 맛집
                    </h2>
                  </div>
                  <button className="text-action" onClick={() => setCategoryFilter('전체')}>
                    전체 카테고리 보기
                  </button>
                </div>

                {filteredRestaurants.length > 0 ? (
                  <div className="restaurant-grid">
                    {sortedFilteredRestaurants.map((item) => (
                      <RestaurantCard
                        key={item.id}
                        item={item}
                        saved={savedIds.includes(item.id)}
                        onToggleSave={toggleSave}
                        onSelect={setSelectedId}
                        onOpenMap={openMap}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state card-surface">
                    <strong>조건에 맞는 맛집이 아직 없습니다.</strong>
                    <p>지역이나 분위기 필터를 조금 완화하면 더 많은 카테고리 결과를 볼 수 있어요.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === 'map' && (
          <section className="map-layout">
            <aside className="map-sidebar card-surface">
              <div>
                <p className="eyebrow dark">Map Focus</p>
                <h2>{mapItem.name}</h2>
                <p>{mapItem.hero}</p>
              </div>
              <div className="chip-row">
                {restaurants.map((item) => (
                  <button
                    key={item.id}
                    className={`map-chip ${mapSelectedId === item.id ? 'active' : ''}`}
                    onClick={() => setMapSelectedId(item.id)}
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
              <div className={`map-highlight ${accentClassNames[mapItem.accent]}`}>
                <span>{mapItem.icon}</span>
                <div>
                  <strong>{mapItem.category}</strong>
                  <p>{mapItem.address}</p>
                </div>
              </div>
              <div className="card-actions stacked">
                <a className="button button-soft" href={mapItem.links.naver} target="_blank" rel="noreferrer">네이버 지도</a>
                <a className="button button-soft" href={mapItem.links.kakao} target="_blank" rel="noreferrer">카카오맵</a>
                <a className="button button-soft" href={mapItem.links.google} target="_blank" rel="noreferrer">구글맵</a>
                <button className="button button-dark" onClick={() => setSelectedId(mapItem.id)}>상세 보기</button>
              </div>
            </aside>

            <div className="map-frame card-surface">
              <iframe
                title={`${mapItem.name} 지도`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapItem.name)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {activeTab === 'recommend' && (
          <section className="roulette-panel card-surface">
            <p className="eyebrow dark">Random Pick</p>
            <h2>오늘 뭐 먹지?</h2>
            <p>결정이 어려울 때는 룰렛으로 가볍게 시작해보세요.</p>
            <div className={`roulette-display ${isSpinning ? 'spinning' : ''}`}>
              {rouletteItem ? (
                <>
                  <span>{rouletteItem.icon}</span>
                  <strong>{rouletteItem.name}</strong>
                </>
              ) : (
                <span>🎰</span>
              )}
            </div>
            <div className="card-actions centered">
              <button className="button button-dark" onClick={spinRoulette} disabled={isSpinning}>
                {isSpinning ? '고르는 중...' : '룰렛 돌리기'}
              </button>
              {rouletteItem && !isSpinning && (
                <button className="button button-soft" onClick={() => setSelectedId(rouletteItem.id)}>
                  결과 자세히 보기
                </button>
              )}
            </div>
          </section>
        )}

        {activeTab === 'saved' && (
          <section>
            <div className="section-headline-row">
              <div>
                <p className="eyebrow dark">Favorites</p>
                <h2>찜한 맛집</h2>
              </div>
            </div>
            {savedRestaurants.length ? (
              <div className="restaurant-grid">
                {savedRestaurants.map((item) => (
                  <RestaurantCard
                    key={item.id}
                    item={item}
                    saved
                    onToggleSave={toggleSave}
                    onSelect={setSelectedId}
                    onOpenMap={openMap}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state card-surface">
                <strong>아직 찜한 장소가 없습니다.</strong>
                <p>둘러보기에서 마음에 드는 곳을 저장해두면 여기서 한 번에 볼 수 있어요.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id)}>
            <span>{item.icon}</span>
            <small>{item.mobile}</small>
          </button>
        ))}
      </nav>

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
  )
}
