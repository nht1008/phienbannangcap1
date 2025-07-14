import admin from 'firebase-admin';
import 'firebase-admin/firestore';
import 'firebase-admin/storage';

const ADMIN_APP_NAME = 'firebase-admin-app-singleton';

function initializeAdminApp() {
  if (admin.apps.find(app => app?.name === ADMIN_APP_NAME)) {
    return admin.app(ADMIN_APP_NAME);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('CRITICAL: Missing one or more Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    throw new Error('Firebase Admin SDK initialization failed: Missing required environment variables.');
  }

  // Replace escaped newlines from the environment variable with actual newlines
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey: formattedPrivateKey,
  };

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
    storageBucket: `phienbannangcap.firebasestorage.app`
  }, ADMIN_APP_NAME);
}

export const getAdminRealtimeDB = () => {
  const app = initializeAdminApp();
  return app.database();
};

export const getAdminFirestore = () => {
  const app = initializeAdminApp();
  return app.firestore();
};

export const getAdminAuth = () => {
  const app = initializeAdminApp();
  return app.auth();
};

export const getAdminStorage = () => {
  const app = initializeAdminApp();
  return app.storage();
};
