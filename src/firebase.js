// Firebase 설정
// 아래 값들을 Firebase 콘솔에서 복사해서 채워주세요
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
}

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

if (isConfigured && typeof window !== 'undefined' && window.firebase && !window.__firebaseInitialized) {
  window.firebase.initializeApp(firebaseConfig)
  window.__firebaseInitialized = true
}

function getAuth() {
  if (!isConfigured || !window.firebase) return null
  return window.firebase.auth()
}

export async function signUp(email, password) {
  const auth = getAuth()
  if (!auth) throw new Error('Firebase가 설정되지 않았습니다')
  const result = await auth.createUserWithEmailAndPassword(email, password)
  return result.user
}

export async function signIn(email, password) {
  const auth = getAuth()
  if (!auth) throw new Error('Firebase가 설정되지 않았습니다')
  const result = await auth.signInWithEmailAndPassword(email, password)
  return result.user
}

export async function signOut() {
  const auth = getAuth()
  if (!auth) return
  await auth.signOut()
}

export function onAuthStateChanged(callback) {
  const auth = getAuth()
  if (!auth) { callback(null); return () => {} }
  return auth.onAuthStateChanged(callback)
}

export { isConfigured }
