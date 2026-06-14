import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc,
  collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, limit,
} from 'firebase/firestore'

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
const db   = app ? getFirestore(app) : null

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

/* ── Firestore: 유저 데이터 로드 / 저장 ── */
// 문서가 없으면 null을 반환하고, 네트워크 등 읽기 오류는 throw 한다.
// (호출부에서 "신규 유저"와 "로드 실패"를 구분해 빈 데이터 덮어쓰기를 막기 위함)
export async function loadUserData(uid) {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function saveUserData(uid, data) {
  if (!db) return
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true })
  } catch { /* ignore */ }
}

/* ── Firestore: 공개 리뷰 저장 / 불러오기 ── */
export async function savePublicReview({ restaurantId, rating, text, soloVisit, nickname, uid }) {
  if (!db) return null
  try {
    const ref = await addDoc(collection(db, 'publicReviews'), {
      restaurantId,
      rating,
      text,
      soloVisit: soloVisit || false,
      nickname: nickname || '익명',
      uid: uid || null,
      createdAt: serverTimestamp(),
    })
    return ref.id
  } catch { return null }
}

export async function getPublicReviews(restaurantId) {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'publicReviews'),
      where('restaurantId', '==', restaurantId),
    )
    const snap = await getDocs(q)
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  } catch { return [] }
}

export async function deletePublicReview(firestoreId) {
  if (!db || !firestoreId) return
  try {
    await deleteDoc(doc(db, 'publicReviews', firestoreId))
  } catch { /* ignore */ }
}

export async function getAllPublicReviews(limitCount = 50) {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'publicReviews'),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch { return [] }
}
