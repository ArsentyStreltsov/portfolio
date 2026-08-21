/** Canonical site origin — set NEXT_PUBLIC_SITE_URL in production. */
export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://arsentystreltsov.com").replace(/\/$/, "");
}
