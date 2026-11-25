
const { initializeApp, applicationDefault, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase only once
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: applicationDefault(),
    });

// Initialize Firestore
const db = getFirestore(firebaseApp);

console.log("Firebase Admin initialized successfully");

module.exports = {
  db,
  firebaseApp,
};
