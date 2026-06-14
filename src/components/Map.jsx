/* ─── 지도 컴포넌트 ─────────────────────────────────────── */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { restaurants } from '../data/restaurants'
import { UserLocCtx } from '../context'
import { mapCenter, accentColors } from '../constants'
import { PhotoThumb } from './common'

export function InteractiveMap({ items, activeId, onActive, mode = 'overview' }) {
  const userLoc = useContext(UserLocCtx)
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef([])
  const userMarkerRef = useRef(null)

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [items, activeId],
  )

  useEffect(() => {
    if (!mapEl.current || mapRef.current || !window.L) return undefined

    const map = window.L.map(mapEl.current, {
      center: activeItem?.lat && activeItem?.lng ? [activeItem.lat, activeItem.lng] : mapCenter,
      zoom: mode === 'focused' ? 16 : 14,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(map)
    window.L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current = []
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return

    window.__miriSelectRestaurant = (id) => onActive?.(Number(id))

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current = []

    const coords = []
    items.forEach((item) => {
      if (!item.lat || !item.lng) return
      coords.push([item.lat, item.lng])
      const active = item.id === activeId
      const color = accentColors[item.accent] ?? '#E8654A'
      const icon = window.L.divIcon({
        html: `
          <button type="button" class="custom-marker${active ? ' active' : ''}" style="background:${color}" onclick="window.__miriSelectRestaurant && window.__miriSelectRestaurant(${item.id})">
            <span class="custom-marker-inner">${item.icon}</span>
          </button>
        `,
        className: 'custom-marker-shell',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = window.L.marker([item.lat, item.lng], {
        icon,
        zIndexOffset: active ? 1000 : 0,
      })
        .addTo(map)
        .on('click', () => onActive?.(item.id))

      marker.getElement()?.addEventListener('click', () => onActive?.(item.id))
      marker.getElement()?.addEventListener('touchend', () => onActive?.(item.id), { passive: true })
      markerRefs.current.push(marker)
    })

    window.setTimeout(() => {
      map.invalidateSize()
      if (mode === 'focused' && activeItem?.lat && activeItem?.lng) {
        map.setView([activeItem.lat, activeItem.lng], 16, { animate: true })
      } else if (coords.length === 1) {
        map.setView(coords[0], 15, { animate: true })
      } else if (coords.length > 1) {
        map.fitBounds(window.L.latLngBounds(coords), {
          paddingTopLeft: [46, 42],
          paddingBottomRight: [46, 88],
          maxZoom: 15,
          animate: true,
          duration: 0.45,
        })
      }
    }, 80)
  }, [items, activeId, onActive, mode, activeItem])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeItem?.lat || !activeItem?.lng) return
    if (mode === 'focused') {
      map.setView([activeItem.lat, activeItem.lng], 16, { animate: true })
    }
    window.setTimeout(() => map.invalidateSize(), 60)
  }, [activeItem, mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }
    if (!userLoc) return
    const icon = window.L.divIcon({
      html: `<div class="user-loc-marker"><div class="user-loc-dot"></div><div class="user-loc-ring"></div></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    userMarkerRef.current = window.L.marker([userLoc.lat, userLoc.lng], { icon, zIndexOffset: 2000 }).addTo(map)
  }, [userLoc])

  return (
    <div className="interactive-map">
      {!window.L && <div className="map-loading">지도를 불러오는 중입니다.</div>}
      <div id="map" ref={mapEl} className="leaflet-map" />
    </div>
  )
}

/* ─── 내 음식 지도 ─────────────────────────────────────── */
export function MyFoodMap({ visitRecords, onSelect }) {
  const [activeId, setActiveId] = useState(null)

  const visitedItems = useMemo(() => {
    const countMap = {}
    visitRecords.forEach((v) => {
      if (!countMap[v.restaurantId]) countMap[v.restaurantId] = { count: 0, lastDish: v.dish, lastDate: v.date }
      countMap[v.restaurantId].count += 1
      countMap[v.restaurantId].lastDish = v.dish
      countMap[v.restaurantId].lastDate = v.date
    })
    return restaurants
      .filter((r) => countMap[r.id])
      .map((r) => ({ ...r, visitCount: countMap[r.id].count, lastDish: countMap[r.id].lastDish, lastDate: countMap[r.id].lastDate }))
  }, [visitRecords])

  const activeItem = visitedItems.find((r) => r.id === activeId) ?? visitedItems[0] ?? null

  if (visitedItems.length === 0) {
    return <div className="my-saved-empty"><span>🗺️</span><p>방문 기록을 추가하면 지도에 표시돼요</p></div>
  }

  return (
    <div className="my-food-map-wrap">
      <InteractiveMap
        items={visitedItems}
        activeId={activeId ?? visitedItems[0]?.id}
        onActive={setActiveId}
        mode="overview"
      />
      {activeItem && (
        <button className="my-food-map-info" onClick={() => onSelect(activeItem.id)}>
          <span className="mfm-icon">{activeItem.icon}</span>
          <div className="mfm-body">
            <strong>{activeItem.name}</strong>
            <p>{activeItem.lastDish} · {activeItem.lastDate}</p>
          </div>
          <div className="mfm-right">
            <span className="mfm-cnt">{activeItem.visitCount}회</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </button>
      )}
      <div className="my-food-map-list">
        {visitedItems.map((r) => (
          <button
            key={r.id}
            className={`mfm-chip${activeId === r.id || (!activeId && visitedItems[0]?.id === r.id) ? ' active' : ''}`}
            onClick={() => setActiveId(r.id)}
          >
            <span>{r.icon}</span>
            <span>{r.name}</span>
            <span className="mfm-chip-cnt">{r.visitCount}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
