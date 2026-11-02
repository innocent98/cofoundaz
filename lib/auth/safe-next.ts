// One rule for every post-login redirect target (matches the API): a single
// leading "/", no "//", no backslash (browsers read "/\" as "//"), no control
// characters or whitespace, no scheme. Percent-encoding is decoded first so
// "%5C" and "%2F" can't smuggle any of that past the check.
export function isSafeInternalPath(p: string | null | undefined): p is string {
  if (!p || !p.startsWith('/') || p.startsWith('//')) return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(p);
  } catch {
    return false;
  }
  if (decoded.startsWith('//') || /[\\\s\u0000-\u001f\u007f]/.test(decoded) || /[\\\s\u0000-\u001f\u007f]/.test(p)) {
    return false;
  }
  return true;
}

// A `?next=` param is honored only when it's a safe internal path, never an external or auth URL.
export function safeNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  if (isSafeInternalPath(next) && !next.startsWith("/login") && !next.startsWith("/signup")) {
    return next;
  }
  return null;
}
