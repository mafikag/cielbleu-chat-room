require("dotenv").config();

const path = require("path");
const admin = require("firebase-admin");

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    return admin.credential.cert(serviceAccount);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    const serviceAccountPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(__dirname, "..", configuredPath);
    const serviceAccount = require(serviceAccountPath);

    return admin.credential.cert(serviceAccount);
  }

  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  const appOptions = {
    credential: getCredential()
  };

  if (process.env.FIREBASE_PROJECT_ID) {
    appOptions.projectId = process.env.FIREBASE_PROJECT_ID;
  }

  admin.initializeApp(appOptions);
}

const db = admin.firestore();

module.exports = {
  admin,
  db
};
