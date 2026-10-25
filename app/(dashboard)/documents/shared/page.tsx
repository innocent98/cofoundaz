'use client';

import React, { useState } from 'react';
import { FileText, X, Trash2, Check } from 'lucide-react';
import { useDocumentShares } from '@/hooks/useDocumentShares';
import { useToast } from '../ToastContext';

export default function SharedPage() {
  const { shares, loading, revokeShare } = useDocumentShares();
  const { triggerToast } = useToast();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'View' | 'Comment'>('View');
  const [linkExpires, setLinkExpires] = useState(true);

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sharing is initiated per-document (from a document's own view); this
    // overview modal is a follow-up once the rich-documents list is wired.
    setIsShareModalOpen(false);
    triggerToast('Open a document to share it.');
  };

  const handleRevoke = async (documentId: string, shareId: string) => {
    await revokeShare(documentId, shareId);
    triggerToast('Access revoked.');
  };

  const accessBadgeStyles = 'bg-neutral-xe5efea text-brand-x1e3e2b';

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Shared with others</h1>
        <p className="text-xs text-neutral-x738279">Files shared with external collaborators and advisors.</p>
      </div>

      <div className="bg-white border border-line rounded-modal shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-line text-[10px] font-bold text-ink-subtle uppercase tracking-wider bg-white">
              <th className="py-3 px-6">Document</th>
              <th className="py-3 px-6">Shared with</th>
              <th className="py-3 px-6">Access</th>
              <th className="py-3 px-6">Last viewed</th>
              <th className="py-3 px-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs">
            {shares.map((item) => (
              <tr key={item.id} className="hover:bg-surface-faint transition-colors">
                <td className="py-3 px-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-ink-subtle" />
                    <span className="font-medium text-ink">{item.document}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-neutral-x55625a">{item.sharedWith}</td>
                <td className="py-3 px-6">
                  <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${accessBadgeStyles}`}>
                    {item.access}
                  </span>
                </td>
                <td className="py-3 px-6 text-ink-subtle">{item.lastViewed}</td>
                <td className="py-3 px-6 text-right">
                  <button
                    type="button"
                    aria-label={`Revoke access for ${item.sharedWith}`}
                    onClick={() => handleRevoke(item.documentId, item.id)}
                    className="text-neutral-x9ca8a0 hover:text-danger-bold transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && shares.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-ink">Nothing shared yet</p>
            <p className="text-xs text-ink-subtle mt-1">
              Open a document and share it with a collaborator to see it here.
            </p>
          </div>
        )}
      </div>
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-brand-x061a12/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-modal w-full max-w-md shadow-raised overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-faint">
              <h3 className="font-bold text-ink">Share document</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-input hover:bg-line">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleShareSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-x55625a uppercase tracking-wider">Email address</label>
                <input 
                  type="email" 
                  required
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus placeholder:text-brand-xa3b899"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-x55625a uppercase tracking-wider">Access level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['View', 'Comment'] as const).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAccessLevel(level)}
                      className={`py-2 rounded-input text-xs font-semibold border transition-all ${
                        accessLevel === level 
                          ? 'border-brand-strong bg-brand-tint text-brand-strong shadow-card' 
                          : 'border-line text-ink-muted hover:bg-surface-muted'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkExpires(!linkExpires)}
                  className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                    linkExpires ? 'bg-brand-strong border-brand-strong' : 'border-neutral-xdcdcd6 bg-white'
                  }`}
                >
                  {linkExpires && <Check size={12} className="text-white" />}
                </button>
                <span className="text-xs text-neutral-x55625a font-medium cursor-pointer select-none" onClick={() => setLinkExpires(!linkExpires)}>
                  Link expires in 7 days
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-neutral-xdcdcd6 hover:bg-surface-muted text-ink rounded-card text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-strong hover:bg-brand-x122e21 text-white rounded-card text-sm font-bold transition-colors shadow-card"
                >
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
