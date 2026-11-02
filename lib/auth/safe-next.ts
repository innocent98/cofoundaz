// A `?next=` param is honored only when it's a safe internal path, never an external or auth URL.
export function safeNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/signup")) {
    return next;
  }
  return null;
}
