
// This is a placeholder for your service account credentials.
// In a production environment, you should use environment variables
// or a secret manager to store these credentials securely.

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_CLIENT_X509_CERT_URL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable for Firebase Admin SDK: ${envVar}`);
  }
}


export const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID!,
  // The private key must have newline characters correctly escaped.
  // When stored in an environment variable, newlines are often replaced with '\\n'.
  // This line ensures they are converted back to actual newline characters.
  "private_key": (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL!,
  "client_id": process.env.FIREBASE_CLIENT_ID!,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL!
};
