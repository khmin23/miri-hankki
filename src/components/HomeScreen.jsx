/* ─── 홈 화면 ───────────────────────────────────────────── */
import React, { useContext, useMemo, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { UserLocCtx } from '../context'
import { haversine } from '../utils'
import {
  homeMoodCategories, cuisineCategories, PRICE_FILTERS, TRAIT_FILTERS, situationCategories,
} from '../constants'
import { getSituationRecommendations } from '../recommend'
import { AppTopBar, PromoBanner, ModernCard, ModernSituationCard, DayCoursePlanner } from './cards'

const NEARBY_KM = 5

export function HomeScreen({ savedIds, onToggleSave, onSelect, onGoSearch, onGoMap, onOpenMapItem, onSaveCourse }) {
  const [moodFilter, setMoodFilter]   = useState('전체')
  const [priceFilter, setPriceFilter] = useState('전체')
  const [traitFilter, setTraitFilter] = useState(null)
  const [situation, setSituation]     = useState('혼밥')
  const [area, setArea]               = useState('내 위치')
  const userLoc                       = useContext(UserLocCtx)

  const areaFiltered = useMemo(() => {
    if (area === '내 위치') {
      if (!userLoc) return restaurants
      return restaurants.filter((item) => haversine(userLoc.lat, userLoc.lng, item.lat, item.lng) <= NEARBY_KM)
    }
    return restaurants.filter((item) => item.location.includes(area))
  }, [area, userLoc])

  const filtered = useMemo(() => {
    let list = areaFiltered
    if (moodFilter !== '전체') {
      const cat = cuisineCategories.find((c) => c.id === moodFilter)
      if (cat?.keywords.length > 0) list = list.filter((item) => cat.keywords.some((k) => item.category.includes(k)))
    }
    const pf = PRICE_FILTERS.find((f) => f.id === priceFilter)
    if (pf && pf.id !== '전체') list = list.filter(pf.test)
    const tf = TRAIT_FILTERS.find((f) => f.id === traitFilter)
    if (tf) list = list.filter(tf.test)
    return list
  }, [moodFilter, priceFilter, traitFilter, areaFiltered])

  const situationItems = useMemo(() => getSituationRecommendations(situation), [situation])

  return (
    <div className="home-screen">
      <AppTopBar onGoSearch={onGoSearch} area={area} setArea={setArea} />
      <PromoBanner onAreaSelect={(a) => setArea(a)} />

      {/* 음식 카테고리 필터 */}
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

      {/* 가격 + 특징 필터 */}
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

      {/* 결과 헤더 */}
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

      {/* 메인 카드 그리드 */}
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
          <button className="home-empty-btn" onClick={() => { setMoodFilter('전체'); setPriceFilter('전체'); setTraitFilter(null) }}>전체 보기</button>
        </div>
      )}

      {/* 상황별 추천 */}
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

      <DayCoursePlanner onSelect={onSelect} onSaveCourse={onSaveCourse} />

      <div style={{ height: 24 }} />
    </div>
  )
}
