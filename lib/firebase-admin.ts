import { initializeApp, getApps, cert, Application } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Firebase Admin SDK - used in API routes (server-side)
let app: Application | null = null;
let adminDbInstance: Firestore | null = null;

function initAdmin(): Application {
  if (getApps().length > 0) return getApps()[0] as Application;

  // Try to use service account from env var (JSON string)
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  // Fallback: use project ID only (works with Application Default Credentials in cloud)
  // For local development without service account, Firestore will use emulator or default credentials
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  });
}

try {
  app = initAdmin();
  adminDbInstance = getFirestore(app);

  // Configure Firestore settings for better compatibility
  adminDbInstance.settings({
    ignoreUndefinedProperties: true,
  });
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export const adminDb = adminDbInstance!;
export const collections = {
  users: adminDb.collection('users'),
  projects: adminDb.collection('projects'),
  tasks: adminDb.collection('tasks'),
  attachments: adminDb.collection('attachments'),
  transactions: adminDb.collection('transactions'),
  comments: adminDb.collection('comments'),
  activityLogs: adminDb.collection('activityLogs'),
};
