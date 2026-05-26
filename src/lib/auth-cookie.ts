export function shouldUseSecureAuthCookies() {
  const override = process.env.AUTH_COOKIE_SECURE;

  if (override === "false") return false;
  if (override === "true") return true;

  return process.env.NODE_ENV === "production";
}
