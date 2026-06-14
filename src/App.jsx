import React, { useEffect, useState } from 'react'
import { restaurants } from './data/restaurants'
import {
  onAuthStateChanged, loadUserData, saveUserData, getAllPublicReviews,
} from './firebase'
import { UserLocCtx, ReviewStatsCtx } from './context'
import { useUserLocation, useBreakpoint } from './hooks'
import { asset, copyToClipboard } from './utils'
import { navItems } from './constants'
import { SideNav } from './components/cards'
import { Splash, AuthScreen, ProfileSetup } from './components/onboarding'
import { HomeScreen } from './components/HomeScreen'
import { SearchScreen } from './components/SearchScreen'
import { MapScreen } from './components/MapScreen'
import { MyScreen } from './components/MyScreen'
import { DetailModal } from './components/DetailModal'

export default function App() {
  const bp      = useBreakpoint()
  const isWeb   = bp !== 'mobile'
  const userLoc = useUserLocation()

  const [firebaseUser, setFirebaseUser] = useState(() => {
    try { const s = localStorage.getItem('miri-hankki-session'); return s ? JSON.parse(s) : null }
    catch { return null }
  })
  const [profile, setProfile] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-profile'); return s ? JSON.parse(s) : null }
    catch { return null }
  })
  const [showSplash, setShowSplash] = useState(() => !isWeb)
  const [showProfileSetup, setShowProfileSetup] = useState(() => {
    try {
      const s = localStorage.getItem('miri-hankki-session')
      const p = localStorage.getItem('miri-hankki-profile')
      return !!(s && !p)
    } catch { return false }
  })
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(() => !(() => {
    try { return !!localStorage.getItem('miri-hankki-session') } catch { return false }
  })())
  const [activeTab, setActiveTab]         = useState('home')
  const [selectedId, setSelectedId]       = useState(null)
  const [mapSelectedId, setMapSelectedId] = useState(restaurants[0].id)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalledApp, setIsInstalledApp] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  )
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const s = window.localStorage.getItem('miri-hankki-saved')
      const p = s ? JSON.parse(s) : []
      return Array.isArray(p) ? p.filter((id) => restaurants.some((r) => r.id === id)) : []
    } catch { return [] }
  })
  const [showCopyMessage, setShowCopyMessage] = useState(false)

  const [visitRecords, setVisitRecords] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-visits-v2'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })

  const [reviews, setReviews] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-reviews-v2'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })

  // 가게별 별점 통계 (Firestore 전체 후기 기준)
  const [reviewStats, setReviewStats] = useState({})
  useEffect(() => {
    getAllPublicReviews(200).then((data) => {
      const acc = {}
      data.forEach((r) => {
        const id = r.restaurantId
        if (!acc[id]) acc[id] = { sum: 0, count: 0 }
        acc[id].sum += r.rating
        acc[id].count += 1
      })
      const stats = {}
      Object.entries(acc).forEach(([id, { sum, count }]) => {
        stats[Number(id)] = { avg: (sum / count).toFixed(1), count }
      })
      setReviewStats(stats)
    })
  }, [])

  // Firebase 인증 상태 동기화 + Firestore 데이터 로드
  useEffect(() => {
    const unsub = onAuthStateChanged(async (user) => {
      setFirebaseUser(user)
      if (user) {
        // 사용자 감지 즉시 자동저장 잠금 — Firestore 로드 완료 전에
        // 빈 상태가 기존 기록을 덮어쓰는 race condition 방지
        setDataLoaded(false)
        localStorage.setItem('miri-hankki-session', JSON.stringify(user))
        try {
          const data = await loadUserData(user.uid)
          if (data) {
            if (Array.isArray(data.savedIds))     setSavedIds(data.savedIds)
            if (Array.isArray(data.visitRecords)) setVisitRecords(data.visitRecords)
            if (Array.isArray(data.reviews))      setReviews(data.reviews)
            if (Array.isArray(data.savedCourses)) setSavedCourses(data.savedCourses)
            if (data.profile) {
              setProfile(data.profile)
              localStorage.setItem('miri-hankki-profile', JSON.stringify(data.profile))
            } else {
              const stored = (() => { try { const s = localStorage.getItem('miri-hankki-profile'); return s ? JSON.parse(s) : null } catch { return null } })()
              if (stored) { setProfile(stored) } else { setShowProfileSetup(true) }
            }
          } else {
            const stored = (() => { try { const s = localStorage.getItem('miri-hankki-profile'); return s ? JSON.parse(s) : null } catch { return null } })()
            if (stored) { setProfile(stored) } else { setShowProfileSetup(true) }
          }
          // 클라우드 로드가 성공했을 때만 자동저장 해제
          setDataLoaded(true)
        } catch (e) {
          // 읽기 실패(네트워크 등) 시 자동저장을 계속 잠가 빈 데이터 덮어쓰기 방지
          console.warn('[미리한끼] 사용자 데이터 로드 실패 — 자동저장 잠금 유지', e)
        }
      } else {
        localStorage.removeItem('miri-hankki-session')
        setDataLoaded(true)
      }
    })
    return unsub
  }, [])

  // 웹 환경에서는 스플래시 자동 스킵
  useEffect(() => {
    if (isWeb && showSplash) setShowSplash(false)
  }, [isWeb])

  useEffect(() => {
    document.body.style.setProperty('--app-bg-mobile', `url("${asset('/busan-bg.png')}")`)
    document.body.style.setProperty('--app-bg-wide',   `url("${asset('/busan-bg-wide.png')}")`)
    return () => {
      document.body.style.removeProperty('--app-bg-mobile')
      document.body.style.removeProperty('--app-bg-wide')
    }
  }, [])

  useEffect(() => {
    function onBefore(e) { e.preventDefault(); setInstallPrompt(e) }
    function onInstalled() { setInstallPrompt(null); setIsInstalledApp(true); setShowInstallGuide(false) }
    window.addEventListener('beforeinstallprompt', onBefore)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = (selectedId || activeTab === 'map') ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId, activeTab])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-saved', JSON.stringify(savedIds))
  }, [savedIds])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-visits-v2', JSON.stringify(visitRecords))
  }, [visitRecords])

  useEffect(() => {
    window.localStorage.setItem('miri-hankki-reviews-v2', JSON.stringify(reviews))
  }, [reviews])

  const [savedCourses, setSavedCourses] = useState(() => {
    try { const s = window.localStorage.getItem('miri-hankki-courses'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })
  useEffect(() => {
    window.localStorage.setItem('miri-hankki-courses', JSON.stringify(savedCourses))
  }, [savedCourses])

  // Firestore 자동 저장 (로그인 + 로드 완료 후, 1.5초 debounce)
  useEffect(() => {
    if (!firebaseUser || !dataLoaded) return
    const t = setTimeout(() => {
      saveUserData(firebaseUser.uid, { savedIds, visitRecords, reviews, savedCourses, profile })
    }, 1500)
    return () => clearTimeout(t)
  }, [savedIds, visitRecords, reviews, savedCourses, profile, firebaseUser, dataLoaded])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab])

  function toggleSave(id) {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleShare(item) {
    try {
      await copyToClipboard(item.links.naver)
      setShowCopyMessage(true)
      window.setTimeout(() => setShowCopyMessage(false), 1800)
    } catch { /* ignore */ }
  }

  function openMap(id) {
    setMapSelectedId(id)
    setSelectedId(null)
    setActiveTab('map')
  }

  async function handleInstallApp() {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
      return
    }
    setShowInstallGuide(true)
  }

  const selectedItem = restaurants.find((r) => r.id === selectedId) ?? null

  return (
    <UserLocCtx.Provider value={userLoc}>
    <ReviewStatsCtx.Provider value={reviewStats}>
    <div className="app-wrapper">
      <div className="app-frame">
        {showSplash && !isWeb ? (
          <Splash onDone={() => setShowSplash(false)} />
        ) : (
          <div className={`app-layout${isWeb ? ' app-layout-web' : ''}`}>
            {isWeb && (
              <SideNav bp={bp} activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <main className="main-content">
              {activeTab === 'home' && (
                <HomeScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                  onGoSearch={() => setActiveTab('search')}
                  onGoMap={() => setActiveTab('map')}
                  onOpenMapItem={(id) => { setMapSelectedId(id); setActiveTab('map') }}
                  onSaveCourse={(c) => setSavedCourses((prev) => [c, ...prev])}
                />
              )}
              <div style={{ display: activeTab === 'search' ? 'block' : 'none' }}>
                <SearchScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                />
              </div>
              {activeTab === 'map' && (
                <MapScreen
                  mapSelectedId={mapSelectedId}
                  setMapSelectedId={setMapSelectedId}
                  onSelect={setSelectedId}
                  bp={bp}
                />
              )}
              {activeTab === 'my' && (
                <MyScreen
                  savedIds={savedIds}
                  onToggleSave={toggleSave}
                  onSelect={setSelectedId}
                  onGoMap={() => setActiveTab('map')}
                  visitRecords={visitRecords}
                  setVisitRecords={setVisitRecords}
                  reviews={reviews}
                  setReviews={setReviews}
                  savedCourses={savedCourses}
                  onDeleteCourse={(id) => setSavedCourses((prev) => prev.filter((c) => c.id !== id))}
                  isInstalledApp={isInstalledApp}
                  installPrompt={installPrompt}
                  onInstall={handleInstallApp}
                  showInstallGuide={showInstallGuide}
                  setShowInstallGuide={setShowInstallGuide}
                  profile={profile}
                  onEditProfile={(p) => { setProfile(p); window.localStorage.setItem('miri-hankki-profile', JSON.stringify(p)) }}
                  onLogout={() => {
                    setFirebaseUser(null); setProfile(null)
                    setSavedIds([]); setVisitRecords([]); setReviews([]); setSavedCourses([])
                    setDataLoaded(true)
                    localStorage.removeItem('miri-hankki-session')
                    localStorage.removeItem('miri-hankki-profile')
                  }}
                  firebaseUser={firebaseUser}
                  onLogin={() => setShowAuthOverlay(true)}
                />
              )}
            </main>

            {!isWeb && (
              <nav className="bottom-nav">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className={activeTab === item.id ? 'active' : ''}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <small>{item.label}</small>
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}

        {/* 로그인 / 프로필 오버레이 */}
        {showAuthOverlay && (
          <AuthScreen
            onDone={(user, profileData) => {
              setFirebaseUser(user)
              setShowAuthOverlay(false)
              if (profileData) {
                setProfile(profileData)
                window.localStorage.setItem('miri-hankki-profile', JSON.stringify(profileData))
                saveUserData(user.uid, { savedIds, visitRecords, reviews, savedCourses, profile: profileData })
              }
            }}
            onSkip={() => setShowAuthOverlay(false)}
          />
        )}
        {showProfileSetup && firebaseUser && !profile && (
          <ProfileSetup onDone={(p) => {
            setProfile(p)
            setShowProfileSetup(false)
            saveUserData(firebaseUser.uid, { savedIds, visitRecords, reviews, savedCourses, profile: p })
          }} />
        )}

        {showCopyMessage && <div className="toast">📋 링크를 복사했어요.</div>}

        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onShare={handleShare}
            onOpenMap={openMap}
            saved={savedIds.includes(selectedItem.id)}
            onToggleSave={toggleSave}
            visitRecords={visitRecords}
            setVisitRecords={setVisitRecords}
            reviews={reviews}
            setReviews={setReviews}
            profile={profile}
            firebaseUser={firebaseUser}
          />
        )}
      </div>
    </div>
    </ReviewStatsCtx.Provider>
    </UserLocCtx.Provider>
  )
}
