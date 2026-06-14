/* ─── 공용 UI 프리미티브 ────────────────────────────────── */
import React, { useState } from 'react'
import { asset } from '../utils'
import { accentClassNames } from '../constants'

/** 별점 표시 (0.5 단위) */
export function StarDisplay({ rating, className = '' }) {
  return (
    <span className={`star-display ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        if (rating >= n) return <span key={n} className="sd-full">★</span>
        if (rating >= n - 0.5) return (
          <span key={n} className="sd-half">
            <span className="sd-half-fill">★</span>
            <span className="sd-half-bg">★</span>
          </span>
        )
        return <span key={n} className="sd-empty">★</span>
      })}
    </span>
  )
}

/** 별점 입력 (0.5 단위) */
export function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(null)
  const display = hover ?? value
  return (
    <div className="star-input" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="si-star">
          <button type="button" className="si-half si-left" aria-label={`${n - 0.5}점`}
            onClick={() => onChange(n - 0.5)}
            onMouseEnter={() => setHover(n - 0.5)} />
          <button type="button" className="si-half si-right" aria-label={`${n}점`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)} />
          {display >= n
            ? <span className="sd-full">★</span>
            : display >= n - 0.5
            ? <span className="sd-half"><span className="sd-half-fill">★</span><span className="sd-half-bg">★</span></span>
            : <span className="sd-empty">★</span>}
        </span>
      ))}
      <span className="si-val">{display}</span>
    </div>
  )
}

/** 가게 썸네일 (배너/사진 없으면 이모지 플레이스홀더) */
export function PhotoThumb({ item, className = '' }) {
  const src = item.banner ?? item.photos?.[0]?.src
  if (src) {
    return <img src={asset(src)} alt={item.name} loading="lazy" className={className} />
  }
  return (
    <div className={`emoji-thumb ${accentClassNames[item.accent]} ${className}`}>
      <span>{item.icon}</span>
    </div>
  )
}
