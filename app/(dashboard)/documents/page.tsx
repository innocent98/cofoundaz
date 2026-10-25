'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronRight, Sparkles, Trash2, Share2, X, Check, Copy } from 'lucide-react';
import { useDocumentFiles } from '@/hooks/useDocumentFiles';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentShares } from '@/hooks/useDocumentShares';
import { useToast } from './ToastContext';

const CATEGORIES = ['Corporate', 'Financials', 'Legal', 'Fundraising', 'Marketing', 'Archive'];

interface LibItem {
  id: string;
  title: string;
  type: string;
  category: string;
  owner: string;
  modified: string;
  status: string;
  aiGenerated?: boolean;
  source: 'document' | 'file';
}

export default function DocumentsLibraryPage() {
  const { files, uploading, uploadFile, deleteFile } = useDocumentFiles();
  const { documents } = useDocuments();
  const { createShare } = useDocumentShares();
  const router = useRouter();

  // Rich documents open in the editor; uploaded files aren't editable documents.
  const openItem = (doc: LibItem) => {
    if (doc.source === 'document') router.push(`/documents/${doc.id}`);
    else triggerToast('Preview isn’t available for uploaded files yet.');
  };
  const { triggerToast } = useToast();
  const [libraryViewMode, setLibraryViewMode] = useState<'Grid' | 'List'>('List');
  const [selectedCategory, setSelectedCategory] = useState<string>('All documents');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rich documents (shareable/signable) + uploaded files, in one library list.
  const libraryDocs = useMemo<LibItem[]>(() => {
    const docItems: LibItem[] = documents.map((d) => ({
      id: d.id, title: d.title, type: 'DOC', category: d.category, owner: d.owner,
      modified: d.modified, status: d.status, aiGenerated: d.aiGenerated, source: 'document',
    }));
    const fileItems: LibItem[] = files.map((f) => ({
      id: f.id, title: f.title, type: f.type, category: f.category, owner: f.owner,
      modified: f.modified, status: f.status, aiGenerated: f.aiGenerated, source: 'file',
    }));
    return [...docItems, ...fileItems];
  }, [documents, files]);

  // Share modal state
  const [shareDoc, setShareDoc] = useState<LibItem | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareAccess, setShareAccess] = useState<'view' | 'comment'>('view');
  const [shareExpires, setShareExpires] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const openShare = (e: React.MouseEvent, doc: LibItem) => {
    e.stopPropagation();
    setShareDoc(doc);
    setShareEmail('');
    setShareAccess('view');
    setShareExpires(true);
    setShareLink(null);
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDoc) return;
    setSharing(true);
    const res = await createShare(shareDoc.id, shareEmail, shareAccess, shareExpires ? 30 : null);
    setSharing(false);
    if (res.ok) {
      setShareLink(res.link || null);
      triggerToast(`Shared with ${shareEmail}.`);
    } else {
      triggerToast(res.error || 'Could not share.');
    }
  };

  const filteredLibraryDocs = libraryDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.owner.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All documents') return matchesSearch;
    return matchesSearch && doc.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Real per-folder counts for the sidebar (from the fetched files).
  const countFor = (name: string) =>
    name === 'All documents' ? libraryDocs.length : libraryDocs.filter(d => d.category.toLowerCase() === name.toLowerCase()).length;

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    const folder = selectedCategory !== 'All documents' ? selectedCategory : undefined;
    const res = await uploadFile(file, folder);
    triggerToast(res.ok ? `Uploaded ${file.name}.` : (res.error || 'Upload failed.'));
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    await deleteFile(id);
    triggerToast(`Deleted ${title}.`);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Awaiting signature': 
      case 'Awaiting': 
        return 'bg-accent-xf2ece1 text-accent-x7a6025';
      case 'Final': 
      case 'Signed': 
      case 'Complete': 
        return 'bg-neutral-xe5efea text-brand-x1e3e2b';
      case 'Draft': 
        return 'bg-neutral-xeceeef text-neutral-x55625a';
      case 'Expired': 
        return 'bg-danger-tint text-danger-bold';
      default: return 'bg-surface-muted text-ink-muted';
    }
  };

  return (
<main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Documents</h1>
            <p className="text-xs text-neutral-x738279">Every file your company has produced, versioned and searchable.</p>
          </div>

          <div className="flex justify-end items-center space-x-3 -mt-12 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.txt,.csv"
              onChange={handleFileChosen}
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="px-4 py-1.5 bg-white border border-neutral-xdcdcd6 hover:bg-surface-muted text-ink rounded-card text-xs font-semibold shadow-card transition-colors h-[34px] disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button 
              onClick={() => {
                window.location.href = '/documents/templates';
                triggerToast('Navigated to template page.');
              }}
              className="px-4 py-1.5 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-card text-xs font-semibold flex items-center space-x-1 shadow-card transition-colors h-[34px]"
            >
              <Plus size={14} />
              <span>+ New document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start pt-2">
            <div className="lg:col-span-1 bg-white border border-line rounded-modal p-2 shadow-card space-y-0.5">
              {[
                { name: 'All documents', icon: true, arrow: false },
                ...CATEGORIES.map((name) => ({ name, icon: false, arrow: true })),
              ].map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-card text-xs transition-colors ${
                      isSelected 
                        ? 'bg-neutral-xf2f4f2 text-ink font-semibold' 
                        : 'text-ink-muted hover:bg-neutral-xf9f9f6 hover:text-ink font-medium'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      {cat.icon && <span className="text-ink-subtle text-xs">⊞</span>}
                      {cat.arrow && <ChevronRight size={12} className="text-neutral-xc4c9c5" />}
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[11px] text-ink-subtle">{countFor(cat.name)}</span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-x9ca8a0" size={15} />
                  <input 
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-line rounded-card pl-10 pr-4 py-2 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-accent-bronze shadow-card"
                  />
                </div>

                <div className="flex items-center space-x-0.5 bg-white border border-line p-0.5 rounded-card shadow-card shrink-0">
                  <button
                    onClick={() => setLibraryViewMode('Grid')}
                    className={`px-3 py-1 rounded-input text-xs font-medium transition-colors ${
                      libraryViewMode === 'Grid' ? 'bg-brand-x1c3b2b text-white font-semibold' : 'text-ink-muted hover:bg-surface-muted'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setLibraryViewMode('List')}
                    className={`px-3 py-1 rounded-input text-xs font-medium transition-colors ${
                      libraryViewMode === 'List' ? 'bg-brand-x1c3b2b text-white font-semibold' : 'text-ink-muted hover:bg-surface-muted'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {filteredLibraryDocs.length === 0 && (
                <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
                  <p className="text-sm font-semibold text-ink">No documents yet</p>
                  <p className="text-xs text-ink-subtle mt-1">
                    Upload a PDF, Office doc, image, text or CSV to get started.
                  </p>
                  <button
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="mt-4 px-4 py-2 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-card text-xs font-semibold shadow-card transition-colors disabled:opacity-60"
                  >
                    {uploading ? 'Uploading…' : 'Upload a file'}
                  </button>
                </div>
              )}

              {filteredLibraryDocs.length > 0 && libraryViewMode === 'Grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibraryDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      onClick={() => openItem(doc)}
                      className="bg-white border border-line rounded-modal p-5 shadow-card flex flex-col justify-between h-44 hover:border-line-strong transition-all cursor-pointer relative"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            doc.type === 'PDF' ? 'bg-danger-tint text-danger-bold' :
                            doc.type === 'DOC' ? 'bg-info-xeff6ff text-info-x1d4ed8' :
                            doc.type === 'XLS' ? 'bg-brand-xecfdf5 text-brand-x047857' : 'bg-accent-xfff7ed text-accent-xc2410c'
                          }`}>
                            {doc.type}
                          </span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-ink leading-snug">{doc.title}</h3>
                          <p className="text-[11px] text-ink-subtle mt-1">{doc.owner} • {doc.modified}</p>
                        </div>
                      </div>

                      {doc.aiGenerated && (
                        <div className="flex items-center space-x-1 text-[11px] text-accent-600 font-medium pt-2 border-t border-neutral-xf2f2ec">
                          <Sparkles size={12} />
                          <span>AI generated</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {filteredLibraryDocs.length > 0 && libraryViewMode === 'List' && (
                <div className="bg-white border border-line rounded-modal shadow-card overflow-hidden">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-line text-[10px] font-bold text-ink-subtle uppercase tracking-wider bg-white">
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Owner</th>
                        <th className="py-3 px-5">Modified</th>
                        <th className="py-3 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-xs">
                      {filteredLibraryDocs.map((doc) => (
                        <tr 
                          key={doc.id}
                          onClick={() => openItem(doc)}
                          className="hover:bg-neutral-xf9f9f6 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-5 font-semibold text-ink flex items-center space-x-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                              doc.type === 'PDF' ? 'bg-danger-tint text-danger-bold' :
                              doc.type === 'DOC' ? 'bg-info-xeff6ff text-info-x1d4ed8' :
                              doc.type === 'XLS' ? 'bg-brand-xecfdf5 text-brand-x047857' : 'bg-accent-xfff7ed text-accent-xc2410c'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="font-medium">{doc.title}</span>
                          </td>
                          <td className="py-3.5 px-5 text-ink-muted">{doc.owner}</td>
                          <td className="py-3.5 px-5 text-ink-muted">{doc.modified}</td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                                {doc.status}
                              </span>
                              <div className="flex items-center gap-2.5 shrink-0">
                                {doc.source === 'document' && (
                                  <button
                                    type="button"
                                    aria-label={`Share ${doc.title}`}
                                    onClick={(e) => openShare(e, doc)}
                                    className="text-neutral-x9ca8a0 hover:text-brand-strong transition-colors"
                                  >
                                    <Share2 size={14} />
                                  </button>
                                )}
                                {doc.source === 'file' && (
                                  <button
                                    type="button"
                                    aria-label={`Delete ${doc.title}`}
                                    onClick={(e) => handleDelete(e, doc.id, doc.title)}
                                    className="text-neutral-x9ca8a0 hover:text-danger-bold transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Share document modal */}
          {shareDoc && (
            <div className="fixed inset-0 bg-brand-x061a12/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-modal w-full max-w-md shadow-raised overflow-hidden">
                <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface-faint">
                  <h3 className="font-bold text-ink truncate pr-4">Share “{shareDoc.title}”</h3>
                  <button onClick={() => setShareDoc(null)} className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-input hover:bg-line">
                    <X size={16} />
                  </button>
                </div>

                {shareLink ? (
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-ink font-semibold">Share link created</p>
                    <p className="text-xs text-neutral-x738279">This link is shown once, copy it now, it can’t be retrieved later.</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={shareLink}
                        className="flex-1 border border-line-strong rounded-input px-3 py-2 text-xs text-ink bg-surface-faint truncate"
                      />
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard?.writeText(shareLink); triggerToast('Link copied.'); }}
                        className="shrink-0 px-3 py-2 bg-brand-strong hover:bg-brand-x122e21 text-white rounded-input text-xs font-bold flex items-center gap-1.5"
                      >
                        <Copy size={13} /> Copy
                      </button>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button onClick={() => setShareDoc(null)} className="px-4 py-2 bg-white border border-neutral-xdcdcd6 hover:bg-surface-muted text-ink rounded-card text-sm font-bold transition-colors">
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleShareSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-x55625a uppercase tracking-wider">Email address</label>
                      <input
                        type="email"
                        required
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-x55625a uppercase tracking-wider">Access level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['view', 'comment'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setShareAccess(level)}
                            className={`py-2 rounded-input text-xs font-semibold border transition-all capitalize ${
                              shareAccess === level
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
                        onClick={() => setShareExpires(!shareExpires)}
                        className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                          shareExpires ? 'bg-brand-strong border-brand-strong' : 'border-neutral-xdcdcd6 bg-white'
                        }`}
                      >
                        {shareExpires && <Check size={12} className="text-white" />}
                      </button>
                      <span className="text-xs text-neutral-x55625a font-medium cursor-pointer select-none" onClick={() => setShareExpires(!shareExpires)}>
                        Link expires in 30 days
                      </span>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button type="button" onClick={() => setShareDoc(null)} className="flex-1 px-4 py-2 bg-white border border-neutral-xdcdcd6 hover:bg-surface-muted text-ink rounded-card text-sm font-bold transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={sharing} className="flex-1 px-4 py-2 bg-brand-strong hover:bg-brand-x122e21 text-white rounded-card text-sm font-bold transition-colors shadow-card disabled:opacity-60">
                        {sharing ? 'Sharing…' : 'Create link'}
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
