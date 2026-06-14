/* ─── 공통 유틸 함수 (외부 의존성 없음) ──────────────────── */

const BASE = import.meta.env.BASE_URL

/** 정적 자산 경로를 BASE_URL 기준으로 변환 */
export function asset(path) {
  return `${BASE}${path.replace(/^\//, '')}`
}

/** 두 좌표 사이의 거리(km) */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 사용자 위치 기준 소요 거리 문자열 */
export function getEta(item, userLoc) {
  if (!userLoc) return ''
  const km = haversine(userLoc.lat, userLoc.lng, item.lat, item.lng)
  if (km < 1) {
    const m = Math.round(km * 1000 / 10) * 10
    return `${m}m`
  }
  return `${km.toFixed(1)}km`
}

/** 클립보드 복사 (fallback 포함) */
export function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:absolute;left:-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

/** 외부 지도 링크 열기 (https만 허용) */
export function openMapLink(url) {
  if (!url || !url.startsWith('https://')) return
  window.location.href = url
}

/** 오늘 날짜 포맷 */
export function formatDate(full = false) {
  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return full
    ? `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())}`
    : `${pad(today.getMonth() + 1)}.${pad(today.getDate())}`
}

/** "1인 22,000 ~ 35,000원대" → 평균 가격(원) */
export function parseAvgPrice(priceStr) {
  const m = priceStr?.match(/1인\s+([\d,]+)\s*~\s*([\d,]+)/)
  if (!m) return 0
  const min = parseInt(m[1].replace(/,/g, ''))
  const max = parseInt(m[2].replace(/,/g, ''))
  return Math.round((min + max) / 2)
}
