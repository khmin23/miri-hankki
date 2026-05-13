import React, { useEffect, useRef, useState } from 'react'
import { restaurants } from './data/restaurants'

const BASE = import.meta.env.BASE_URL
function asset(path) { return `${BASE}${path.replace(/^\//, '')}` }

/* ─── 부가 데이터 ─────────────────────────────────────── */
const RATINGS  = { 1:4.7, 2:4.8, 3:4.6, 4:4.7, 5:4.8, 6:4.5 }
const REVIEWS  = { 1:1234, 2:987, 3:753, 4:621, 5:2345, 6:489 }
const HOURS    = { 1:'17:00–01:00', 2:'18:00–24:00', 3:'10:00–21:00', 4:'09:00–21:00', 5:'10:00–15:00', 6:'11:30–21:00' }
const PARKING  = { 1:false, 2:false, 3:false, 4:false, 5:true, 6:false }
const MENUS = {
  1:[{n:'마라전골',p:'18,000원'},{n:'가지튀김',p:'7,000원'},{n:'계란볶음밥',p:'5,000원'}],
  2:[{n:'한우웰링턴 코스',p:'65,000원'},{n:'파리지엔 뇨끼',p:'24,000원'},{n:'치즈 플레이트',p:'18,000원'}],
  3:[{n:'에스프레소',p:'4,500원'},{n:'샤케라또',p:'7,500원'},{n:'카푸치노',p:'5,500원'}],
  4:[{n:'에그베네딕트',p:'18,000원'},{n:'팬케이크',p:'15,000원'},{n:'파스타',p:'16,000원'}],
  5:[{n:'돼지곰탕',p:'9,000원'},{n:'고기 칼국수',p:'11,000원'},{n:'삼겹구이',p:'13,000원'}],
  6:[{n:'마파두부',p:'11,000원'},{n:'볶음밥',p:'9,000원'},{n:'우육면',p:'12,000원'}],
}

const ACCENT = { sunset:'ac-sunset', night:'ac-night', espresso:'ac-espresso', ocean:'ac-ocean', forest:'ac-forest', lime:'ac-lime' }

const MAP_POS = { 1:{x:388,y:136}, 2:{x:438,y:152}, 3:{x:304,y:232}, 4:{x:350,y:184}, 5:{x:202,y:488}, 6:{x:272,y:202} }

const NAV = [
  {id:'home',  label:'홈',   icon:'⌂'},
  {id:'search',label:'검색', icon:'⊙'},
  {id:'map',   label:'지도', icon:'◎'},
  {id:'saved', label:'저장', icon:'♡'},
  {id:'my',    label:'마이', icon:'☺'},
]

const MOODS = [
  {id:'전체',  label:'전체',  icon:'🍽️'},
  {id:'혼밥',  label:'혼밥',  icon:'🍚'},
  {id:'가성비',label:'가성비',icon:'💰'},
  {id:'데이트',label:'데이트',icon:'❤️'},
  {id:'카페',  label:'카페',  icon:'☕'},
  {id:'야식',  label:'야식',  icon:'🌙'},
  {id:'바다뷰',label:'바다뷰',icon:'🌊'},
]

const AREAS = [
  {name:'광안리',  emoji:'🌊', grad:'linear-gradient(145deg,#6FAED9,#3A7BD5)', filter:'광안리'},
  {name:'민락동',  emoji:'🌅', grad:'linear-gradient(145deg,#FF9A5C,#FF6B35)', filter:'광안리'},
  {name:'남천동',  emoji:'🌿', grad:'linear-gradient(145deg,#7DC88B,#2E8B57)', filter:'광안리'},
  {name:'대연동',  emoji:'🏙️', grad:'linear-gradient(145deg,#A78BFA,#7C3AED)', filter:'남구'},
  {name:'경성대',  emoji:'☕', grad:'linear-gradient(145deg,#F59E0B,#D97706)', filter:'남구'},
]

