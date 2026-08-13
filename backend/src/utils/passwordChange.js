export const MAX_PASSWORD_CHANGES_PER_DAY = 3

/**
 * True when the given JWT (access or refresh) was issued before the user's last
 * password change, meaning the token belongs to an obsolete session.
 */
export function wasIssuedBeforePasswordChange(issuedAtSeconds, passwordChangedAt) {
  if (!passwordChangedAt) return false
  return issuedAtSeconds ? issuedAtSeconds * 1000 < new Date(passwordChangedAt).getTime() : true
}

/** The current UTC calendar day as a `YYYY-MM-DD` string. */
export function todayUtcString() {
  return new Date().toISOString().slice(0, 10)
}

/** Epoch milliseconds of the start (midnight) of the current UTC day. */
export function utcStartOfToday() {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

/** Daily password-change usage info for a user document. */
export function passwordChangeStatus(user) {
  const lastChangeStr = user.passwordChangedAt ? user.passwordChangedAt.toISOString().slice(0, 10) : null
  const usedToday = lastChangeStr === todayUtcString() ? user.passwordChangeCount || 0 : 0

  return {
    maxPerDay: MAX_PASSWORD_CHANGES_PER_DAY,
    usedToday,
    remaining: Math.max(0, MAX_PASSWORD_CHANGES_PER_DAY - usedToday),
  }
}