/* ─── 커스텀 훅 ─────────────────────────────────────────── */
import { useEffect, useState } from 'react'

/** GPS 위치를 실시간 추적 */
export function useUserLocation() {
  const [loc, setLoc] = useState(null)
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, maximumAge: 30000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])
  return loc
}

/** 화면 폭 기준 브레이크포인트 */
export function useBreakpoint() {
  function get() {
    const w = window.innerWidth
    if (w >= 1100) return 'desktop'
    if (w >= 768)  return 'tablet'
    return 'mobile'
  }
  const [bp, setBp] = useState(get)
  useEffect(() => {
    const h = () => setBp(get())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return bp
}
