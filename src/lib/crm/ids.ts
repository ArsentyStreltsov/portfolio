import { randomBytes } from "node:crypto";

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short opaque lead id, e.g. L7K2P9 */
export function generateLeadId() {
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += ID_CHARS[randomBytes(1)[0]! % ID_CHARS.length];
  }
  return `L${suffix}`;
}

export function nextTouchId(leadId: string, existingCount: number) {
  const n = String(existingCount + 1).padStart(2, "0");
  return `${leadId}_${n}`;
}
