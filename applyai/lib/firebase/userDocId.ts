/** Normalized email used as Firestore `users/{email}` document ID. */
export function userDocIdFromEmail(email: string | null | undefined): string {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized.includes('@')) {
    throw new Error('A valid email is required for the user profile document.');
  }
  return normalized;
}

export function tryUserDocIdFromEmail(email: string | null | undefined): string | null {
  try {
    return userDocIdFromEmail(email);
  } catch {
    return null;
  }
}