/* ─── 유틸리티 ────────────────────────────────────────── */
function scoreRestaurant(item, q) {
  const n = q.trim().toLowerCase()
  if (!n) return { score:0, reason:'질문을 입력해주세요.' }
  let score = 0
  n.split(/\s+/).forEach(kw => {
    if (item.name.toLowerCase().includes(kw))     score += 6
    if (item.category.toLowerCase().includes(kw)) score += 4
    if (item.location.toLowerCase().includes(kw)) score += 3
    if (item.hero.toLowerCase().includes(kw))     score += 3
    if (item.tags.some(t=>t.toLowerCase().includes(kw)))  score += 4
    if (item.mood.some(m=>m.toLowerCase().includes(kw)))  score += 4
  })
  if (/데이트|기념일|무드|와인/.test(q)      && item.mood.includes('데이트'))   score += 8
  if (/브런치|오전|오션뷰|바다/.test(q)      && item.mood.includes('오션뷰'))   score += 8
  if (/혼밥|든든|국물|한식/.test(q)         && item.mood.includes('혼밥가능')) score += 8
  if (/커피|카페|디저트/.test(q)            && item.category.includes('카페')) score += 8
  if (/마라|얼큰|친구/.test(q)             && item.name==='푸안 광안점')       score += 8
  if (/혼밥/.test(q) && item.experience?.soloOk)   score += 5
  if (/바다뷰|오션/.test(q) && item.mood.includes('오션뷰')) score += 8
  return {
    score,
    reason: `${item.location} · ${item.category}이고, ${item.recommend.replace('추천','딱 맞아요')}.`,
  }
}

function getTip(item) {
  const t = {
    1:'마라전골은 기본 단계로 시작한 뒤 가지튀김과 볶음밥을 이어서 주문하면 좋아요.',
    2:'해 질 무렵 방문하면 분위기가 가장 살아나요. 와인과 치즈 플레이트를 먼저 골라보세요.',
    3:'에스프레소와 샤케라또를 나눠 마시면 두 가지 매력을 비교해볼 수 있어요.',
    4:'창가 좌석 선호가 높으니 오픈 시간대 방문을 추천해요.',
    5:'맑은 국물 스타일을 먼저 보고, 든든하게 먹고 싶다면 고기 칼국수를 추가하세요.',
    6:'마파두부와 볶음밥을 함께 먹으면 향신료와 고소함의 균형이 완벽해요.',
  }
  return t[item.id] ?? '대표 메뉴 하나와 사이드를 조합해서 방문하면 이 집의 강점을 제대로 느낄 수 있어요.'
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;left:-9999px'
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
  return Promise.resolve()
}

function goMap(url) { window.location.href = url }

function filterByMood(items, mood) {
  if (mood === '전체')   return items
  if (mood === '혼밥')   return items.filter(r => r.experience?.soloOk)
  if (mood === '가성비') return items.filter(r => r.price.includes('9,000')||r.price.includes('10,000')||r.price.includes('5,000')||r.price.includes('12,000')||r.price.includes('15,000'))
  if (mood === '데이트') return items.filter(r => r.mood.includes('데이트')||r.mood.includes('기념일'))
  if (mood === '카페')   return items.filter(r => r.category.includes('카페'))
  if (mood === '야식')   return items.filter(r => r.mood.includes('저녁모임')||r.mood.includes('캐주얼'))
  if (mood === '바다뷰') return items.filter(r => r.mood.includes('오션뷰')||r.mood.includes('브런치'))
  return items
}

/* ─── 공통 컴포넌트 ────────────────────────────────────── */
function Photo({ item, className='', style={} }) {
  if (item.photos?.[0]) return <img src={asset(item.photos[0].src)} alt={item.name} className={className} style={style} />
  return <div className={`ph-fallback ${ACCENT[item.accent]} ${className}`} style={style}><span>{item.icon}</span></div>
}

