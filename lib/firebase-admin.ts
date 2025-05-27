// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin (server-side)
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLOUD_CLIENT_EMAIL || "")}`,
    }

    initializeApp({
      credential: cert(credentials as any),
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    })
  }
}

// Get Firestore instance
export function getFirestoreAdmin() {
  initializeFirebaseAdmin()
  return getFirestore()
}
