// Role-based navigation (PRD §2.1): items the current role cannot open are
// hidden, never disabled. Roles are the membership role values from /auth/me.
// Access follows each module's "Access" line in the PRD; the server still
// enforces every route, this only decides what to show.

export type MemberRole =
  | 'founder'
  | 'team_member'
  | 'mentor'
  | 'investor'
  | 'legal_advisor'
  | 'accountant'
  | 'business_consultant';

const F: MemberRole = 'founder';
const TM: MemberRole = 'team_member';
const M: MemberRole = 'mentor';
const INV: MemberRole = 'investor';
const LA: MemberRole = 'legal_advisor';
const AC: MemberRole = 'accountant';
const BC: MemberRole = 'business_consultant';

const EVERYONE: MemberRole[] = [F, TM, M, INV, LA, AC, BC];

/** Allowed roles per sidebar route. A route that is not listed is visible to everyone. */
export const NAV_ROLES: Record<string, MemberRole[]> = {
  '/dashboard': EVERYONE,
  '/ai': [F, TM],
  '/mission': [F, TM],
  '/health': [F, TM, M, BC],
  '/roadmap': [F, TM, M, BC],
  '/business-builder': [F, TM, M, BC],
  '/validation': [F, TM],
  '/assessment': [F, TM],
  '/marketing': [F, TM],
  '/sales': [F, TM],
  '/finance': [F, TM, AC],
  '/funding': [F, TM, INV],
  '/investor-readiness': [F, TM, INV],
  '/legal': [F, TM, LA],
  '/marketplace': [F, TM],
  '/academy': [F, TM],
  '/documents': EVERYONE,
  // Every role may open Calendar: founders and team members get all of it, the rest only the meetings they are invited to
  // (read-only, GET /calendar/meetings). The calendar layout narrows the sub-pages by role.
  '/calendar': EVERYONE,
  '/team': [F, TM],
  '/analytics-reports': [F, TM, M, BC],
  '/journal': [F],
  '/notifications': EVERYONE,
  '/settings': EVERYONE,
};

const ROLE_LABELS: Record<MemberRole, string> = {
  founder: 'Founder',
  team_member: 'Team Member',
  mentor: 'Mentor',
  investor: 'Investor',
  legal_advisor: 'Legal Advisor',
  accountant: 'Accountant',
  business_consultant: 'Business Consultant',
};

/** Display name of a workspace role ('team_member' -> 'Team Member'). */
export function roleLabel(role: MemberRole): string {
  return ROLE_LABELS[role];
}

export function asMemberRole(role: string | null | undefined): MemberRole | null {
  return EVERYONE.includes(role as MemberRole) ? (role as MemberRole) : null;
}

/**
 * Whether `role` may see `href` in the navigation. An unknown role (the profile
 * failed to load) shows everything except founder-only routes: the server is the
 * gate, and a false hide would strand a legitimate user.
 */
export function canSee(href: string, role: MemberRole | null): boolean {
  const allowed = NAV_ROLES[href];
  if (!allowed) return true;
  if (role === null) return href !== '/journal';
  return allowed.includes(role);
}

/** Only founders may invite people from the top bar (PRD §2.1: "+ Invite" is F only). */
export function canInvite(role: MemberRole | null): boolean {
  return role === 'founder';
}

/** Only founders take or resume the assessment; team members read its results (PRD Module 07 access). */
export function canTakeAssessment(role: MemberRole | null): boolean {
  return role === 'founder';
}

/**
 * The NAV_ROLES key a URL belongs to ('/mission/settings' -> '/mission'), or
 * null when the path is not a gated section.
 */
export function routeKeyFor(pathname: string): string | null {
  const first = '/' + (pathname.split('?')[0].split('/')[1] ?? '');
  return first in NAV_ROLES ? first : null;
}

/** Whether `role` may open `pathname` by URL. Same rules as `canSee`, applied to the section the path is in. */
export function canOpenPath(pathname: string, role: MemberRole | null): boolean {
  const key = routeKeyFor(pathname);
  return key === null ? true : canSee(key, role);
}
