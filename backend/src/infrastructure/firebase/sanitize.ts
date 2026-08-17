/** Drop `undefined` everywhere — Firestore rejects nested undefined in arrays/objects. */
export function omitUndefinedDeep<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => omitUndefinedDeep(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (nested === undefined) continue;
    out[key] = omitUndefinedDeep(nested);
  }
  return out as T;
}
