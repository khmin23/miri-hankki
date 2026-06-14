/* ─── 상세 모달 ─────────────────────────────────────────── */
import React, { useContext, useEffect, useRef, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { savePublicReview, getPublicReviews } from '../firebase'
import { UserLocCtx } from '../context'
import { asset, getEta, openMapLink, haversine, formatDate } from '../utils'
import { operatingHours, parkingAvail, menuData, accentClassNames } from '../constants'
import { getCuisineCategory, getTip } from '../recommend'
import { StarDisplay, StarRatingInput, PhotoThumb } from './common'

export function DetailModal({ item, onClose, onShare, onOpenMap, saved, onToggleSave, visitRecords, setVisitRecords, reviews, setReviews, profile, firebaseUser }) {
  const userLoc = useContext(UserLocCtx)
  const scrollRef = useRef(null)
  const [tip, setTip]       = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitDish, setVisitDish]         = useState('')
  const [visitRevisit, setVisitRevisit]   = useState(true)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating]     = useState(5)
  const [reviewText, setReviewText]         = useState('')
  const [soloVisit, setSoloVisit]           = useState(false)

  const myVisits  = (visitRecords || []).filter((v) => v.restaurantId === item.id)
  const myReviews = (reviews || []).filter((r) => r.restaurantId === item.id)

  const soloVerified = myReviews.some((r) => r.soloVisit)

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
              aria-label={saved ? '찜 해제' : '찜'}
            >{saved ? '❤️' : '🤍'}</button>
          </div>

          <p className="detail-hero-text">{item.hero}</p>

          {/* 방문 전 체크 */}
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

          {/* 분위기 & 좌석 */}
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

          {/* 저장 + 길찾기 */}
          <div className="detail-action-row">
            <button className={`detail-save-btn ${saved ? 'saved' : ''}`} onClick={() => onToggleSave(item.id)}>
              {saved ? '💖 저장됨' : '🤍 저장하기'}
            </button>
            <button className="detail-dir-btn" onClick={() => openMapLink(item.links.naver)}>🗺️ 길찾기</button>
          </div>
          <div className="detail-divider" />

          {/* 가게 내부 */}
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

          {/* 음식 사진 */}
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

          {/* 추천 메뉴 TOP 3 */}
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

          {/* 전체 메뉴 */}
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

          {/* 추천 상황 */}
          {item.mood?.length > 0 && (
            <div className="detail-section">
              <h3>이런 분들께 추천</h3>
              <div className="detail-mood-tags">
                {item.mood.map((m) => <span key={m} className="detail-mood-tag">{m}</span>)}
              </div>
            </div>
          )}

          {/* 에디터 포인트 */}
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

          {/* 다른 사람들의 리뷰 */}
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

          {/* 내 방문 기록 */}
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

          {/* 내 리뷰 & 메모 */}
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
