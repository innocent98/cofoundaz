// The one place that asks "is there a session in this browser?". D-AUTH-6 (tokens out of
// localStorage) changes only this function.
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem('cf_token');
  } catch {
    return false;
  }
}
