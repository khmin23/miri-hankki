/* ─── 전역 컨텍스트 ─────────────────────────────────────── */
import { createContext } from 'react'

/** 사용자 GPS 위치 { lat, lng } | null */
export const UserLocCtx = createContext(null)

/** 가게별 후기 통계 { [id]: { avg, count } } */
export const ReviewStatsCtx = createContext({})
