import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | undefined
let firebaseAuth: Auth | undefined
let firebaseDb: Firestore | undefined
let firebaseGoogleProvider: GoogleAuthProvider | undefined

function initializeFirebaseApp() {
  if (typeof window === "undefined") return undefined

  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return firebaseApp
}

export function getFirebaseAuth() {
  if (typeof window === "undefined") return undefined

  const app = initializeFirebaseApp()
  if (!app) return undefined

  if (!firebaseAuth) {
    firebaseAuth = getAuth(app)
  }
  return firebaseAuth
}

export function getFirebaseDb() {
  if (typeof window === "undefined") return undefined

  const app = initializeFirebaseApp()
  if (!app) return undefined

  if (!firebaseDb) {
    firebaseDb = getFirestore(app)
  }
  return firebaseDb
}

export function getGoogleProvider() {
  if (typeof window === "undefined") return undefined

  if (!firebaseGoogleProvider) {
    firebaseGoogleProvider = new GoogleAuthProvider()
    firebaseGoogleProvider.setCustomParameters({
      prompt: "select_account",
    })
  }
  return firebaseGoogleProvider
}

export { initializeFirebaseApp as getFirebaseApp }
