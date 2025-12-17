import "dotenv/config";
import admin from "firebase-admin";
import path from "path";
import { readFileSync } from "fs";

let app: admin.app.App | null = null;

export function getFirestore() {
  if (!app) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath) throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");

    const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id,
    });
  }

  return admin.firestore();
}
