import React, { useEffect, useRef, useState } from 'react'
import { restaurants } from './data/restaurants'

const BASE = import.meta.env.BASE_URL
function asset(path) { return `${BASE}${path.replace(/^\//, '')}` }

/* ─── 상수 데이터 ──────────────────────────────────────── */
const RATINGS  = { 1:4.7, 2:4.8, 3:4.6, 4:4.7, 5:4.8, 6:4.5 }
const REVIEWS  = { 1:1234, 2:987,  3:753, 4:621, 5:2345,6:489  }
const HOURS    = { 1:'10:00~22:00',2:'18:00~24:00',3:'10:00~21:00',4:'09:00~21:00',5:'10:00~15:00',6:'11:30~21:00' }
const PARKING  = { 1:false,2:false,3:false,4:false,5:true,6:false }
const DISTANCE = { 1:'220m',2:'350m',3:'280m',4:'1.2km',5:'800m',6:'150m' }
const WALKTIME = { 1:'3분',2:'4분',3:'3분',4:'15분',5:'10분',6:'2분' }
const GROUP    = { 1:true,2:true,3:false,4:true,5:false,6:false }
const PARKING_N= { 5:'10대' }
const MENUS = {
  1:[{n:'돼지국밥',   desc:'진한 사골국물과 부드러운 고기', p:'9,000원'},
     {n:'수육백반',   desc:'수육 + 밥 + 반찬',            p:'11,000원'},
     {n:'고기 칼국수',desc:'쫄깃한 면과 진한 육수',       p:'11,000원'}],
  2:[{n:'한우웰링턴 코스',desc:'엄선된 한우 시그니처',   p:'65,000원'},
     {n:'파리지엔 뇨끼',  desc:'크림소스 뇨끼',          p:'24,000원'},
     {n:'치즈 플레이트',  desc:'와인 페어링 추천',        p:'18,000원'}],
  3:[{n:'에스프레소', desc:'싱글 오리진 원두',            p:'4,500원'},
     {n:'샤케라또',   desc:'진한 에스프레소 아이스',      p:'7,500원'},
     {n:'카푸치노',   desc:'부드러운 우유 거품',          p:'5,500원'}],
  4:[{n:'에그베네딕트',desc:'홀란다이즈 소스와 수란',     p:'18,000원'},
     {n:'팬케이크',   desc:'버터와 메이플시럽',           p:'15,000원'},
     {n:'파스타',     desc:'오늘의 파스타',               p:'16,000원'}],
  5:[{n:'돼지곰탕',   desc:'진한 뽀얀 사골 국물',        p:'9,000원'},
     {n:'고기 칼국수',desc:'직접 뽑은 쫄깃한 면발',      p:'11,000원'},
     {n:'삼겹구이',   desc:'두툼하게 썬 국내산',          p:'13,000원'}],
  6:[{n:'마파두부',   desc:'사천 마파두부',               p:'11,000원'},
     {n:'볶음밥',     desc:'향신료 볶음밥',               p:'9,000원'},
     {n:'우육면',     desc:'진한 소고기 국물 면',         p:'12,000원'}],
}
const ACCENT = { sunset:'ac-sunset',night:'ac-night',espresso:'ac-espresso',ocean:'ac-ocean',forest:'ac-forest',lime:'ac-lime' }
const NAV = [
  {id:'home',  label:'홈'},
  {id:'search',label:'검색'},
  {id:'map',   label:'지도'},
  {id:'saved', label:'저장'},
  {id:'my',    label:'마이'},
]
const MOODS = [
  {id:'혼밥',  label:'혼밥'},
  {id:'가성비',label:'가성비'},
  {id:'데이트',label:'데이트'},
  {id:'카페',  label:'카페'},
  {id:'야식',  label:'야식'},
  {id:'바다뷰',label:'바다뷰'},
]
const AREAS = [
  {name:'광안리',grad:'linear-gradient(160deg,#6FAED9 0%,#3A7BD5 100%)',filter:'광안리',count:'1,234개'},
  {name:'민락동',grad:'linear-gradient(160deg,#FF9A5C 0%,#FF6B35 100%)',filter:'광안리',count:'987개'},
  {name:'남천동',grad:'linear-gradient(160deg,#7DC88B 0%,#2E8B57 100%)',filter:'광안리',count:'1,102개'},
  {name:'대연동',grad:'linear-gradient(160deg,#A78BFA 0%,#7C3AED 100%)',filter:'남구',  count:'876개'},
  {name:'경성대',grad:'linear-gradient(160deg,#F59E0B 0%,#D97706 100%)',filter:'남구',  count:'765개'},
]
const EXAMPLES = [
  '광안리 근처에서 혼밥하기 좋은 곳 추천해줘',
  '비 오는 날 따뜻한 국물 먹고 싶어',
  '데이트하기 좋은 분위기 좋은 곳 알려줘',
  '가성비 좋은 점심 맛집 있어?',
  '바다 보이는 브런치 카페 어디야?',
]

