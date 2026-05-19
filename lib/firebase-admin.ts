import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK - used in API routes (server-side)
function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  // Try to use service account from env var (JSON string)
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  // Fallback: use project ID only (works with default credentials in cloud)
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const app = initAdmin();
export const adminDb = getFirestore(app);

// Firestore collection references
export const collections = {
  users: adminDb.collection('users'),
  projects: adminDb.collection('projects'),
  tasks: adminDb.collection('tasks'),
  attachments: adminDb.collection('attachments'),
  transactions: adminDb.collection('transactions'),
  comments: adminDb.collection('comments'),
  activityLogs: adminDb.collection('activityLogs'),
};
