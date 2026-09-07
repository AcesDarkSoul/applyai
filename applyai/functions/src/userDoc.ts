import type { DocumentData, DocumentSnapshot } from "firebase-admin/firestore";
import { db } from "./index";

export function emailDocId(email: string | null | undefined): string | null {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

/** Load users/{email} (preferred) with legacy users/{uid} fallback. */
export async function getUserProfileDoc(auth: {
  uid: string;
  token: { email?: string };
}): Promise<{ refId: string; data: DocumentData; snap: DocumentSnapshot } | null> {
  const emailKey = emailDocId(auth.token.email);

  if (emailKey) {
    const byEmail = await db.collection("users").doc(emailKey).get();
    if (byEmail.exists) {
      return { refId: emailKey, data: byEmail.data()!, snap: byEmail };
    }
  }

  const byUidField = await db.collection("users").where("uid", "==", auth.uid).limit(1).get();
  if (!byUidField.empty) {
    const d = byUidField.docs[0];
    return { refId: d.id, data: d.data(), snap: d };
  }

  const legacy = await db.collection("users").doc(auth.uid).get();
  if (legacy.exists) {
    return { refId: auth.uid, data: legacy.data()!, snap: legacy };
  }

  return null;
}

export function userDocRef(auth: { uid: string; token: { email?: string } }) {
  const emailKey = emailDocId(auth.token.email);
  return db.collection("users").doc(emailKey || auth.uid);
}