/* ─── 유틸 ──────────────────────────────────────────────── */
function copyText(t) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t)
  const el = document.createElement('textarea')
  el.value = t; el.style.cssText = 'position:fixed;left:-9999px'
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
  return Promise.resolve()
}
function goMap(url) { window.location.href = url }

function scoreRestaurant(item, q) {
  const n = q.trim().toLowerCase()
  if (!n) return { score: 0 }
  let score = 0
  n.split(/\s+/).forEach(kw => {
    if (item.name.toLowerCase().includes(kw))     score += 6
    if (item.category.toLowerCase().includes(kw)) score += 4
    if (item.location.toLowerCase().includes(kw)) score += 3
    if (item.hero.toLowerCase().includes(kw))     score += 3
    if (item.tags.some(t => t.toLowerCase().includes(kw)))  score += 4
    if (item.mood.some(m => m.toLowerCase().includes(kw)))  score += 4
  })
  if (/데이트|기념일|무드|와인/.test(q)      && item.mood.includes('데이트'))   score += 8
  if (/브런치|오전|오션뷰|바다/.test(q)      && item.mood.includes('오션뷰'))   score += 8
  if (/혼밥|든든|국물|한식/.test(q)         && item.mood.includes('혼밥가능')) score += 8
  if (/커피|카페|디저트/.test(q)            && item.category.includes('카페')) score += 8
  if (/마라|얼큰|친구/.test(q)             && item.name === '푸안 광안점')      score += 8
  if (/혼밥/.test(q) && item.experience?.soloOk)                              score += 5
  if (/바다뷰|오션/.test(q) && item.mood.includes('오션뷰'))                    score += 8
  return { score }
}

function filterByMood(items, mood) {
  if (!mood) return items
  if (mood === '혼밥')   return items.filter(r => r.experience?.soloOk)
  if (mood === '가성비') return items.filter(r => r.price.includes('9,000') || r.price.includes('10,000') || r.price.includes('5,000') || r.price.includes('12,000'))
  if (mood === '데이트') return items.filter(r => r.mood.includes('데이트') || r.mood.includes('기념일'))
  if (mood === '카페')   return items.filter(r => r.category.includes('카페'))
  if (mood === '야식')   return items.filter(r => r.mood.includes('저녁모임') || r.mood.includes('캐주얼'))
  if (mood === '바다뷰') return items.filter(r => r.mood.includes('오션뷰') || r.mood.includes('브런치'))
  return items
}

function getTip(item) {
  const t = {
    1: '마라전골은 기본 단계로 시작한 뒤 가지튀김과 볶음밥을 이어서 주문하면 좋아요.',
    2: '해 질 무렵 방문하면 분위기가 가장 살아나요. 와인과 치즈 플레이트를 먼저 골라보세요.',
    3: '에스프레소와 샤케라또를 나눠 마시면 두 가지 매력을 비교해볼 수 있어요.',
    4: '창가 좌석 선호가 높으니 오픈 시간대 방문을 추천해요.',
    5: '맑은 국물 스타일을 먼저 보고, 든든하게 먹고 싶다면 고기 칼국수를 추가하세요.',
    6: '마파두부와 볶음밥을 함께 먹으면 향신료와 고소함의 균형이 완벽해요.',
  }
  return t[item.id] ?? '대표 메뉴 하나와 사이드를 조합해서 방문하면 이 집의 강점을 제대로 느낄 수 있어요.'
}

/* ─── 공통 컴포넌트 ─────────────────────────────────────── */
function Photo({ item, className = '', style = {} }) {
  if (item.photos?.[0]) return <img src={asset(item.photos[0].src)} alt={item.name} className={className} style={style} />
  return <div className={`ph-fallback ${ACCENT[item.accent]} ${className}`} style={style}><span>{item.icon}</span></div>
}

