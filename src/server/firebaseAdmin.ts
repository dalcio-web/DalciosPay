import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, '\n');

function getFirebaseAdminApp() {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
      }),
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault(), projectId });
  }

  throw new Error(
    'Firebase Admin não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.',
  );
}

export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken> {
  const auth = getAuth(getFirebaseAdminApp());
  return auth.verifyIdToken(token, true);
}
