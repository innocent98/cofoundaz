'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorInfo } from '@/lib/api/api-error';
import { getWorkspace, updateWorkspace, uploadWorkspaceLogo, type WorkspacePatch, type WorkspaceSettings } from '@/lib/api/settings';
import { COUNTRIES } from '@/lib/countries';
import { Banner, Button, Card, FieldError, Label, LoadError, Select, Spinner, TextArea, TextInput, imageSrc } from './ui';

const MODELS: Array<[string, string]> = [
  ['b2b', 'B2B'], ['b2c', 'B2C'], ['b2b2c', 'B2B2C'], ['marketplace', 'Marketplace'], ['hardware', 'Hardware'], ['services', 'Services'],
];
const STAGES: Array<[string, string]> = [
  ['idea', 'Idea'], ['validation', 'Validation'], ['build', 'Build'], ['launch', 'Launch'], ['growth', 'Growth'], ['scale', 'Scale'],
];

type Form = Record<'name' | 'description' | 'website' | 'industry' | 'business_model' | 'stage' | 'country', string>;

const toForm = (w: WorkspaceSettings): Form => ({
  name: w.name ?? '',
  description: w.description ?? '',
  website: w.website ?? '',
  industry: w.industry ?? '',
  business_model: w.business_model ?? '',
  stage: w.stage ?? '',
  country: w.country ?? '',
});

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function WorkspaceTab({ onSaved }: { onSaved?: () => void }): React.JSX.Element {
  const [ws, setWs] = useState<WorkspaceSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const w = await getWorkspace();
      setWs(w);
      setForm(toForm(w));
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorInfo(err, "We couldn't load the workspace.").message);
    }
  }, []);
  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loadError) return <LoadError message={loadError} onRetry={load} />;
  if (!ws || !form) return <Spinner label="Loading workspace" />;

  const canEdit = ws.can_edit;
  const saved = toForm(ws);
  const dirty = (Object.keys(form) as Array<keyof Form>).some((k) => form[k] !== saved[k]);
  const logo = imageSrc(ws.logo_url);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !dirty) return;
    if (!form.name.trim()) return setErrors({ name: 'Enter a workspace name.' });
    const patch: WorkspacePatch = {};
    (Object.keys(form) as Array<keyof Form>).forEach((k) => {
      if (form[k] === saved[k]) return;
      // Optional text clears with an empty string; name and the enums are never cleared.
      (patch as Record<string, string>)[k] = form[k].trim();
    });
    setSaving(true);
    setFormError(null);
    try {
      const w = await updateWorkspace(patch);
      setWs(w);
      setForm(toForm(w));
      setErrors({});
      toast.success('Workspace saved.');
      onSaved?.();
    } catch (err) {
      const info = apiErrorInfo(err, "We couldn't save the workspace. Try again.");
      const next: typeof errors = {};
      for (const f of info.fieldErrors) if (f.field in form) next[f.field as keyof Form] = f.message;
      setErrors(next);
      setFormError(Object.keys(next).length ? null : info.message);
    } finally {
      setSaving(false);
    }
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setLogoError('Use a PNG, JPG or WebP image.');
    if (file.size > MAX_LOGO_BYTES) return setLogoError('That image is over 2 MB. Choose a smaller one.');
    setLogoBusy(true);
    setLogoError(null);
    try {
      const w = await uploadWorkspaceLogo(file);
      setWs(w);
      toast.success('Logo updated.');
      onSaved?.();
    } catch (err) {
      setLogoError(apiErrorInfo(err, "We couldn't upload that logo.").message);
    } finally {
      setLogoBusy(false);
    }
  };

  const dis = !canEdit;
  return (
    <div className="space-y-6">
      {!canEdit && <Banner tone="info">Only the workspace founder can change these details.</Banner>}
      <Card title="Workspace" description="Shown in the sidebar, on documents and in invitations.">
        <div className="flex items-center gap-4 mb-6">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`${ws.name} logo`} className="h-14 w-14 rounded-card object-cover" />
          ) : (
            <div aria-hidden className="h-14 w-14 rounded-card bg-brand-900 text-accent-500 font-bold text-lg flex items-center justify-center shrink-0">
              {(ws.name.trim().charAt(0) || 'W').toUpperCase()}
            </div>
          )}
          {canEdit && (
            <div className="space-y-1.5">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose a workspace logo" onChange={onLogo} />
              <Button variant="secondary" loading={logoBusy} onClick={() => fileRef.current?.click()}>
                {ws.logo_url ? 'Change logo' : 'Upload logo'}
              </Button>
              <p className="text-[11px] text-ink-subtle">PNG, JPG or WebP, up to 2 MB.</p>
              <FieldError message={logoError} />
            </div>
          )}
        </div>

        <form onSubmit={save} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="ws-name">Workspace name</Label>
            <TextInput id="ws-name" value={form.name} onChange={set('name')} disabled={dis} maxLength={120} aria-invalid={!!errors.name} />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="ws-website">Website</Label>
            <TextInput id="ws-website" value={form.website} onChange={set('website')} disabled={dis} placeholder="https://yourstartup.com" inputMode="url" aria-invalid={!!errors.website} />
            <FieldError message={errors.website} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="ws-desc">Description</Label>
            <TextArea id="ws-desc" value={form.description} onChange={set('description')} disabled={dis} maxLength={1000} />
            <FieldError message={errors.description} />
          </div>
          <div>
            <Label htmlFor="ws-industry">Industry</Label>
            <TextInput id="ws-industry" value={form.industry} onChange={set('industry')} disabled={dis} maxLength={80} />
            <FieldError message={errors.industry} />
          </div>
          <div>
            <Label htmlFor="ws-country">Country</Label>
            <Select id="ws-country" value={form.country} onChange={set('country')} disabled={dis}>
              <option value="">Not set</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </Select>
            <FieldError message={errors.country} />
          </div>
          <div>
            <Label htmlFor="ws-model">Business model</Label>
            <Select id="ws-model" value={form.business_model} onChange={set('business_model')} disabled={dis}>
              {!form.business_model && <option value="">Not set</option>}
              {MODELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <FieldError message={errors.business_model} />
          </div>
          <div>
            <Label htmlFor="ws-stage">Stage</Label>
            <Select id="ws-stage" value={form.stage} onChange={set('stage')} disabled={dis}>
              {!form.stage && <option value="">Not set</option>}
              {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <FieldError message={errors.stage} />
          </div>
          {canEdit && (
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
              {dirty && !saving && (
                <Button variant="ghost" onClick={() => { setForm(saved); setErrors({}); setFormError(null); }}>Discard</Button>
              )}
              <FieldError message={formError} />
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
