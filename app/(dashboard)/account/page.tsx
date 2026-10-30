import { redirect } from 'next/navigation';

/** The avatar-menu "Account & profile" link now opens the Profile tab of the Settings hub. */
export default function AccountPage(): never {
  redirect('/settings?tab=profile');
}
