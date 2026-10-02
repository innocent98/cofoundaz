'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import { useMe } from '@/hooks/useMe';
import { useStartupProfile } from '@/hooks/useStartupProfile';
import { logout } from '@/lib/api/profile';
import { Menu, LogOut, Info } from 'lucide-react';

function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="py-3 border-b border-sage-100 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-sage-500 mb-1">{label}</p>
      <p className="text-sm text-[#1D2A24]">{value?.trim() ? value : <span className="text-sage-400">Not set</span>}</p>
    </div>
  );
}

export default function AccountPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  const { me, loading } = useMe();
  const { name: startupName, stageLabel, logoUrl } = useStartupProfile();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    window.location.assign('/login');
  };

  const fullName = me?.profile.full_name ?? null;
  const email = me?.user.email ?? null;
  const role = me?.profile.role_title ?? null;
  const country = me?.profile.country ?? null;
  const avatarUrl = me?.profile.avatar_url ?? null;
  const membershipRole = me?.memberships?.[0]?.role ?? null;

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#1C201D] font-body">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 lg:px-8 py-4 border-b border-sage-200/60 bg-white">
        <button
          type="button"
          onClick={openSidebar}
          className="lg:hidden p-1.5 rounded-input text-sage-600 hover:bg-sage-100 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-sage-900">Account</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Honest editing note — profile edits are backend-blocked after onboarding */}
        <div className="flex items-start gap-3 bg-[#FBF3E9] border border-[#E7D3BC] rounded-card p-4">
          <Info className="w-4 h-4 shrink-0 text-[#9C5B34] mt-0.5" />
          <p className="text-sm text-[#6B4A2E]">
            Your details were set during onboarding. Editing your profile, workspace
            and photo here is coming soon; there’s no update endpoint for them yet.
          </p>
        </div>

        {/* Profile card */}
        <section className="bg-white border border-sage-200/60 rounded-card shadow-card p-6">
          <h2 className="text-base font-bold text-[#1D2A24] mb-4">Your profile</h2>
          <div className="flex items-center gap-4 mb-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Your profile photo" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-[#1F4D3A] text-white font-bold text-lg flex items-center justify-center shrink-0">
                {loading ? '' : initialsOf(fullName)}
              </div>
            )}
            <div className="min-w-0">
              <button
                type="button"
                disabled
                className="text-sm font-semibold text-sage-400 cursor-not-allowed"
                title="Changing your photo is coming soon"
              >
                Change photo
              </button>
              <p className="text-xs text-sage-500">Coming soon</p>
            </div>
          </div>

          <div className="mt-2">
            <Field label="Full name" value={loading ? '…' : fullName} />
            <Field label="Email" value={loading ? '…' : email} />
            <Field label="Role" value={loading ? '…' : role} />
            <Field label="Country" value={loading ? '…' : country} />
          </div>
        </section>

        {/* Workspace card */}
        <section className="bg-white border border-sage-200/60 rounded-card shadow-card p-6">
          <h2 className="text-base font-bold text-[#1D2A24] mb-4">Workspace</h2>
          <div className="flex items-center gap-4 mb-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${startupName ?? 'Workspace'} logo`} className="h-12 w-12 rounded-card object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-card bg-[#122E21] text-[#D89A6E] font-bold flex items-center justify-center shrink-0">
                {(startupName?.trim()?.charAt(0) || 'W').toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[#1D2A24] truncate">{startupName?.trim() || 'Your workspace'}</p>
              {stageLabel && <p className="text-xs text-sage-500">{stageLabel}</p>}
            </div>
          </div>
          <div className="mt-2">
            <Field label="Workspace name" value={startupName} />
            <Field label="Your role here" value={membershipRole} />
          </div>
        </section>

        {/* Log out */}
        <section className="bg-white border border-sage-200/60 rounded-card shadow-card p-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B42318] hover:text-[#8A1A12] disabled:opacity-60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </section>
      </main>
    </div>
  );
}
