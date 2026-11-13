export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** A light, local hint for the sign-up meter. The API's rule (8+ characters, one number) stays the authority. */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw) && /[A-Za-z]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  if (/[^A-Za-z0-9]/.test(pw) && /[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'] as const;
  const s = (pw.length < 8 ? 0 : Math.max(1, score)) as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: labels[s] };
}