/* ─── 스플래시 ─────────────────────────────────────────── */
function Splash({ onArea, onAI }) {
  return (
    <div className="splash">
      <div className="splash-scene">
        <img src={asset('/busan-bg.svg')} alt="" className="splash-bg-img" />
      </div>
      <div className="splash-veil" />
      <div className="splash-stage">
        <div className="splash-hero">
          <img src={asset('/app-icon-192.png')} alt="" className="splash-app-icon" />
          <h1 className="splash-h1">
            <span>부산</span>
            <span className="splash-accent">미리한끼</span>
          </h1>
          <p className="splash-tagline">수영구·남구 로컬 맛집 큐레이션 ✦</p>
        </div>
        <div className="splash-cta">
          <div className="splash-area-row">
            <button className="cta-area" onClick={() => onArea('광안리')}>
              <span>🌊</span><span>수영구 맛집</span>
            </button>
            <button className="cta-area outline" onClick={() => onArea('남구')}>
              <span>🌴</span><span>남구 맛집</span>
            </button>
          </div>
          <button className="cta-ai" onClick={onAI}>
            <span>✨</span><span>AI 추천받기</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 홈 화면 ──────────────────────────────────────────── */
function HomeScreen({ savedIds, onToggleSave, onSelect, onGoSearch, initArea }) {
  const [mood, setMood] = useState('전체')
  const [areaQ, setAreaQ] = useState(initArea || null)

  const displayed = filterByMood(
    areaQ ? restaurants.filter(r => r.location === areaQ) : restaurants,
    mood,
  )

  return (
    <div className="screen home-screen">
      {/* 헤더 */}
      <header className="home-hdr">
        <div className="home-loc">
          <span className="loc-pin">📍</span>
          <span className="loc-txt">부산 수영구 · 남구</span>
          {areaQ && <button className="loc-clear" onClick={() => setAreaQ(null)}>✕ {areaQ}</button>}
        </div>
        <div className="hdr-icons">
          <button className="hdr-icon">🔔</button>
          <button className="hdr-icon">🙂</button>
        </div>
      </header>

      {/* 검색창 */}
      <button className="home-search" onClick={onGoSearch}>
        <span className="srch-ic">🔍</span>
        <span className="srch-ph">광안리, 남천동, 대연동 맛집 검색</span>
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
                <div className="rec-gradient" />
                <button
                  className={`rec-heart ${savedIds.includes(r.id)?'on':''}`}
                  onClick={e=>{e.stopPropagation(); onToggleSave(r.id)}}
                >
                  {savedIds.includes(r.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="rec-info">
                <p className="rec-loc">📍 {r.location}</p>
                <strong className="rec-name">{r.name.length>9?r.name.slice(0,9)+'…':r.name}</strong>
                <p className="rec-meta">⭐ {RATINGS[r.id]}  ·  {r.eta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 카테고리 */}
      <div className="mood-row">
        {MOODS.map(m => (
          <button key={m.id} className={`mood-pill ${mood===m.id?'on':''}`} onClick={() => setMood(m.id)}>
            <span>{m.icon}</span><span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* 인기 지역 */}
      <section className="hsec">
        <div className="hsec-hdr"><h2 className="hsec-title">인기 지역</h2></div>
        <div className="area-row">
          {AREAS.map(a => (
            <button key={a.name}
              className={`area-tile ${areaQ===a.filter?'active':''}`}
              style={{background: a.grad}}
              onClick={() => setAreaQ(areaQ===a.filter ? null : a.filter)}
            >
              <span className="area-emoji">{a.emoji}</span>
              <span className="area-name">{a.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 지금 뜨는 맛집 */}
      <section className="hsec" style={{paddingBottom:8}}>
        <div className="hsec-hdr">
          <h2 className="hsec-title">지금 뜨는 맛집</h2>
          {mood!=='전체' && <button className="hsec-more" onClick={()=>setMood('전체')}>전체 보기</button>}
        </div>
        {displayed.length ? (
          <ul className="list-feed">
            {displayed.map(r => (
              <li key={r.id} className="feed-row" onClick={() => onSelect(r.id)}>
                <div className="feed-thumb"><Photo item={r} className="feed-img" /></div>
                <div className="feed-body">
                  <strong className="feed-name">{r.name}</strong>
                  <p className="feed-sub">{r.category}</p>
                  <p className="feed-meta">
                    <span className="feed-stars">⭐ {RATINGS[r.id]}</span>
                    <span> · {r.eta} · {r.location}</span>
                  </p>
                </div>
                <button className={`feed-heart ${savedIds.includes(r.id)?'on':''}`}
                  onClick={e=>{e.stopPropagation(); onToggleSave(r.id)}}
                >{savedIds.includes(r.id)?'❤️':'🤍'}</button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>😅 조건에 맞는 맛집이 없어요</p>
            <button onClick={() => { setMood('전체'); setAreaQ(null) }}>필터 초기화</button>
          </div>
        )}
      </section>

      <div style={{height:24}} />
    </div>
  )
}

/* ─── AI 검색 / 채팅 화면 ──────────────────────────────── */
const EXAMPLES = [
  '광안리 근처에서 혼밥하기 좋은 곳 추천해줘',
  '비 오는 날 따뜻한 국물 먹고 싶어 🍜',
  '데이트하기 좋은 분위기 좋은 곳 알려줘',
  '가성비 좋은 점심 맛집 있어?',
  '바다 보이는 브런치 카페 어디야?',
]

function ChatBotIcon() {
  return (
    <div className="bot-avatar">🤖</div>
  )
}

function SearchScreen({ savedIds, onToggleSave, onSelect }) {
  const [msgs, setMsgs] = useState([
    { role:'bot', text:'안녕하세요! 😊 광안리·남구 로컬 맛집을 추천해드릴게요.\n어떤 걸 찾으세요?', cards:null }
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])

  function send(q) {
    const text = q || input.trim()
    if (!text) return
    const userMsg = { role:'user', text }
    const ranked = restaurants
      .map(r => ({r, ...scoreRestaurant(r, text)}))
      .sort((a,b) => b.score-a.score)
    const top = ranked.slice(0,3)
    const botMsg = {
      role:'bot',
      text: top[0].score > 0
        ? `"${text}"에 맞는 맛집을 찾았어요! 🎯`
        : `딱 맞는 곳을 고르기 어렵지만, 광안리에서 가장 인기 있는 곳들을 보여드릴게요.`,
      cards: top.map(x=>x.r),
      reason: top[0].score > 0 ? top[0].reason : '',
    }
    setMsgs(prev => [...prev, userMsg, botMsg])
    setInput('')
  }

  return (
    <div className="screen chat-screen">
      <header className="chat-hdr">
        <div className="chat-hdr-inner">
          <ChatBotIcon />
          <div>
            <strong>미리한끼 AI</strong>
            <p className="chat-status">● 온라인</p>
          </div>
        </div>
      </header>

      <div className="chat-body">
        {msgs.map((m,i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            {m.role==='bot' && <ChatBotIcon />}
            <div className="msg-wrap">
              <div className="msg-bubble">
                {m.text.split('\n').map((line,j) => <p key={j} style={{margin:0}}>{line}</p>)}
              </div>
              {m.reason && <p className="msg-reason">{m.reason}</p>}
              {m.cards && (
                <div className="chat-cards">
                  {m.cards.map(r => (
                    <article key={r.id} className="chat-card" onClick={() => onSelect(r.id)}>
                      <div className="chat-card-img-wrap">
                        <Photo item={r} className="chat-card-img" />
                        <div className="chat-card-grad" />
                      </div>
                      <div className="chat-card-body">
                        <p className="chat-card-loc">📍 {r.location}</p>
                        <strong className="chat-card-name">{r.name.length>9?r.name.slice(0,9)+'…':r.name}</strong>
                        <p className="chat-card-meta">⭐ {RATINGS[r.id]}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* 예시 질문 */}
      {msgs.length <= 1 && (
        <div className="examples-area">
          <p className="examples-label">이런 질문을 해보세요</p>
          <div className="examples-list">
            {EXAMPLES.map(ex => (
              <button key={ex} className="example-q" onClick={() => send(ex)}>{ex}</button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()}
          placeholder="광안리 맛집 추천해줘..."
        />
        <button className={`chat-send ${input.trim()?'active':''}`} onClick={() => send()}>
          ↑
        </button>
      </div>
    </div>
  )
}

/* ─── 지도 화면 ─────────────────────────────────────────── */
function MapScreen({ mapId, setMapId, onSelect }) {
  const item = restaurants.find(r=>r.id===mapId) ?? restaurants[0]
  const [showReal, setShowReal] = useState(false)

  return (
    <div className="screen map-screen">
      {/* 필터 */}
      <div className="map-chips">
        {['전체','한식','카페','양식','아시안'].map(c => (
          <button key={c} className={`map-chip ${c==='전체'?'on':''}`}>{c}</button>
        ))}
      </div>

      {/* 지도 */}
      <div className="map-view">
        {showReal ? (
          <>
            <iframe
              title={`${item.name} 지도`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(item.mapQuery||item.name+' '+item.address)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`}
              className="map-iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <button className="map-back-btn" onClick={() => setShowReal(false)}>← 목록</button>
          </>
        ) : (
          <>
            <svg viewBox="0 0 800 600" className="map-svg">
              <rect width="800" height="600" fill="#17304f" />
              <path d="M 520 0 L 800 0 L 800 600 L 470 600 C 500 450 500 300 485 170 C 480 100 495 42 520 0 Z" fill="#256d93" />
              <path d="M 0 0 H 520 C 492 70 480 132 486 200 C 496 322 492 450 470 600 H 0 Z" fill="#27384f" />
              <path d="M 506 72 C 560 96 612 96 678 90 C 724 86 764 98 796 122" fill="none" stroke="#d7e7f6" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
              <path d="M 86 0 V 600 M 214 0 V 520 M 346 0 V 488 M 458 0 V 438" stroke="#42546d" strokeWidth="2" opacity="0.5" />
              <path d="M 0 82 H 520 M 0 160 H 520 M 0 264 H 498 M 0 362 H 486" stroke="#42546d" strokeWidth="2" opacity="0.5" />
              <text x="292" y="118" fill="#9db4d1" fontSize="20" fontWeight="800" textAnchor="middle">광안리</text>
              <text x="178" y="318" fill="#8199b7" fontSize="16" fontWeight="700" textAnchor="middle">남천동</text>
              <text x="652" y="74" fill="#b4d5e8" fontSize="14" fontWeight="700" textAnchor="middle">광안대교</text>
              {restaurants.map(r => {
                const p = MAP_POS[r.id]
                const active = mapId===r.id
                return (
                  <g key={r.id} onClick={() => setMapId(r.id)} style={{cursor:'pointer'}} tabIndex={0}
                     onKeyDown={e=>(e.key==='Enter')&&setMapId(r.id)}>
                    <circle cx={p.x} cy={p.y} r={active?28:20} fill={active?'#FF7F6A':'#fff'} stroke={active?'#ffd4cd':'rgba(255,255,255,0.4)'} strokeWidth={active?5:2} />
                    <text x={p.x} y={p.y+7} textAnchor="middle" fontSize={active?17:14}>{r.icon}</text>
                    {active && (
                      <>
                        <rect x={p.x-55} y={p.y-60} width="110" height="28" rx="8" fill="#FF7F6A" />
                        <text x={p.x} y={p.y-41} textAnchor="middle" fontSize="12" fontWeight="800" fill="white">{r.name}</text>
                      </>
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="map-hint">위치는 대략적인 동선 표시입니다</div>
          </>
        )}
      </div>

      {/* 하단 시트 */}
      <div className="map-sheet">
        <div className="sheet-grip" />
        {/* 선택된 맛집 카드 */}
        <div className="map-selected" onClick={() => onSelect(item.id)}>
          <div className="map-sel-thumb"><Photo item={item} className="map-sel-img" /></div>
          <div className="map-sel-info">
            <strong>{item.name}</strong>
            <p className="map-sel-cat">{item.category} · {item.location}</p>
            <p className="map-sel-meta">⭐ {RATINGS[item.id]} · {item.eta}</p>
          </div>
          <span className="map-sel-arrow">›</span>
        </div>
        {/* 맛집 가로 스크롤 */}
        <div className="map-place-row">
          {restaurants.map(r => (
            <button key={r.id} className={`map-place ${mapId===r.id?'on':''}`} onClick={() => setMapId(r.id)}>
              <span>{r.icon}</span>
              <span>{r.name.slice(0,4)}</span>
            </button>
          ))}
        </div>
        {/* 지도 앱 버튼 */}
        <div className="map-app-row">
          <button className="map-app nv" onClick={() => goMap(item.links.naver)}>네이버 지도</button>
          <button className="map-app kk" onClick={() => goMap(item.links.kakao)}>카카오맵</button>
          <button className="map-app real" onClick={() => setShowReal(!showReal)}>
            {showReal ? '목록 지도' : '실제 위치'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 저장 화면 ─────────────────────────────────────────── */
function SavedScreen({ savedIds, onToggleSave, onSelect }) {
  const items = restaurants.filter(r => savedIds.includes(r.id))
  return (
    <div className="screen saved-screen">
      <div className="saved-hdr">
        <h2>저장한 맛집</h2>
        <span className="saved-badge">{items.length}</span>
      </div>
      {items.length ? (
        <ul className="list-feed">
          {items.map(r => (
            <li key={r.id} className="feed-row" onClick={() => onSelect(r.id)}>
              <div className="feed-thumb"><Photo item={r} className="feed-img" /></div>
              <div className="feed-body">
                <strong className="feed-name">{r.name}</strong>
                <p className="feed-sub">{r.category}</p>
                <p className="feed-meta"><span className="feed-stars">⭐ {RATINGS[r.id]}</span><span> · {r.eta} · {r.location}</span></p>
              </div>
              <button className="feed-heart on" onClick={e=>{e.stopPropagation(); onToggleSave(r.id)}}>❤️</button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state big">
          <div className="empty-icon">🔖</div>
          <p>아직 저장한 맛집이 없어요</p>
          <small>맛집 카드의 하트를 눌러 저장해보세요</small>
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
    let n=0
    const t = setInterval(() => {
      setPick(restaurants[Math.floor(Math.random()*restaurants.length)])
      if (++n>=20) { clearInterval(t); setSpinning(false) }
    }, 90)
  }

  return (
    <div className="screen my-screen">
      {/* 프로필 */}
      <div className="my-profile">
        <div className="my-ava">🧑</div>
        <div>
          <strong>부산 미리한끼 유저</strong>
          <p>저장 {savedIds.length}곳</p>
        </div>
        <button className="my-edit">편집</button>
      </div>

      {/* 앱 설치 배너 */}
      {!isInstalled && (
        <div className="my-install-banner">
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

      {/* 오늘 뭐 먹지 룰렛 */}
      <div className="my-roulette">
        <p className="my-sec-label">오늘 뭐 먹지?</p>
        <div className={`roulette-box ${spinning?'spin':''}`}>
          <span className="r-icon">{pick ? pick.icon : '🎰'}</span>
          {pick && <strong className="r-name">{pick.name}</strong>}
        </div>
        <button className={`r-btn ${spinning?'spinning':''}`} onClick={spin} disabled={spinning}>
          {spinning ? '고르는 중...' : '🎲 룰렛 돌리기'}
        </button>
      </div>

      {/* 내 리스트 */}
      <div className="my-lists">
        <p className="my-sec-label">내 리스트</p>
        {[
          {ic:'🔖', label:'저장한 맛집', n: savedIds.length},
          {ic:'📍', label:'광안리 맛집', n: restaurants.filter(r=>r.location==='광안리').length},
          {ic:'🍽️', label:'전체 등록 맛집', n: restaurants.length},
        ].map(l => (
          <div key={l.label} className="my-list-row">
            <span className="my-list-ic">{l.ic}</span>
            <strong>{l.label}</strong>
            <span className="my-list-n">{l.n}</span>
            <span className="my-list-arr">›</span>
          </div>
        ))}
      </div>

      <p className="my-version">부산 미리한끼 v2.0 · 광안리·남구 로컬 큐레이션</p>
      <div style={{height:16}} />
    </div>
  )
}

/* ─── 상세 모달 ─────────────────────────────────────────── */
function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave }) {
  const scrollRef = useRef(null)
  const [tip, setTip] = useState('')
  const [liked, setLiked] = useState(saved)

  useEffect(() => {
    scrollRef.current?.scrollTo({top:0, behavior:'auto'})
    setTip('')
    setLiked(saved)
  }, [item.id, saved])

  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const rating = RATINGS[item.id]||4.5
  const reviews = REVIEWS[item.id]||500
  const hours = HOURS[item.id]||'정보 없음'
  const parking = PARKING[item.id]
  const menus = MENUS[item.id]||[]

  function handleSave() {
    setLiked(!liked)
    onToggleSave(item.id)
  }

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <div className="modal-back" onClick={onClose} />
      <div className="modal-card" ref={scrollRef}>

        {/* 사진 헤더 */}
        <div className="mc-photo-area">
          {item.photos?.[0]
            ? <img src={asset(item.photos[0].src)} alt={item.name} className="mc-photo" />
            : <div className={`mc-photo-ph ${ACCENT[item.accent]}`}><span>{item.icon}</span></div>
          }
          <div className="mc-photo-buttons">
            <button className="mc-back" onClick={onClose} aria-label="닫기">←</button>
            <button className="mc-share" onClick={() => onShare(item)} aria-label="공유">↗</button>
          </div>
        </div>

        {/* 흰 시트 */}
        <div className="mc-sheet">
          <div className="mc-grip" />

          {/* 상단 요약 */}
          <div className="mc-top">
            <div className="mc-name-row">
              <div>
                <h2 className="mc-name">{item.name}</h2>
                <p className="mc-cat">{item.category} · {item.location}</p>
              </div>
              <button className={`mc-heart ${liked?'on':''}`} onClick={handleSave}>
                {liked ? '❤️' : '🤍'}
              </button>
            </div>
            <div className="mc-stars-row">
              <span className="mc-stars">⭐ {rating}</span>
              <span className="mc-rev">리뷰 {reviews.toLocaleString()}개</span>
            </div>
            {/* 메타 뱃지 */}
            <div className="mc-meta-row">
              <span className="mc-meta-badge">📍 {item.eta}</span>
              <span className="mc-meta-badge">🕐 {hours}</span>
              <span className={`mc-meta-badge ${parking?'good':''}`}>{parking?'🅿️ 주차 가능':'🚫 주차 불가'}</span>
            </div>
          </div>

          {/* 한 줄 소개 */}
          <div className="mc-quote">
            <span className="mc-quote-bar" />
            <p>{item.hero}</p>
          </div>

          {/* 대표 메뉴 */}
          <div className="mc-section">
            <h3>대표 메뉴</h3>
            <div className="mc-menus">
              {menus.map(m => (
                <div key={m.n} className="mc-menu-row">
                  <span className="mc-menu-dot" />
                  <span className="mc-menu-name">{m.n}</span>
                  <span className="mc-menu-price">{m.p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 저장 / 길찾기 */}
          <div className="mc-action-row">
            <button className={`mc-save-btn ${liked?'on':''}`} onClick={handleSave}>
              {liked ? '💖 저장됨' : '🤍 저장하기'}
            </button>
            <button className="mc-dir-btn" onClick={() => goMap(item.links.naver)}>
              🗺️ 길찾기
            </button>
          </div>

          <div className="mc-divider" />

          {/* 음식 사진 */}
          {item.photos?.length > 0 && (
            <div className="mc-section">
              <h3>음식 사진</h3>
              <div className="mc-photo-grid">
                {item.photos.map(p => (
                  <figure key={p.src} className="mc-photo-fig">
                    <img src={asset(p.src)} alt={p.alt} loading="lazy" />
                    <figcaption>{p.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* 방문 경험 */}
          {item.experience && (
            <div className="mc-section">
              <h3>방문 경험</h3>
              <div className="mc-exp-grid">
                {[
                  {l:'혼밥', v:item.experience.soloOk?'가능':'불가', g:item.experience.soloOk},
                  {l:'소음', v:item.experience.noise, g:item.experience.noise==='낮음'},
                  {l:'분위기', v:item.experience.vibe, g:true},
                  {l:'음식 양', v:item.experience.portion, g:item.experience.portion==='많음'},
                ].map(b => (
                  <div key={b.l} className={`exp-badge ${b.g?'ok':''}`}>
                    <small>{b.l}</small><strong>{b.v}</strong>
                  </div>
                ))}
              </div>
              <div className="mc-exp-detail">
                <div><span>대기시간</span><span>{item.experience.waitTime}</span></div>
                <div><span>좌석</span><span>{item.experience.seating}</span></div>
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

          {/* 지도 연결 */}
          <div className="mc-section">
            <h3>지도 열기</h3>
            <div className="mc-map-btns">
              <button className="mc-map-btn naver"  onClick={() => goMap(item.links.naver)}>네이버</button>
              <button className="mc-map-btn kakao"  onClick={() => goMap(item.links.kakao)}>카카오</button>
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

          <div style={{height:40}} />
        </div>
      </div>
    </div>
  )
}

/* ─── 메인 앱 ────────────────────────────────────────────── */
export default function App() {
  const [splash, setSplash]       = useState(true)
  const [initArea, setInitArea]   = useState(null)
  const [tab, setTab]             = useState('home')
  const [selectedId, setSelectedId] = useState(null)
  const [mapId, setMapId]         = useState(restaurants[0].id)
  const [savedIds, setSavedIds]   = useState(() => {
    try {
      const s = localStorage.getItem('miri-hankki-saved')
      const p = s ? JSON.parse(s) : []
      return Array.isArray(p) ? p.filter(id=>restaurants.some(r=>r.id===id)) : []
    } catch { return [] }
  })
  const [prompt, setPrompt]       = useState(null)
  const [isInstalled, setIsInstalled] = useState(
    ()=>window.matchMedia('(display-mode:standalone)').matches||window.navigator.standalone===true
  )
  const [showGuide, setShowGuide] = useState(false)
  const [toast, setToast]         = useState(null)

  useEffect(() => {
    document.body.style.setProperty('--bg-mob', `url("${asset('/busan-bg.png')}")`)
    document.body.style.setProperty('--bg-wide',`url("${asset('/busan-bg-wide.png')}")`)
    return () => {
      document.body.style.removeProperty('--bg-mob')
      document.body.style.removeProperty('--bg-wide')
    }
  }, [])

  useEffect(() => {
    const bp = e => { e.preventDefault(); setPrompt(e) }
    const ai = () => { setPrompt(null); setIsInstalled(true); setShowGuide(false) }
    window.addEventListener('beforeinstallprompt', bp)
    window.addEventListener('appinstalled', ai)
    return () => { window.removeEventListener('beforeinstallprompt', bp); window.removeEventListener('appinstalled', ai) }
  }, [])

  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId])

  useEffect(() => { localStorage.setItem('miri-hankki-saved', JSON.stringify(savedIds)) }, [savedIds])

  function toggleSave(id) {
    setSavedIds(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id])
  }

  async function handleShare(item) {
    try {
      await copyText(item.links.naver)
      showToast('📋 링크를 복사했어요')
    } catch {}
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function handleInstall() {
    if (prompt) { prompt.prompt(); await prompt.userChoice; setPrompt(null); return }
    setShowGuide(true)
  }

  const selectedItem = restaurants.find(r=>r.id===selectedId)??null

  if (splash) {
    return (
      <div className="app-wrap">
        <div className="app-frame">
          <Splash
            onArea={(area) => { setInitArea(area); setSplash(false) }}
            onAI={() => { setSplash(false); setTab('search') }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrap">
      <div className="app-frame">
        <main className="app-main">
          {tab==='home'   && <HomeScreen  savedIds={savedIds} onToggleSave={toggleSave} onSelect={setSelectedId} onGoSearch={() => setTab('search')} initArea={initArea} />}
          {tab==='search' && <SearchScreen savedIds={savedIds} onToggleSave={toggleSave} onSelect={setSelectedId} />}
          {tab==='map'    && <MapScreen   mapId={mapId} setMapId={setMapId} onSelect={setSelectedId} />}
          {tab==='saved'  && <SavedScreen savedIds={savedIds} onToggleSave={toggleSave} onSelect={setSelectedId} />}
          {tab==='my'     && <MyScreen    savedIds={savedIds} isInstalled={isInstalled} onInstall={handleInstall} showGuide={showGuide} setShowGuide={setShowGuide} />}
        </main>

        <nav className="bnav">
          {NAV.map(n => (
            <button key={n.id} className={`bnav-btn ${tab===n.id?'on':''}`} onClick={() => setTab(n.id)}>
              <span className="bnav-icon">{n.icon}</span>
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
            onOpenMap={(id) => { setMapId(id); setSelectedId(null); setTab('map') }}
            saved={savedIds.includes(selectedItem.id)}
            onToggleSave={toggleSave}
          />
        )}
      </div>
    </div>
  )
}
