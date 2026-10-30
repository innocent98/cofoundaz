'use client';

import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import { useWorkspace } from '@/components/workspace-context';
import { apiErrorInfo } from '@/lib/api/api-error';
import { logout } from '@/lib/api/profile';
import { removeAvatar, updateProfile, uploadAvatar, type ProfilePatch } from '@/lib/api/settings';
import { COUNTRIES } from '@/lib/countries';
import { Button, Card, FieldError, Label, Select, Spinner, TextInput, imageSrc, initialsOf } from './ui';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

interface Form {
  full_name: string;
  role_title: string;
  country: string;
  phone: string;
}

export function ProfileTab(): React.JSX.Element {
  const { me, loading, setMe } = useWorkspace();
  const profile = me?.profile ?? null;

  const saved = useMemo<Form>(
    () => ({
      full_name: profile?.full_name ?? '',
      role_title: profile?.role_title ?? '',
      country: profile?.country ?? '',
      phone: profile?.phone ?? '',
    }),
    [profile],
  );
  const [draft, setDraft] = useState<Partial<Form>>({});
  const form: Form = { ...saved, ...draft };
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading || !me || !profile) return <Spinner label="Loading your profile" />;

  const dirty = (Object.keys(form) as Array<keyof Form>).some((k) => form[k] !== saved[k]);
  const avatar = imageSrc(profile.avatar_url);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !dirty) return;
    const patch: ProfilePatch = {};
    if (form.full_name !== saved.full_name) patch.full_name = form.full_name.trim();
    if (form.role_title !== saved.role_title) patch.role_title = form.role_title.trim();
    if (form.country !== saved.country) patch.country = form.country || null;
    if (form.phone !== saved.phone) patch.phone = form.phone.trim() || null;
    const local: typeof errors = {};
    if ('full_name' in patch && !patch.full_name) local.full_name = 'Enter your name.';
    if ('role_title' in patch && !patch.role_title) local.role_title = 'Enter your role.';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      setMe(await updateProfile(patch));
      setDraft({});
      setErrors({});
      toast.success('Profile saved.');
    } catch (err) {
      const info = apiErrorInfo(err, "We couldn't save your profile. Try again.");
      const next: typeof errors = {};
      for (const f of info.fieldErrors) if (f.field in form) next[f.field as keyof Form] = f.message;
      setErrors(next);
      setFormError(Object.keys(next).length ? null : info.message);
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setPhotoError('Use a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setPhotoError('That image is over 2 MB. Choose a smaller one.');
      return;
    }
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      setMe(await uploadAvatar(file));
      toast.success('Photo updated.');
    } catch (err) {
      setPhotoError(apiErrorInfo(err, "We couldn't upload that photo.").message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const onRemovePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      setMe(await removeAvatar());
      toast.success('Photo removed.');
    } catch (err) {
      setPhotoError(apiErrorInfo(err, "We couldn't remove your photo.").message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    window.location.assign('/login');
  };

  return (
    <div className="space-y-6">
      <Card title="Your profile" description="This is how you appear to your team on comments, invitations and certificates.">
        <div className="flex items-center gap-4 mb-6">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Your profile photo" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div
              aria-hidden
              className="h-16 w-16 rounded-full bg-brand-900 text-white font-bold text-lg flex items-center justify-center shrink-0"
            >
              {initialsOf(profile.full_name)}
            </div>
          )}
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Choose a profile photo"
                onChange={onPhoto}
              />
              <Button variant="secondary" loading={photoBusy} onClick={() => fileRef.current?.click()}>
                {profile.avatar_url ? 'Change photo' : 'Upload photo'}
              </Button>
              {profile.avatar_url && (
                <Button variant="ghost" disabled={photoBusy} onClick={onRemovePhoto}>
                  Remove photo
                </Button>
              )}
            </div>
            <p className="text-[11px] text-ink-subtle">PNG, JPG or WebP, up to 2 MB.</p>
            <FieldError message={photoError} />
          </div>
        </div>

        <form onSubmit={save} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="pf-name">Full name</Label>
            <TextInput id="pf-name" value={form.full_name} onChange={set('full_name')} maxLength={120} autoComplete="name" aria-invalid={!!errors.full_name} />
            <FieldError message={errors.full_name} />
          </div>
          <div>
            <Label htmlFor="pf-email">Email</Label>
            <TextInput id="pf-email" value={me.user.email} readOnly disabled aria-describedby="pf-email-note" />
            <p id="pf-email-note" className="text-[11px] text-ink-subtle mt-1.5">You sign in with this address. It can&rsquo;t be changed here.</p>
          </div>
          <div>
            <Label htmlFor="pf-role">Role or title</Label>
            <TextInput id="pf-role" value={form.role_title} onChange={set('role_title')} maxLength={120} autoComplete="organization-title" aria-invalid={!!errors.role_title} />
            <FieldError message={errors.role_title} />
          </div>
          <div>
            <Label htmlFor="pf-country">Country</Label>
            <Select id="pf-country" value={form.country} onChange={set('country')} autoComplete="country" aria-invalid={!!errors.country}>
              <option value="">Not set</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.country} />
          </div>
          <div>
            <Label htmlFor="pf-phone">Phone</Label>
            <TextInput id="pf-phone" type="tel" value={form.phone} onChange={set('phone')} maxLength={32} placeholder="+234 801 234 5678" autoComplete="tel" aria-invalid={!!errors.phone} />
            <FieldError message={errors.phone} />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
            {dirty && !saving && (
              <Button variant="ghost" onClick={() => { setDraft({}); setErrors({}); setFormError(null); }}>
                Discard
              </Button>
            )}
            <FieldError message={formError} />
          </div>
        </form>
      </Card>

      <Card>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 text-sm font-semibold text-danger-xb42318 hover:text-danger-x8a1a12 disabled:opacity-60 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </Card>
    </div>
  );
}
