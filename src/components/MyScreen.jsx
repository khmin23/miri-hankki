/* ─── 마이 화면 ─────────────────────────────────────────── */
import React, { useMemo, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { signOut, deletePublicReview } from '../firebase'
import { asset } from '../utils'
import { StarDisplay, PhotoThumb } from './common'
import { MyFoodMap } from './Map'

const FILTER_MAP = {
  '혼밥': ['혼밥가능'],
  '카페': ['카페', '에스프레소바'],
  '야식': ['야식', '저녁추천'],
  '데이트': ['데이트'],
  '재방문': [],
}
const FILTER_TAGS = ['전체', '혼밥', '카페', '야식', '데이트', '재방문']

export function MyScreen({
  savedIds, onToggleSave, onSelect, visitRecords, setVisitRecords, reviews, setReviews,
  savedCourses, onDeleteCourse, isInstalledApp, installPrompt, onInstall, showInstallGuide,
  setShowInstallGuide, profile, onEditProfile, onLogout, firebaseUser, onLogin,
}) {
  const [activeFilter, setActiveFilter] = useState('전체')
  const [rouletteItem, setRouletteItem] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [toast, setToast] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)
  const [editText, setEditText] = useState('')

  // 이번 달 방문 횟수 (date: "YYYY.MM.DD" 기준)
  const thisMonthVisits = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`
    return visitRecords.filter((v) => typeof v.date === 'string' && v.date.startsWith(prefix)).length
  }, [visitRecords])

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

      {toast && <div className="my-toast">{toast}</div>}

      {/* 1. 프로필 헤로 */}
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
            { num: thisMonthVisits,     label: '이번 달 방문' },
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

      {/* 2. 내 음식 기록 */}
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
                    ? <img src={asset(v.photo)} alt={v.dish} loading="lazy" />
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

      {/* 3. 저장한 맛집 */}
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

      {/* 4. 취향 분석 */}
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

      {/* 5. 배지 */}
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

      {/* 6. 내 음식 지도 */}
      <section className="my-section">
        <div className="my-section-hd">
          <span className="my-section-title">🗺️ 내 음식 지도</span>
          {visitRecords.length > 0 && <span className="my-section-count">{[...new Set(visitRecords.map((v) => v.restaurantId))].length}곳</span>}
        </div>
        <MyFoodMap visitRecords={visitRecords} onSelect={onSelect} />
      </section>

      {/* 7. 저장된 코스 */}
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

      {/* 8. 리뷰 & 메모 */}
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

      {/* 설정 */}
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
