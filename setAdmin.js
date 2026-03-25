const admin = require("firebase-admin");
const serviceAccount = require("./accident-detection-4db90-firebase-adminsdk-fbsvc-29429e2f6b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin() {
  const adminUid = "NTpDGjYfbCg4j3ikiD9aA1v9xwO2"; // replace with your admin user's UID
  await admin.auth().setCustomUserClaims(adminUid, { admin: true });
  console.log("✅ Admin claim set successfully!");
}

setAdmin();
