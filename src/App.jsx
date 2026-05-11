import React, { useEffect, useMemo, useRef, useState } from 'react'
import { restaurants } from './data/restaurants'

const BASE = import.meta.env.BASE_URL

function asset(path) {
  return `${BASE}${path.replace(/^\//, '')}`
}

const navItems = [
  { id: 'home', label: '둘러보기', mobile: '홈', icon: '🏠' },
  { id: 'map', label: '맛집지도', mobile: '지도', icon: '🗺️' },
  { id: 'recommend', label: '오늘뭐먹지', mobile: '룰렛', icon: '🎲' },
  { id: 'saved', label: '찜한목록', mobile: '찜', icon: '❤️' },
]

const accentClassNames = {
  sunset: 'accent-sunset',
  night: 'accent-night',
  espresso: 'accent-espresso',
  ocean: 'accent-ocean',
  forest: 'accent-forest',
  lime: 'accent-lime',
}

const mapPinPositions = {
  1: { x: 388, y: 136 },
  2: { x: 438, y: 152 },
  3: { x: 304, y: 232 },
  4: { x: 350, y: 184 },
  5: { x: 202, y: 488 },
  6: { x: 272, y: 202 },
}

const cuisineCategories = [
  { id: '전체', label: '전체', icon: '🍽️', keywords: [] },
  { id: '한식', label: '한식', icon: '🍚', keywords: ['한식', '곰탕', '국밥'] },
  { id: '중식', label: '중식', icon: '🥢', keywords: ['중식', '마라'] },
  { id: '양식', label: '양식', icon: '🍷', keywords: ['양식', '와인바', '다이닝바'] },
  { id: '브런치', label: '브런치', icon: '🥐', keywords: ['브런치'] },
  { id: '카페', label: '카페', icon: '☕', keywords: ['카페', '에스프레소바'] },
  { id: '아시안', label: '아시안', icon: '🍜', keywords: ['아시안퓨전', '바오번', '우육면', '마파'] },
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
  if (/바오|마파|우육면|이국적|향신료|가벼운 점심/.test(query) && item.name === '바오하우스 광안점') score += 8
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
    5: '나막집은 돼지곰탕으로 맑은 국물 스타일을 먼저 보고, 든든하게 먹고 싶다면 고기 칼국수나 삼겹구이를 함께 고르면 좋아요.',
    6: '바오하우스는 마파두부와 볶음밥을 함께 먹으면 향신료와 고소함의 균형이 좋아요. 점심 피크 전 방문하면 좁은 좌석도 조금 더 편하게 이용할 수 있어요.',
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

function sortRestaurants(items) {
  return [...items]
}

function openMapLink(url) {
  window.location.href = url
}

function RestaurantCard({ item, saved, onToggleSave, onSelect, onOpenMap }) {
  return (
    <article className="card-surface restaurant-card">
      <button
        type="button"
        className={`restaurant-thumb ${accentClassNames[item.accent]}`}
        onClick={() => onSelect(item.id)}
        aria-label={`${item.name} 상세보기`}
      >
        <span className="restaurant-icon">{item.icon}</span>
      </button>

      <div className="restaurant-info">
        <div className="restaurant-info-head">
          <div
            className="restaurant-name-group"
            onClick={() => onSelect(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item.id)}
          >
            <h3>{item.name}</h3>
            <p className="restaurant-sub">{item.category}</p>
          </div>
          <button
            type="button"
            className={`icon-button ${saved ? 'saved' : ''}`}
            onClick={() => onToggleSave(item.id)}
            aria-label={`${item.name} 찜 토글`}
          >
            {saved ? '♥' : '♡'}
          </button>
        </div>

        <div className="restaurant-stats">
          <span>{item.location}</span>
          <span>{item.eta}</span>
        </div>

        <p className="restaurant-menu-line">
          <span className="menu-label">대표</span>
          {item.featuredMenu}
          <span className="menu-price">{item.price}</span>
        </p>

        <div className="card-actions">
          <button type="button" className="button button-dark" onClick={() => onSelect(item.id)}>상세 정보</button>
          <button type="button" className="button button-soft" onClick={() => onOpenMap(item.id)}>지도</button>
        </div>
      </div>
    </article>
  )
}

function ApproximateMap({ items, selectedId, onSelect }) {
  const handlePinKeyDown = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(id)
    }
  }

  return (
    <div className="approx-map" aria-label="맛집 위치를 대략 표시한 지도">
      <svg viewBox="0 0 800 600" role="img" aria-labelledby="approx-map-title">
        <title id="approx-map-title">광안리와 남구 주변 맛집 대략 위치 지도</title>
        <rect width="800" height="600" fill="#17304f" />
        <path d="M 520 0 L 800 0 L 800 600 L 470 600 C 500 450 500 300 485 170 C 480 100 495 42 520 0 Z" fill="#256d93" />
        <path d="M 0 0 H 520 C 492 70 480 132 486 200 C 496 322 492 450 470 600 H 0 Z" fill="#27384f" />
        <path d="M 506 72 C 560 96 612 96 678 90 C 724 86 764 98 796 122" fill="none" stroke="#d7e7f6" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
        <path d="M 496 92 C 558 120 618 116 682 110 C 728 106 760 116 798 142" fill="none" stroke="#76a8c7" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 9" />
        <path d="M 86 0 V 600 M 214 0 V 520 M 346 0 V 488 M 458 0 V 438" stroke="#42546d" strokeWidth="3" />
        <path d="M 0 82 H 520 M 0 160 H 520 M 0 264 H 498 M 0 362 H 486 M 0 452 H 446" stroke="#42546d" strokeWidth="3" />
        <path d="M 482 78 C 492 168 488 290 480 448" fill="none" stroke="#5f8fbf" strokeWidth="4" strokeLinecap="round" />
        <text x="292" y="118" fill="#9db4d1" fontSize="22" fontWeight="800" textAnchor="middle">광안리</text>
        <text x="178" y="318" fill="#8199b7" fontSize="18" fontWeight="800" textAnchor="middle">남천동</text>
        <text x="206" y="514" fill="#8199b7" fontSize="18" fontWeight="800" textAnchor="middle">남구</text>
        <text x="652" y="74" fill="#b4d5e8" fontSize="16" fontWeight="800" textAnchor="middle">광안대교</text>
        {items.map((item) => {
          const pos = mapPinPositions[item.id]
          const active = selectedId === item.id
          return (
            <g
              key={item.id}
              className="map-svg-pin"
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => handlePinKeyDown(event, item.id)}
              tabIndex="0"
              role="button"
              aria-label={`${item.name} 선택`}
            >
              <circle cx={pos.x} cy={pos.y} r={active ? 26 : 19} fill={active ? '#0ea5e9' : '#111827'} stroke={active ? '#bae6fd' : '#74869d'} strokeWidth={active ? 5 : 2} />
              <text x={pos.x} y={pos.y + 7} textAnchor="middle" fontSize={active ? 18 : 14}>{item.icon}</text>
              {active && (
                <>
                  <rect x={pos.x - 62} y={pos.y - 64} width="124" height="30" rx="10" fill="#0ea5e9" />
                  <text x={pos.x} y={pos.y - 44} textAnchor="middle" fontSize="13" fontWeight="900" fill="white">{item.name}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>
      <div className="map-note">위치는 실제 좌표가 아닌 여행 동선 파악용 대략 표시입니다.</div>
    </div>
  )
}

function RealMap({ item }) {
  const query = item.mapQuery || `${item.name} ${item.address}`
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`

  return (
    <div className="real-map">
      <iframe
        title={`${item.name} 실제 지도`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="real-map-caption">
        <strong>{item.name}</strong>
      </div>
    </div>
  )
}

function ExperienceBadge({ label, value, good }) {
  return (
    <div className={`experience-badge ${good ? 'good' : ''}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function VideoSlot({ title, description, video }) {
  const hasVideo = Boolean(video?.src)

  return (
    <div className={`video-slot ${hasVideo ? 'has-video' : ''}`}>
      <div className="video-frame">
        {hasVideo ? (
          <video controls preload="metadata" poster={video.poster ? asset(video.poster) : ''}>
            <source src={asset(video.src)} type={video.type || 'video/mp4'} />
          </video>
        ) : (
          <div className="video-placeholder">
            <span>▶</span>
            <strong>영상 준비 중</strong>
          </div>
        )}
      </div>
      <div className="video-copy">
        <strong>{title}</strong>
        <p>{video?.description || description}</p>
        {!hasVideo && video?.suggestedPath && <small>{video.suggestedPath}</small>}
      </div>
    </div>
  )
}

function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave }) {
  const scrollRef = useRef(null)
  const [tip, setTip] = useState('')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    setTip('')
  }, [item.id])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby={`modal-title-${item.id}`}>
      <div className="modal-backdrop" onClick={onClose} />
      <section className="modal-panel" ref={scrollRef}>
        <button type="button" className="modal-close-button" onClick={onClose} aria-label="상세 정보 닫기">닫기</button>
        <div className={`modal-hero ${accentClassNames[item.accent]}`}>
          <div className="modal-top-actions">
            <button type="button" className="glass-button" onClick={() => onShare(item)}>공유</button>
            <button type="button" className="glass-button" onClick={() => onToggleSave(item.id)}>{saved ? '찜해제' : '찜하기'}</button>
          </div>
          <span className="modal-icon">{item.icon}</span>
          <p className="eyebrow">{item.location}</p>
          <h2 id={`modal-title-${item.id}`}>{item.name}</h2>
          <p className="modal-subtitle">{item.category}</p>
          <button type="button" className="hero-map-button" onClick={() => openMapLink(item.links.naver)}>지도 바로 열기</button>
        </div>

        <div className="modal-content">
          <section className="info-block standout">
            <p className="eyebrow dark">한 줄 소개</p>
            <h3>{item.hero}</h3>
            <p>{item.recommend}</p>
          </section>

          {item.photos?.length > 0 && (
            <section className="photo-panel">
              <div className="photo-panel-head">
                <p className="eyebrow dark">Food Photo</p>
                <h3>실제 음식 사진</h3>
              </div>
              <div className="photo-grid">
                {item.photos.map((photo) => (
                  <figure className="food-photo-card" key={photo.src}>
                    <img src={asset(photo.src)} alt={photo.alt} loading="lazy" />
                    <figcaption>{photo.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

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

          <section className="map-action-panel">
            <p className="eyebrow dark">지도 연결</p>
            <div className="link-grid">
              <button type="button" className="link-card naver" onClick={() => openMapLink(item.links.naver)}>현재 장소 네이버 지도 열기</button>
              <button type="button" className="link-card kakao" onClick={() => openMapLink(item.links.kakao)}>현재 장소 카카오맵 열기</button>
              <button type="button" className="link-card google" onClick={() => openMapLink(item.links.google)}>현재 장소 구글맵 열기</button>
              {item.links.reservation ? (
                <button type="button" className="link-card accent" onClick={() => openMapLink(item.links.reservation)}>예약 열기</button>
              ) : (
                <a className="link-card accent" href={`tel:${item.phone}`}>전화 문의</a>
              )}
            </div>
          </section>

          <section className="media-panel">
            <div className="media-panel-head">
              <p className="eyebrow dark">Video Preview</p>
              <h3>방문 전에 영상으로 먼저 확인하기</h3>
            </div>
            <div className="video-grid">
              <VideoSlot
                title="가게 내부 영상"
                description="좌석 간격, 분위기, 소음감, 창가 여부를 짧게 확인하는 영상 자리입니다."
                video={item.media?.interior}
              />
              <VideoSlot
                title="가게 찾아가는 영상"
                description="역/해변/주차장에서 입구까지 가는 동선을 보여주는 영상 자리입니다."
                video={item.media?.route}
              />
            </div>
          </section>

          {item.experience && (
            <section className="info-block">
              <p className="eyebrow dark">실제 방문 경험 데이터</p>
              <div className="experience-grid">
                <ExperienceBadge label="혼밥" value={item.experience.soloOk ? '가능' : '불가'} good={item.experience.soloOk} />
                <ExperienceBadge label="소음" value={item.experience.noise} good={item.experience.noise === '낮음'} />
                <ExperienceBadge label="분위기" value={item.experience.vibe} />
                <ExperienceBadge label="관광객" value={item.experience.touristRatio} />
                <ExperienceBadge label="음식 양" value={item.experience.portion} good={item.experience.portion === '많음'} />
                <ExperienceBadge label="맵기" value={item.experience.spicy} />
                <ExperienceBadge label="1인 주문" value={item.experience.singleOrder ? '가능' : '불가'} good={item.experience.singleOrder} />
                <ExperienceBadge label="내부 넓이" value={item.experience.interior} good={item.experience.interior === '넓음'} />
              </div>
              <dl className="experience-detail-list">
                <div>
                  <dt>대기시간</dt>
                  <dd>{item.experience.waitTime}</dd>
                </div>
                <div>
                  <dt>좌석 배치</dt>
                  <dd>{item.experience.seating}</dd>
                </div>
                <div>
                  <dt>창가 여부</dt>
                  <dd>{item.experience.window}</dd>
                </div>
              </dl>
            </section>
          )}

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

        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [selectedId, setSelectedId] = useState(null)
  const [mapSelectedId, setMapSelectedId] = useState(restaurants[0].id)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalledApp, setIsInstalledApp] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  })
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = window.localStorage.getItem('miri-hankki-saved')
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed)
        ? parsed.filter((id) => restaurants.some((item) => item.id === id))
        : []
    } catch {
      return []
    }
  })
  const [aiQuery, setAiQuery] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [showCopyMessage, setShowCopyMessage] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [rouletteItem, setRouletteItem] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    document.body.style.setProperty('--app-bg-mobile', `url("${asset('/busan-bg.png')}")`)
    document.body.style.setProperty('--app-bg-wide', `url("${asset('/busan-bg-wide.png')}")`)

    return () => {
      document.body.style.removeProperty('--app-bg-mobile')
      document.body.style.removeProperty('--app-bg-wide')
    }
  }, [])

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
    }

    function handleAppInstalled() {
      setInstallPrompt(null)
      setIsInstalledApp(true)
      setShowInstallGuide(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

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
      const categoryMatch =
        categoryFilter === '전체' || getCuisineCategory(item) === categoryFilter

      return categoryMatch
    })
  }, [categoryFilter])

  const homeSections = useMemo(() => {
    return cuisineCategories
      .filter((category) => category.id !== '전체')
      .map((category) => ({
        ...category,
        items: sortRestaurants(filteredRestaurants.filter((item) => getCuisineCategory(item) === category.id)),
      }))
      .filter((category) => category.items.length > 0)
  }, [filteredRestaurants])

  const sortedFilteredRestaurants = useMemo(
    () => sortRestaurants(filteredRestaurants),
    [filteredRestaurants],
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
    try {
      await copyToClipboard(item.links.naver)
      setShowCopyMessage(true)
      window.setTimeout(() => setShowCopyMessage(false), 1800)
    } catch {
      setShowCopyMessage(false)
    }
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
          <span className="brand-mark">
            <img src={asset('/app-icon-192.png')} alt="" aria-hidden="true" />
          </span>
          <span>
            <strong>부산 미리한끼</strong>
          </span>
        </button>
        <div className="topbar-actions">
          {!isInstalledApp && (
            <button className="app-install-button" onClick={handleInstallApp}>
              앱 설치
            </button>
          )}
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
        </div>
      </header>

      {showInstallGuide && !isInstalledApp && (
        <div className="install-guide card-surface">
          <button className="install-guide-close" onClick={() => setShowInstallGuide(false)} aria-label="설치 안내 닫기">닫기</button>
          <strong>홈 화면에 추가하면 앱처럼 실행돼요.</strong>
          <p>iPhone Safari는 공유 버튼에서 홈 화면에 추가를 선택하고, Android Chrome은 메뉴에서 앱 설치를 선택하세요.</p>
        </div>
      )}

      <main className="page-shell">
        {activeTab === 'home' && (
          <>
            <section className="category-home card-surface">
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

            {categoryFilter === '전체' ? (
              <section className="category-sections">
                {homeSections.map((section) => (
                  <section className="category-section" key={section.id}>
                    <div className="section-headline-row compact">
                      <div>
                        <h2>{section.label}</h2>
                      </div>
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
                    <h2>{categoryFilter}</h2>
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
                    <p>전체 카테고리로 돌아가면 모든 맛집을 다시 볼 수 있어요.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === 'map' && (
          <section className="map-layout">
            <aside className="map-sidebar card-surface">
              <div className="map-sidebar-head">
                <h2>{mapItem.name}</h2>
              </div>
              <div className="map-service-grid" aria-label="지도 앱 선택">
                <button type="button" className="map-service naver" onClick={() => openMapLink(mapItem.links.naver)}>네이버</button>
                <button type="button" className="map-service kakao" onClick={() => openMapLink(mapItem.links.kakao)}>카카오</button>
                <button type="button" className="map-service google" onClick={() => openMapLink(mapItem.links.google)}>구글</button>
              </div>
              <button className="button button-dark map-detail-button" onClick={() => setSelectedId(mapItem.id)}>상세 정보 보기</button>
              <div className="map-place-list">
                {restaurants.map((item) => (
                  <button
                    key={item.id}
                    className={`map-place-item ${mapSelectedId === item.id ? 'active' : ''}`}
                    onClick={() => setMapSelectedId(item.id)}
                  >
                    <span>{item.icon}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.location}</small>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <div className="map-frame card-surface">
              <RealMap item={mapItem} />
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
                  결과 상세 정보 보기
                </button>
              )}
            </div>
          </section>
        )}

        {activeTab === 'saved' && (
          <section className="saved-page">
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
