export const PWA_STANDALONE_COOKIE = "ms_pwa_standalone";
export const PWA_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export function getPwaSessionExpiresAt(from = new Date()) {
  return new Date(from.getTime() + PWA_SESSION_MAX_AGE_SECONDS * 1000);
}

export function withPwaSessionCookieAttributes<T extends object>(
  attributes: T,
  expiresAt = getPwaSessionExpiresAt(),
) {
  return {
    ...attributes,
    maxAge: PWA_SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
  };
}
