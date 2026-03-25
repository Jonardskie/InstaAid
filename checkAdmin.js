const admin = require("firebase-admin");
const serviceAccount = require("./accident-detection-4db90-firebase-adminsdk-fbsvc-29429e2f6b.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function checkAdmin() {
  const uid = "NTpDGjYfbCg4j3ikiD9aA1v9xwO2"; // replace with your admin's UID
  const user = await admin.auth().getUser(uid);
  console.log("✅ User claims:", user.customClaims || {});
}

checkAdmin();