/* ─── 네비게이션 아이콘 ──────────────────────────────────── */
function NavIcon({ id, active }) {
  const c = active ? '#FF7F6A' : '#8E8E93'
  const w = active ? '2.2' : '1.8'
  const p = { width: '22', height: '22', viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (id === 'home')   return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (id === 'search') return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  if (id === 'map')    return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  if (id === 'saved')  return <svg {...p} fill={active ? '#FF7F6A' : 'none'}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
  if (id === 'my')     return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  return null
}

/* ─── 카테고리 아이콘 ────────────────────────────────────── */
function MoodIcon({ id, active }) {
  const c = active ? '#fff' : '#555'
  const p = { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (id === '혼밥')   return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  if (id === '가성비') return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
  if (id === '데이트') return <svg {...p} fill={active ? '#fff' : 'none'}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
  if (id === '카페')   return <svg {...p}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
  if (id === '야식')   return <svg {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
  if (id === '바다뷰') return <svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
  return null
}

/* ─── 피드 리스트 (재사용) ──────────────────────────────── */
function FeedList({ items, savedIds, onSelect, onToggleSave }) {
  return (
    <ul className="list-feed">
      {items.map(r => (
        <li key={r.id} className="feed-row" onClick={() => onSelect(r.id)}>
          <div className="feed-thumb"><Photo item={r} className="feed-img" /></div>
          <div className="feed-body">
            <strong className="feed-name">{r.name}</strong>
            <p className="feed-sub">{r.location} · {r.category}</p>
            <p className="feed-meta">
              <span className="feed-star">⭐ {RATINGS[r.id]}</span>
              <span className="feed-cnt"> ({REVIEWS[r.id].toLocaleString()}) · {DISTANCE[r.id]}</span>
            </p>
          </div>
          <button
            className={`feed-bm ${savedIds.includes(r.id) ? 'on' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleSave(r.id) }}
            aria-label="저장"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={savedIds.includes(r.id) ? '#FF7F6A' : 'none'}
              stroke={savedIds.includes(r.id) ? '#FF7F6A' : '#C7C7CC'}
              strokeWidth="2" strokeLinecap="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ─── 스플래시 ──────────────────────────────────────────── */
function Splash({ onArea, onAI }) {
  return (
    <div className="splash">
      <div className="splash-illus">
        <img src={asset('/busan-bg.svg')} alt="" className="splash-bg" />
      </div>
      <div className="splash-content">
        <div className="splash-logo-area">
          <div className="splash-icon-wrap">
            <img src={asset('/app-icon-192.png')} alt="" className="splash-app-icon" />
          </div>
          <h1 className="splash-title">
            <span>부산</span>
            <span className="sp-coral"> 미리한끼</span>
          </h1>
          <p className="splash-tagline">수영구·남구에서 만나는<br />우리동네 맛집 ❤️</p>
        </div>
        <div className="splash-btns">
          <button className="sp-btn sp-primary" onClick={() => onArea('광안리')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            수영구 맛집 찾기
          </button>
          <button className="sp-btn sp-secondary" onClick={() => onArea('남구')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            남구 맛집 찾기
          </button>
          <button className="sp-btn sp-ghost" onClick={onAI}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            AI 추천받기
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 홈 화면 ───────────────────────────────────────────── */
function HomeScreen({ savedIds, onToggleSave, onSelect, onGoSearch, initArea }) {
  const [mood, setMood] = useState(null)
  const [areaQ, setAreaQ] = useState(initArea || null)
  const source = areaQ ? restaurants.filter(r => r.location === areaQ) : restaurants
  const displayed = filterByMood(source, mood)

  return (
    <div className="screen home-screen">
      {/* 헤더 */}
      <header className="home-hdr">
        <button className="home-loc">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF7F6A" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>부산 수영구 · 남구</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          {areaQ && (
            <span className="loc-chip" onClick={e => { e.stopPropagation(); setAreaQ(null) }}>
              {areaQ} ✕
            </span>
          )}
        </button>
        <div className="hdr-acts">
          <button className="hdr-ic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
          <div className="hdr-avatar">🙂</div>
        </div>
      </header>

      {/* 검색창 */}
      <button className="home-search" onClick={onGoSearch}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span className="srch-ph">광안리, 남천동, 대연동 맛집 검색</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>

      {/* 오늘의 추천 한끼 */}
      <section className="hsec">
        <div className="hsec-hdr">
          <h2 className="hsec-title">오늘의 추천 한끼</h2>
          <button className="hsec-more" onClick={onGoSearch}>더보기</button>
        </div>
        <div className="rec-row">
          {restaurants.map(r => (
            <article key={r.id} className="rec-card" onClick={() => onSelect(r.id)}>
              <div className="rec-img-wrap">
                <Photo item={r} className="rec-img" />
                <button
                  className={`rec-bm ${savedIds.includes(r.id) ? 'on' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggleSave(r.id) }}
                  aria-label="저장"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24"
                    fill={savedIds.includes(r.id) ? '#FF7F6A' : 'none'}
                    stroke={savedIds.includes(r.id) ? '#FF7F6A' : 'white'}
                    strokeWidth="2.2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                  </svg>
                </button>
              </div>
              <div className="rec-info">
                <strong className="rec-name">{r.name.length > 9 ? r.name.slice(0, 9) + '…' : r.name}</strong>
                <p className="rec-rating">⭐ {RATINGS[r.id]} ({REVIEWS[r.id].toLocaleString()})</p>
                <p className="rec-dist">{DISTANCE[r.id]} · {r.location}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 카테고리 */}
      <section className="hsec cat-sec">
        <h2 className="hsec-title">카테고리</h2>
        <div className="mood-grid">
          {MOODS.map(m => (
            <button key={m.id} className={`mood-item ${mood === m.id ? 'on' : ''}`}
              onClick={() => setMood(mood === m.id ? null : m.id)}>
              <div className="mood-ic-circle">
                <MoodIcon id={m.id} active={mood === m.id} />
              </div>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 인기 지역 */}
      <section className="hsec">
        <div className="hsec-hdr">
          <h2 className="hsec-title">인기 지역</h2>
          <button className="hsec-more">더보기</button>
        </div>
        <div className="area-row">
          {AREAS.map(a => (
            <button key={a.name}
              className={`area-tile ${areaQ === a.filter ? 'active' : ''}`}
              style={{ background: a.grad }}
              onClick={() => setAreaQ(areaQ === a.filter ? null : a.filter)}
            >
              <span className="area-name">{a.name}</span>
              <span className="area-count">{a.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 지금 뜨는 맛집 */}
      <section className="hsec" style={{ paddingBottom: 0 }}>
        <div className="hsec-hdr">
          <h2 className="hsec-title">지금 뜨는 맛집</h2>
          {mood && <button className="hsec-more" onClick={() => setMood(null)}>전체 보기</button>}
        </div>
      </section>
      {displayed.length ? (
        <FeedList items={displayed} savedIds={savedIds} onSelect={onSelect} onToggleSave={onToggleSave} />
      ) : (
        <div className="empty-state">
          <p>😅 조건에 맞는 맛집이 없어요</p>
          <button onClick={() => { setMood(null); setAreaQ(null) }}>필터 초기화</button>
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  )
}

/* ─── AI 검색·채팅 ──────────────────────────────────────── */
function SearchScreen({ onSelect }) {
  const [msgs, setMsgs] = useState([{
    role: 'bot',
    text: '안녕하세요! 😊\n광안리 근처 가성비 좋은 맛집을\n추천해드릴게요!',
    cards: null,
  }])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  function send(q) {
    const text = q || input.trim()
    if (!text) return
    const ranked = restaurants.map(r => ({ r, ...scoreRestaurant(r, text) })).sort((a, b) => b.score - a.score)
    const top = ranked.slice(0, 3)
    setMsgs(prev => [...prev,
      { role: 'user', text },
      {
        role: 'bot',
        text: top[0].score > 0
          ? `"${text}"에 맞는 맛집을 찾았어요! 😊`
          : `광안리 근처 가성비 좋은 맛집을\n추천해드릴게요! 😊`,
        cards: top.map(x => x.r),
      },
    ])
    setInput('')
  }

  return (
    <div className="screen chat-screen">
      <header className="chat-hdr">
        <h2 className="chat-title">AI 추천</h2>
      </header>

      <div className="chat-body">
        {msgs.map((m, i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            <div className="msg-wrap">
              <div className="msg-bubble">
                {m.text.split('\n').map((line, j) => <p key={j}>{line}</p>)}
              </div>
              {m.cards && (
                <div className="chat-results">
                  {m.cards.map(r => (
                    <div key={r.id} className="cri" onClick={() => onSelect(r.id)}>
                      <div className="cri-img"><Photo item={r} className="cri-photo" /></div>
                      <div className="cri-body">
                        <strong className="cri-name">{r.name}</strong>
                        <p className="cri-meta">⭐ {RATINGS[r.id]} ({REVIEWS[r.id].toLocaleString()}) · {DISTANCE[r.id]}</p>
                        <p className="cri-loc">{r.location}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {msgs.length <= 1 && (
        <div className="examples-wrap">
          {EXAMPLES.map(ex => (
            <button key={ex} className="example-q" onClick={() => send(ex)}>{ex}</button>
          ))}
        </div>
      )}

      <div className="chat-bar">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="원하는 메뉴나 상황을 입력해보세요!"
        />
        <button className={`chat-send ${input.trim() ? 'active' : ''}`} onClick={() => send()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ─── 지도 화면 ─────────────────────────────────────────── */
function MapScreen({ mapId, setMapId, onSelect, savedIds, onToggleSave }) {
  const item = restaurants.find(r => r.id === mapId) ?? restaurants[0]
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent((item.mapQuery || item.name) + ' ' + item.address)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`

  return (
    <div className="screen map-screen">
      <header className="map-hdr">
        <h2>수영구·남구 맛집 지도</h2>
        <button className="map-filter-ic">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>
        </button>
      </header>
      <div className="map-chips">
        {['전체', '혼밥', '가성비', '카페', '야식', '바다뷰'].map(c => (
          <button key={c} className={`map-chip ${c === '전체' ? 'on' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="map-view">
        <iframe
          key={mapId}
          title={`${item.name} 지도`}
          src={mapSrc}
          className="map-iframe"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="map-sheet">
        <div className="sheet-grip" />
        <div className="map-sel-card" onClick={() => onSelect(item.id)}>
          <div className="map-sel-img-wrap"><Photo item={item} className="map-sel-img" /></div>
          <div className="map-sel-body">
            <strong className="map-sel-name">{item.name}</strong>
            <p className="map-sel-sub">⭐ {RATINGS[item.id]} ({REVIEWS[item.id].toLocaleString()}) · {DISTANCE[item.id]}</p>
            <p className="map-sel-loc">{item.location} {item.category}</p>
          </div>
          <button
            className={`map-sel-bm ${savedIds?.includes(item.id) ? 'on' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleSave?.(item.id) }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill={savedIds?.includes(item.id) ? '#FF7F6A' : 'none'}
              stroke={savedIds?.includes(item.id) ? '#FF7F6A' : '#C7C7CC'}
              strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>
        <div className="map-place-row">
          {restaurants.map(r => (
            <button key={r.id} className={`map-place-btn ${mapId === r.id ? 'on' : ''}`} onClick={() => setMapId(r.id)}>
              <div className="mpb-img"><Photo item={r} className="mpb-photo" /></div>
              <span>{r.name.slice(0, 4)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── 저장 화면 ─────────────────────────────────────────── */
function SavedScreen({ savedIds, recentIds, onToggleSave, onSelect }) {
  const [tab, setTab] = useState('saved')
  const savedItems = restaurants.filter(r => savedIds.includes(r.id))
  const recentItems = restaurants
    .filter(r => recentIds.includes(r.id))
    .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
  const items = tab === 'saved' ? savedItems : recentItems

  return (
    <div className="screen saved-screen">
      <header className="saved-hdr">
        <h2>저장한 맛집</h2>
      </header>
      <div className="saved-tabs">
        <button className={`s-tab ${tab === 'saved' ? 'on' : ''}`} onClick={() => setTab('saved')}>
          찜한 맛집
        </button>
        <button className={`s-tab ${tab === 'recent' ? 'on' : ''}`} onClick={() => setTab('recent')}>
          최근 본 맛집
        </button>
      </div>
      {items.length ? (
        <FeedList items={items} savedIds={savedIds} onSelect={onSelect} onToggleSave={onToggleSave} />
      ) : (
        <div className="empty-state big">
          <div className="empty-icon">{tab === 'saved' ? '🔖' : '👀'}</div>
          <p>{tab === 'saved' ? '아직 찜한 맛집이 없어요' : '최근 본 맛집이 없어요'}</p>
          <small>맛집 카드를 눌러 탐색해보세요</small>
        </div>
      )}
    </div>
  )
}

/* ─── 마이 화면 ─────────────────────────────────────────── */
function MyScreen({ savedIds, isInstalled, onInstall, showGuide, setShowGuide }) {
  const [pick, setPick] = useState(null)
  const [spinning, setSpinning] = useState(false)
  function spin() {
    if (spinning) return
    setSpinning(true)
    let n = 0
    const t = setInterval(() => {
      setPick(restaurants[Math.floor(Math.random() * restaurants.length)])
      if (++n >= 20) { clearInterval(t); setSpinning(false) }
    }, 90)
  }
  return (
    <div className="screen my-screen">
      <div className="my-profile">
        <div className="my-ava">🧑</div>
        <div>
          <strong>부산 미리한끼 유저</strong>
          <p>저장 {savedIds.length}곳</p>
        </div>
        <button className="my-edit-btn">편집</button>
      </div>
      {!isInstalled && (
        <div className="my-banner">
          <div>
            <strong>앱으로 설치하기</strong>
            <p>홈 화면에서 바로 실행해요</p>
          </div>
          <button className="install-btn" onClick={onInstall}>설치</button>
        </div>
      )}
      {showGuide && (
        <div className="install-guide">
          <button className="guide-close" onClick={() => setShowGuide(false)}>✕</button>
          <p>📱 iPhone: 공유 버튼 → 홈 화면에 추가</p>
          <p>🤖 Android: 메뉴 → 앱 설치</p>
        </div>
      )}
      <div className="my-card">
        <p className="my-sec-label">오늘 뭐 먹지?</p>
        <div className={`roulette-box ${spinning ? 'spin' : ''}`}>
          <span className="r-icon">{pick ? pick.icon : '🎰'}</span>
          {pick && <strong className="r-name">{pick.name}</strong>}
        </div>
        <button className="r-btn" onClick={spin} disabled={spinning}>
          {spinning ? '고르는 중…' : '🎲 룰렛 돌리기'}
        </button>
      </div>
      <div className="my-card" style={{ marginTop: 0 }}>
        <p className="my-sec-label">내 리스트</p>
        {[
          { ic: '🔖', label: '저장한 맛집', n: savedIds.length },
          { ic: '📍', label: '광안리 맛집', n: restaurants.filter(r => r.location === '광안리').length },
          { ic: '🍽️', label: '전체 등록 맛집', n: restaurants.length },
        ].map(l => (
          <div key={l.label} className="my-list-row">
            <span className="ml-ic">{l.ic}</span>
            <strong>{l.label}</strong>
            <span className="ml-n">{l.n}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
      <p className="my-version">부산 미리한끼 v2.0 · 광안리·남구 로컬 큐레이션</p>
    </div>
  )
}

/* ─── 상세 모달 ─────────────────────────────────────────── */
function DetailModal({ item, onClose, onShare, saved, onToggleSave }) {
  const scrollRef = useRef(null)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [tip, setTip] = useState('')
  const [liked, setLiked] = useState(saved)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    setTip('')
    setLiked(saved)
    setPhotoIdx(0)
  }, [item.id, saved])

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const rating  = RATINGS[item.id] || 4.5
  const reviews = REVIEWS[item.id] || 500
  const hours   = HOURS[item.id] || '정보 없음'
  const parking = PARKING[item.id]
  const dist    = DISTANCE[item.id] || '근처'
  const wtime   = WALKTIME[item.id] || '5분'
  const group   = GROUP[item.id]
  const parkN   = PARKING_N[item.id] || ''
  const menus   = MENUS[item.id] || []
  const photos  = item.photos || []

  function handleSave() { setLiked(!liked); onToggleSave(item.id) }

  const locLabel = item.location === '광안리' || item.location === '민락동' || item.location === '남천동'
    ? `수영구 · ${item.location}` : `남구 · ${item.location}`

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <div className="modal-back" onClick={onClose} />
      <div className="modal-card" ref={scrollRef}>

        {/* 사진 헤더 */}
        <div className="mc-photo-wrap">
          {photos.length > 0
            ? <img src={asset(photos[photoIdx]?.src || photos[0].src)} alt={item.name} className="mc-photo" />
            : <div className={`mc-photo-ph ${ACCENT[item.accent]}`}><span style={{ fontSize: 64 }}>{item.icon}</span></div>
          }
          {photos.length > 1 && (
            <div className="mc-photo-counter">{photoIdx + 1} / {photos.length}</div>
          )}
          <div className="mc-photo-acts">
            <button className="mc-ico-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="mc-ico-btn" onClick={() => onShare(item)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
              <button className="mc-ico-btn" onClick={handleSave}>
                <svg width="18" height="18" viewBox="0 0 24 24"
                  fill={liked ? '#FF7F6A' : 'none'}
                  stroke={liked ? '#FF7F6A' : 'white'}
                  strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
              </button>
            </div>
          </div>
          {photos.length > 1 && (
            <div className="mc-photo-dots">
              {photos.map((_, i) => (
                <button key={i} className={`photo-dot ${i === photoIdx ? 'on' : ''}`} onClick={() => setPhotoIdx(i)} />
              ))}
            </div>
          )}
        </div>

        {/* 흰 시트 */}
        <div className="mc-sheet">
          <div className="mc-grip" />

          <h2 className="mc-name">{item.name}</h2>
          <p className="mc-loc-label">{locLabel}</p>

          <div className="mc-rating-row">
            <span className="mc-star">⭐</span>
            <strong className="mc-rat">{rating}</strong>
            <span className="mc-rev-cnt">({reviews.toLocaleString()}) · 리뷰 {reviews.toLocaleString()}개</span>
          </div>

          {/* 4-col 정보 그리드 */}
          <div className="mc-info-grid">
            <div className="mc-info-cell">
              <div className="mc-info-ic sea">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span className="mc-iv">{dist}</span>
              <span className="mc-il">도보 {wtime}</span>
            </div>
            <div className="mc-info-cell">
              <div className="mc-info-ic sea">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <span className="mc-iv" style={{ fontSize: 10 }}>{hours}</span>
              <span className="mc-il">연중무휴</span>
            </div>
            <div className="mc-info-cell">
              <div className={`mc-info-ic ${parking ? 'green' : 'gray'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>
              </div>
              <span className="mc-iv">{parking ? '가능' : '불가'}</span>
              <span className="mc-il">주차 {parking ? (parkN || '가능') : '불가'}</span>
            </div>
            <div className="mc-info-cell">
              <div className={`mc-info-ic ${group ? 'green' : 'gray'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <span className="mc-iv">{group ? '가능' : '소규모'}</span>
              <span className="mc-il">단체</span>
            </div>
          </div>

          {/* 한 줄 소개 */}
          <p className="mc-hero">{item.hero}</p>

          {/* 대표 메뉴 */}
          <div className="mc-section">
            <h3>대표 메뉴</h3>
            <div className="mc-menus">
              {menus.map(m => (
                <div key={m.n} className="mc-menu-row">
                  <div className="mc-menu-thumb"><Photo item={item} className="mc-menu-img" /></div>
                  <div className="mc-menu-body">
                    <strong>{m.n}</strong>
                    <small>{m.desc}</small>
                  </div>
                  <span className="mc-menu-p">{m.p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 저장 / 길찾기 */}
          <div className="mc-actions">
            <button className={`mc-act-save ${liked ? 'on' : ''}`} onClick={handleSave}>
              {liked ? '저장됨' : '저장하기'}
            </button>
            <button className="mc-act-dir" onClick={() => goMap(item.links.naver)}>
              길찾기
            </button>
          </div>

          {/* 방문 경험 */}
          {item.experience && (
            <div className="mc-section">
              <h3>방문 경험</h3>
              <div className="mc-exp-grid">
                {[
                  { l: '혼밥', v: item.experience.soloOk ? '가능' : '불가', g: item.experience.soloOk },
                  { l: '소음', v: item.experience.noise, g: item.experience.noise === '낮음' },
                  { l: '분위기', v: item.experience.vibe, g: true },
                  { l: '음식 양', v: item.experience.portion, g: item.experience.portion === '많음' },
                ].map(b => (
                  <div key={b.l} className={`exp-badge ${b.g ? 'ok' : ''}`}>
                    <small>{b.l}</small><strong>{b.v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 에디터 포인트 */}
          <div className="mc-section">
            <h3>에디터 포인트</h3>
            <ul className="mc-points">
              {item.points.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>

          {/* 방문 팁 */}
          <div className="mc-section mc-tip-box">
            <div className="mc-tip-hdr">
              <h3>방문 팁</h3>
              <button className="mc-tip-btn" onClick={() => setTip(getTip(item))}>💡 팁 보기</button>
            </div>
            <p>{tip || '버튼을 눌러 이 장소를 더 잘 즐기는 방법을 확인하세요.'}</p>
          </div>

          {/* 지도 */}
          <div className="mc-section">
            <h3>지도 열기</h3>
            <div className="mc-map-btns">
              <button className="mc-map-btn naver" onClick={() => goMap(item.links.naver)}>네이버</button>
              <button className="mc-map-btn kakao" onClick={() => goMap(item.links.kakao)}>카카오</button>
              <button className="mc-map-btn google" onClick={() => goMap(item.links.google)}>구글</button>
              {item.links.reservation
                ? <button className="mc-map-btn reservation" onClick={() => goMap(item.links.reservation)}>예약</button>
                : <a className="mc-map-btn phone" href={`tel:${item.phone}`}>전화</a>
              }
            </div>
          </div>

          {/* 근처 */}
          <div className="mc-section">
            <h3>근처에서 함께 가볼 곳</h3>
            <div className="mc-nearby">
              {item.nearbyExternal.map(n => (
                <a key={n.name} className="nearby-item" href={n.link} target="_blank" rel="noreferrer">
                  <span className="nearby-ic">{n.icon}</span>
                  <div><strong>{n.name}</strong><small>{n.category}</small></div>
                </a>
              ))}
            </div>
          </div>
          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  )
}

/* ─── 메인 앱 ────────────────────────────────────────────── */
export default function App() {
  const [splash, setSplash]         = useState(true)
  const [initArea, setInitArea]     = useState(null)
  const [tab, setTab]               = useState('home')
  const [selectedId, setSelectedId] = useState(null)
  const [mapId, setMapId]           = useState(restaurants[0].id)
  const [savedIds, setSavedIds]     = useState(() => {
    try {
      const s = localStorage.getItem('miri-hankki-saved')
      const p = s ? JSON.parse(s) : []
      return Array.isArray(p) ? p.filter(id => restaurants.some(r => r.id === id)) : []
    } catch { return [] }
  })
  const [recentIds, setRecentIds]   = useState([])
  const [deferredPrompt, setDP]     = useState(null)
  const [isInstalled, setInstalled] = useState(
    () => window.matchMedia('(display-mode:standalone)').matches || window.navigator.standalone === true
  )
  const [showGuide, setShowGuide]   = useState(false)
  const [toast, setToast]           = useState(null)

  useEffect(() => {
    const bp = e => { e.preventDefault(); setDP(e) }
    const ai = () => { setDP(null); setInstalled(true); setShowGuide(false) }
    window.addEventListener('beforeinstallprompt', bp)
    window.addEventListener('appinstalled', ai)
    return () => { window.removeEventListener('beforeinstallprompt', bp); window.removeEventListener('appinstalled', ai) }
  }, [])

  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId])

  useEffect(() => { localStorage.setItem('miri-hankki-saved', JSON.stringify(savedIds)) }, [savedIds])

  function toggleSave(id) { setSavedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  function handleSelect(id) {
    setRecentIds(prev => [id, ...prev.filter(x => x !== id)].slice(0, 20))
    setSelectedId(id)
  }

  async function handleShare(item) {
    try { await copyText(item.links.naver); showToast('📋 링크를 복사했어요') } catch {}
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000) }

  async function handleInstall() {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; setDP(null); return }
    setShowGuide(true)
  }

  const selectedItem = restaurants.find(r => r.id === selectedId) ?? null

  if (splash) return (
    <div className="app-wrap">
      <div className="app-frame">
        <Splash
          onArea={area => { setInitArea(area); setSplash(false) }}
          onAI={() => { setSplash(false); setTab('search') }}
        />
      </div>
    </div>
  )

  return (
    <div className="app-wrap">
      <div className="app-frame">
        <main className="app-main">
          {tab === 'home'   && <HomeScreen   savedIds={savedIds} onToggleSave={toggleSave} onSelect={handleSelect} onGoSearch={() => setTab('search')} initArea={initArea} />}
          {tab === 'search' && <SearchScreen onSelect={handleSelect} />}
          {tab === 'map'    && <MapScreen    mapId={mapId} setMapId={setMapId} onSelect={handleSelect} savedIds={savedIds} onToggleSave={toggleSave} />}
          {tab === 'saved'  && <SavedScreen  savedIds={savedIds} recentIds={recentIds} onToggleSave={toggleSave} onSelect={handleSelect} />}
          {tab === 'my'     && <MyScreen     savedIds={savedIds} isInstalled={isInstalled} onInstall={handleInstall} showGuide={showGuide} setShowGuide={setShowGuide} />}
        </main>

        <nav className="bnav">
          {NAV.map(n => (
            <button key={n.id} className={`bnav-btn ${tab === n.id ? 'on' : ''}`} onClick={() => setTab(n.id)}>
              <NavIcon id={n.id} active={tab === n.id} />
              <small>{n.label}</small>
            </button>
          ))}
        </nav>

        {toast && <div className="toast">{toast}</div>}

        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onShare={handleShare}
            saved={savedIds.includes(selectedItem.id)}
            onToggleSave={toggleSave}
          />
        )}
      </div>
    </div>
  )
}
