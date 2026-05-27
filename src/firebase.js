import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isConfigured = !!firebaseConfig.apiKey

const app  = isConfigured ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null

export async function signUp(email, password) {
  if (!auth) throw new Error('Firebase not configured')
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  return { uid: cred.user.uid, email: cred.user.email }
}

export async function signIn(email, password) {
  if (!auth) throw new Error('Firebase not configured')
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return { uid: cred.user.uid, email: cred.user.email }
}

export function signOut() {
  if (!auth) return Promise.resolve()
  return fbSignOut(auth)
}

export function onAuthStateChanged(callback) {
  if (!auth) { callback(null); return () => {} }
  return fbOnAuthStateChanged(auth, (user) => {
    callback(user ? { uid: user.uid, email: user.email } : null)
  })
}
