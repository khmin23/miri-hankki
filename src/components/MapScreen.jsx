/* ─── 지도 화면 ─────────────────────────────────────────── */
import React, { useContext, useMemo, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { UserLocCtx } from '../context'
import { getEta, openMapLink } from '../utils'
import { moodCategories, cuisineCategories } from '../constants'
import { getCuisineCategory } from '../recommend'
import { PhotoThumb } from './common'
import { InteractiveMap } from './Map'

export function MapScreen({ mapSelectedId, setMapSelectedId, onSelect, bp }) {
  const userLoc = useContext(UserLocCtx)
  const [categoryFilter, setCategoryFilter] = useState('전체')

  const filteredItems = useMemo(() => {
    if (categoryFilter === '전체') return restaurants
    const cat = cuisineCategories.find((c) => c.id === categoryFilter)
    if (!cat || cat.keywords.length === 0) return restaurants
    return restaurants.filter((r) => cat.keywords.some((k) => r.category.includes(k)))
  }, [categoryFilter])

  const mapItem = useMemo(
    () => filteredItems.find((r) => r.id === mapSelectedId) ?? filteredItems[0] ?? restaurants[0],
    [filteredItems, mapSelectedId],
  )

  const isWeb = bp === 'tablet' || bp === 'desktop'

  if (isWeb) {
    return (
      <div className="map-screen-web">
        <div className="map-side-panel">
          <div className="map-side-header">
            <h3 className="map-side-title">맛집 지도</h3>
            <p className="map-side-sub">{filteredItems.length}곳</p>
          </div>
          <div className="map-filter-bar">
            {moodCategories.map((c) => (
              <button
                key={c.id}
                className={`map-filter-chip${categoryFilter === c.id ? ' active' : ''}`}
                onClick={() => setCategoryFilter(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div className="map-side-list">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className={`map-list-item${mapItem.id === item.id ? ' active' : ''}`}
                onClick={() => setMapSelectedId(item.id)}
              >
                <div className="map-list-thumb"><PhotoThumb item={item} /></div>
                <div className="map-list-info">
                  <strong>{item.name}</strong>
                  <p>{getCuisineCategory(item)} · {item.location}</p>
                  {getEta(item, userLoc) && <p className="map-list-eta">{getEta(item, userLoc)}</p>}
                </div>
                {mapItem.id === item.id && <span className="map-list-active-dot" />}
              </button>
            ))}
          </div>
          <div className="map-side-actions">
            <button className="map-side-btn primary" onClick={() => onSelect(mapItem.id)}>상세보기</button>
            <button className="map-side-btn" onClick={() => openMapLink(mapItem.links.naver)}>네이버 지도</button>
            <button className="map-side-btn" onClick={() => openMapLink(mapItem.links.kakao)}>카카오맵</button>
          </div>
        </div>
        <div className="map-main-panel">
          <InteractiveMap items={filteredItems} activeId={mapItem.id} onActive={setMapSelectedId} mode="overview" />
          <div className="map-selected-overlay" onClick={() => onSelect(mapItem.id)}>
            <div className="map-selected-thumb"><PhotoThumb item={mapItem} /></div>
            <div className="map-selected-info">
              <strong>{mapItem.name}</strong>
              <p>{mapItem.category} · {mapItem.location}{getEta(mapItem, userLoc) ? ` · ${getEta(mapItem, userLoc)}` : ''}</p>
            </div>
            <span className="map-chevron">›</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="map-screen">
      <div className="map-body" style={{ position: 'relative' }}>
        <div className="map-chip-overlay">
          {moodCategories.map((c) => (
            <button
              key={c.id}
              className={`map-chip${categoryFilter === c.id ? ' active' : ''}`}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="map-real-wrap">
          <InteractiveMap items={filteredItems} activeId={mapItem.id} onActive={setMapSelectedId} mode="overview" />
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
            {getEta(mapItem, userLoc) && <p className="item-eta">{getEta(mapItem, userLoc)}</p>}
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
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`map-place-card ${mapSelectedId === item.id ? 'active' : ''}`}
                  onClick={() => setMapSelectedId(item.id)}
                >
                  <span className="map-place-thumb"><PhotoThumb item={item} /></span>
                  <span className="map-place-copy">
                    <strong>{item.name}</strong>
                    <small>{getCuisineCategory(item)}{getEta(item, userLoc) ? ` · ${getEta(item, userLoc)}` : ''}</small>
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
