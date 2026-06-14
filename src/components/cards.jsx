/* ─── 카드 / 네비 / 배너 / 코스 컴포넌트 ─────────────────── */
import React, { useContext, useEffect, useRef, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { UserLocCtx, ReviewStatsCtx } from '../context'
import { getEta, asset, formatDate } from '../utils'
import { navItems, PROMO_SLIDES } from '../constants'
import { generateCourse } from '../recommend'
import { PhotoThumb } from './common'

/* ─── 사이드 네비게이션 ─────────────────────────────────── */
export function SideNav({ bp, activeTab, onTabChange }) {
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
          </button>
        ))}
      </div>
    </nav>
  )
}

/** 리스트형 트렌딩 아이템 */
export function TrendingItem({ item, saved, onToggleSave, onSelect }) {
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

export function SituationCard({ item, reason, onSelect, onOpenMap }) {
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

/* ─── 상단 앱바 ─── */
export function AppTopBar({ onGoSearch, area, setArea }) {
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

const LOCATION_OPTIONS = ['내 위치', '광안리', '해운대', '서면/전포', '남포']

/* ─── 모던 카드 ─── */
export function ModernCard({ item, saved, onToggleSave, onSelect }) {
  const userLoc = useContext(UserLocCtx)
  const reviewStats = useContext(ReviewStatsCtx)
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

export function ModernSituationCard({ item, reason, onSelect }) {
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

/* ─── 프로모 배너 슬라이드 ─────────────────────────────── */
export function PromoBanner({ onAreaSelect }) {
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
          <button key={i} className={`promo-dot${i === idx ? ' active' : ''}`} aria-label={`슬라이드 ${i + 1}`}
            onClick={(e) => { e.stopPropagation(); goTo(i) }} />
        ))}
      </div>
    </div>
  )
}

/* ─── 하루 코스 컴포넌트 ──────────────────────────────── */
export function DayCoursePlanner({ onSelect, onSaveCourse }) {
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
