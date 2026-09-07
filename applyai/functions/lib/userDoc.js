"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailDocId = emailDocId;
exports.getUserProfileDoc = getUserProfileDoc;
exports.userDocRef = userDocRef;
const index_1 = require("./index");
function emailDocId(email) {
    const normalized = String(email || "")
        .trim()
        .toLowerCase();
    return normalized.includes("@") ? normalized : null;
}
/** Load users/{email} (preferred) with legacy users/{uid} fallback. */
async function getUserProfileDoc(auth) {
    const emailKey = emailDocId(auth.token.email);
    if (emailKey) {
        const byEmail = await index_1.db.collection("users").doc(emailKey).get();
        if (byEmail.exists) {
            return { refId: emailKey, data: byEmail.data(), snap: byEmail };
        }
    }
    const byUidField = await index_1.db.collection("users").where("uid", "==", auth.uid).limit(1).get();
    if (!byUidField.empty) {
        const d = byUidField.docs[0];
        return { refId: d.id, data: d.data(), snap: d };
    }
    const legacy = await index_1.db.collection("users").doc(auth.uid).get();
    if (legacy.exists) {
        return { refId: auth.uid, data: legacy.data(), snap: legacy };
    }
    return null;
}
function userDocRef(auth) {
    const emailKey = emailDocId(auth.token.email);
    return index_1.db.collection("users").doc(emailKey || auth.uid);
}
//# sourceMappingURL=userDoc.js.map