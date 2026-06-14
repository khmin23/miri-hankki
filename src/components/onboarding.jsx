/* ─── 스플래시 / 로그인 / 프로필 설정 ───────────────────── */
import React, { useEffect, useState } from 'react'
import { signUp, signIn } from '../firebase'
import { asset } from '../utils'
import { PROFILE_AVATARS } from '../constants'

/* ─── 스플래시 ─── */
export function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="splash">
      <div className="splash-bg">
        <img src={asset('/busan-bg.png')} alt="" aria-hidden="true" />
      </div>
      <div className="splash-overlay" />
      <div className="splash-content">
        <div className="splash-logo-area">
          <div className="splash-brand-mark" aria-hidden="true">
            <span className="brand-cloche">◜</span>
            <span className="brand-pin">●</span>
          </div>
          <h1 className="splash-title">
            <span className="title-ko">부산</span>
            <span className="title-ko accent">미리한끼</span>
          </h1>
          <p className="splash-subtitle">부산에서, 미리 만나는 맛있는 한 끼 ❤️</p>
        </div>
      </div>
    </div>
  )
}

/* ─── 로그인 / 회원가입 ─── */
export function AuthScreen({ onDone, onSkip }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar]     = useState('🌊')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('이메일과 비밀번호를 입력해주세요'); return }
    if (mode === 'signup') {
      if (password !== confirm) { setError('비밀번호가 일치하지 않아요'); return }
      if (!nickname.trim()) { setError('닉네임을 입력해주세요'); return }
    }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요'); return }
    setLoading(true)
    try {
      const user = mode === 'signup'
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password)
      if (mode === 'signup') {
        const profileData = { name: nickname.trim(), avatar }
        window.localStorage.setItem('miri-hankki-profile', JSON.stringify(profileData))
        onDone(user, profileData)
      } else {
        onDone(user, null)
      }
    } catch (e) {
      const msg = {
        'auth/email-already-in-use': '이미 사용 중인 이메일이에요',
        'auth/user-not-found':       '등록되지 않은 이메일이에요',
        'auth/wrong-password':       '비밀번호가 틀렸어요',
        'auth/invalid-email':        '이메일 형식이 올바르지 않아요',
        'auth/too-many-requests':    '잠시 후 다시 시도해주세요',
        'auth/invalid-credential':   '이메일 또는 비밀번호가 틀렸어요',
      }[e.code] || '오류가 발생했어요. 다시 시도해주세요'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      {onSkip && (
        <button className="auth-close-btn" onClick={onSkip} aria-label="닫기">✕</button>
      )}
      <div className="auth-inner">
        <div className="auth-logo">🌊</div>
        <h1 className="auth-title">부산 미리한끼</h1>
        <p className="auth-sub">{mode === 'login' ? '다시 오셨군요! 로그인해주세요' : '부산 맛집 여정을 시작해요'}</p>

        <div className="auth-tab-row">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError('') }}>로그인</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>회원가입</button>
        </div>

        <div className="auth-form">
          <input className="auth-input" type="email" placeholder="이메일" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input className="auth-input" type="password" placeholder="비밀번호 (6자 이상)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => mode === 'login' && e.key === 'Enter' && handleSubmit()} />
          {mode === 'signup' && (
            <>
              <input className="auth-input" type="password" placeholder="비밀번호 확인" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} />
              <input className="auth-input" placeholder="닉네임 (예: 광안 미식가)" value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                maxLength={12} />
              <div className="ps-avatar-grid" style={{ marginTop: 4 }}>
                {PROFILE_AVATARS.map((em) => (
                  <button key={em} type="button"
                    className={`ps-avatar-btn${avatar === em ? ' active' : ''}`}
                    onClick={() => setAvatar(em)}>{em}</button>
                ))}
              </div>
            </>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button className={`auth-submit${loading ? ' loading' : ''}`} onClick={handleSubmit} disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 프로필 설정 ─── */
export function ProfileSetup({ onDone }) {
  const [name, setName]     = useState('')
  const [avatar, setAvatar] = useState('🌊')

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const profile = { name: trimmed, avatar }
    window.localStorage.setItem('miri-hankki-profile', JSON.stringify(profile))
    onDone(profile)
  }

  return (
    <div className="profile-setup">
      <div className="ps-inner">
        <div className="ps-selected-avatar">{avatar}</div>
        <h1 className="ps-title">미리한끼에<br/>오신 걸 환영해요 🎉</h1>
        <p className="ps-sub">닉네임과 아바타를 설정해주세요</p>

        <div className="ps-avatar-grid">
          {PROFILE_AVATARS.map((em) => (
            <button
              key={em}
              className={`ps-avatar-btn${avatar === em ? ' active' : ''}`}
              onClick={() => setAvatar(em)}
            >{em}</button>
          ))}
        </div>

        <input
          className="ps-name-input"
          placeholder="닉네임 입력 (예: 광안 미식가)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={12}
        />
        <button
          className={`ps-submit${name.trim() ? '' : ' disabled'}`}
          onClick={handleSubmit}
          disabled={!name.trim()}
        >🍽️ 시작하기</button>
      </div>
    </div>
  )
}
