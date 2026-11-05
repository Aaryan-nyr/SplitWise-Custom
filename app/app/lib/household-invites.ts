import { createHash } from "node:crypto";

export const HOUSEHOLD_INVITE_VALIDITY_DAYS = 1;

export function hashHouseholdInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isHouseholdInviteToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
