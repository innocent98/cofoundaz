'use client';

import React, { useState } from 'react';
import { Plus, X, Trash2, Copy } from 'lucide-react';
import { useSignatureRequests } from '@/hooks/useSignatureRequests';
import { useDocumentFiles } from '@/hooks/useDocumentFiles';
import { useToast } from '../ToastContext';

export default function SignaturesPage() {
  const { requests, loading, createRequest, cancelRequest, remindRequest } = useSignatureRequests();
  const { files } = useDocumentFiles();
  const { triggerToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileId, setFileId] = useState('');
  const [title, setTitle] = useState('');
  const [signers, setSigners] = useState<{ email: string; name: string }[]>([{ email: '', name: '' }]);
  const [sending, setSending] = useState(false);
  const [signerLinks, setSignerLinks] = useState<string[] | null>(null);

  const openModal = () => {
    setFileId(files[0]?.id ?? '');
    setTitle('');
    setSigners([{ email: '', name: '' }]);
    setSignerLinks(null);
    setIsModalOpen(true);
  };

  const updateSigner = (i: number, field: 'email' | 'name', value: string) =>
    setSigners((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  const addSigner = () => setSigners((prev) => [...prev, { email: '', name: '' }]);
  const removeSigner = (i: number) => setSigners((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId) {
      triggerToast('Pick a file to send for signature.');
      return;
    }
    const cleanSigners = signers.filter((s) => s.email.trim()).map((s) => ({ email: s.email.trim(), name: s.name.trim() || undefined }));
    if (cleanSigners.length === 0) {
      triggerToast('Add at least one signer.');
      return;
    }
    setSending(true);
    const res = await createRequest(fileId, cleanSigners, title.trim() || undefined);
    setSending(false);
    if (res.ok) {
      setSignerLinks(res.signerLinks ?? []);
      triggerToast('Signature request sent.');
    } else {
      triggerToast(res.error || 'Could not send for signature.');
    }
  };

  const handleCancel = async (id: string, reqTitle: string) => {
    await cancelRequest(id);
    triggerToast(`Cancelled “${reqTitle}”.`);
  };

  const handleRemind = async (id: string) => {
    const ok = await remindRequest(id);
    triggerToast(ok ? 'Reminder sent to unsigned signers.' : 'Could not send reminder.');
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Awaiting':
        return 'bg-[#F2ECE1] text-[#7A6025]';
      case 'Complete':
        return 'bg-[#E5EFEA] text-[#1E3E2B]';
      case 'Cancelled':
        return 'bg-[#ECEEEF] text-[#55625A]';
      case 'Expired':
        return 'bg-[#FDF2F2] text-[#B93838]';
      default:
        return 'bg-[#F5F5F0] text-[#617065]';
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-[#1C2621] tracking-tight mb-1">E-signature requests</h1>
          <p className="text-xs text-[#738279]">Track pending and completed document signatures.</p>
        </div>
        <button
          onClick={openModal}
          className="shrink-0 px-4 py-1.5 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-card text-xs font-semibold flex items-center space-x-1 shadow-card transition-colors h-[34px]"
        >
          <Plus size={14} />
          <span>New request</span>
        </button>
      </div>

      {/* Legal caveat — surface, don't bury (guide §11) */}
      <p className="text-[11px] text-[#8E9B90] -mt-4">
        These signatures record intent and a timestamped audit trail; they are not a substitute for
        legal advice on enforceability in your jurisdiction.
      </p>

      {!loading && requests.length === 0 && (
        <div className="bg-white border border-[#E8E8E2] rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-[#1E2923]">No signature requests yet</p>
          <p className="text-xs text-[#8E9B90] mt-1">Send a file to collaborators to collect signatures.</p>
          <button
            onClick={openModal}
            className="mt-4 px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-card text-xs font-semibold shadow-card transition-colors"
          >
            New request
          </button>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white border border-[#E8E8E2] rounded-modal p-6 shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#EFF6FF] text-[#1D4ED8]">FILE</span>
                <div>
                  <h3 className="font-semibold text-xs text-[#1E2923]">{req.title}</h3>
                  <p className="text-xs text-[#8E9B90] mt-0.5">
                    {req.fileName} • {req.signedCount} of {req.total} signed
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 self-end md:self-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyles(req.status)}`}>
                  {req.status}
                </span>
                {req.status === 'Awaiting' && (
                  <>
                    <button onClick={() => handleRemind(req.id)} className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors">
                      Remind
                    </button>
                    <button onClick={() => handleCancel(req.id, req.title)} className="text-xs font-semibold text-[#B93838] hover:opacity-80 transition-opacity">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-[#E8E8E2] pt-3 flex flex-wrap gap-4 text-xs text-[#617065]">
              {req.signers.map((s, sIdx) => (
                <div key={sIdx} className="flex items-center space-x-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${s.signed ? 'bg-[#E5EFEA] text-[#1E3E2B]' : 'bg-[#F5F5F0] text-[#8E9B90]'}`}>
                    {s.signed ? '✓' : '•'}
                  </span>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New request modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#061A12]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal w-full max-w-md shadow-raised overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#FBFBFA]">
              <h3 className="font-bold text-[#1E2923]">Send for signature</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8E9B90] hover:text-[#1E2923] transition-colors p-1 rounded-input hover:bg-[#E8E8E2]">
                <X size={16} />
              </button>
            </div>

            {signerLinks ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-[#1E2923] font-semibold">Signature request sent</p>
                <p className="text-xs text-[#738279]">Per-signer links (shown once — signers also receive them by email):</p>
                <div className="space-y-2">
                  {signerLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input readOnly value={link} className="flex-1 border border-[#D5DDD6] rounded-input px-3 py-2 text-xs text-[#1E2923] bg-[#FBFBFA] truncate" />
                      <button type="button" onClick={() => { navigator.clipboard?.writeText(link); triggerToast('Link copied.'); }} className="shrink-0 px-3 py-2 bg-[#183B28] hover:bg-[#122E21] text-white rounded-input text-xs font-bold flex items-center gap-1.5">
                        <Copy size={13} /> Copy
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-end">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider">File</label>
                  {files.length === 0 ? (
                    <p className="text-xs text-[#B93838]">Upload a file in the Library first — signatures are collected on a file.</p>
                  ) : (
                    <select value={fileId} onChange={(e) => setFileId(e.target.value)} className="w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#4D6D58]">
                      {files.map((f) => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider">Title (optional)</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the file name" className="w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58]" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider">Signers</label>
                  {signers.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="email" required value={s.email} onChange={(e) => updateSigner(i, 'email', e.target.value)} placeholder="email@company.com" className="flex-1 border border-[#D5DDD6] rounded-input px-3 py-2 text-xs focus:outline-none focus:border-[#4D6D58]" />
                      <input value={s.name} onChange={(e) => updateSigner(i, 'name', e.target.value)} placeholder="Name" className="w-28 border border-[#D5DDD6] rounded-input px-3 py-2 text-xs focus:outline-none focus:border-[#4D6D58]" />
                      <button type="button" onClick={() => removeSigner(i)} className="text-[#9CA8A0] hover:text-[#B93838] transition-colors shrink-0" aria-label="Remove signer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addSigner} className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors">+ Add signer</button>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors">Cancel</button>
                  <button type="submit" disabled={sending || files.length === 0} className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#122E21] text-white rounded-card text-sm font-bold transition-colors shadow-card disabled:opacity-60">
                    {sending ? 'Sending…' : 'Send request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
