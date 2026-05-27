// 로컬 이메일+비밀번호 인증 (Web Crypto API 사용)
const STORE_KEY = 'miri-hankki-users'
const SESSION_KEY = 'miri-hankki-session'

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') } catch { return {} }
}

function saveUsers(users) {
  localStorage.setItem(STORE_KEY, JSON.stringify(users))
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export async function signUp(email, password) {
  const users = getUsers()
  const key = email.toLowerCase().trim()
  if (users[key]) throw Object.assign(new Error(), { code: 'auth/email-already-in-use' })
  const hash = await hashPassword(password)
  const user = { uid: crypto.randomUUID(), email: key, createdAt: Date.now() }
  users[key] = { ...user, hash }
  saveUsers(users)
  saveSession(user)
  return user
}

export async function signIn(email, password) {
  const users = getUsers()
  const key = email.toLowerCase().trim()
  const stored = users[key]
  if (!stored) throw Object.assign(new Error(), { code: 'auth/user-not-found' })
  const hash = await hashPassword(password)
  if (hash !== stored.hash) throw Object.assign(new Error(), { code: 'auth/wrong-password' })
  const user = { uid: stored.uid, email: stored.email }
  saveSession(user)
  return user
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
  return Promise.resolve()
}

export function onAuthStateChanged(callback) {
  const user = getSession()
  callback(user)
  return () => {}
}

export const isConfigured = true
