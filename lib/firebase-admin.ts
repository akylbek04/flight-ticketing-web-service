import "server-only"
import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

let app: App

function initAdmin() {
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  } else {
    app = getApps()[0]
  }
  return app
}

export function getAdminAuth() {
  initAdmin()
  return getAuth(app)
}

export function getAdminFirestore() {
  initAdmin()
  return getFirestore(app)
}
