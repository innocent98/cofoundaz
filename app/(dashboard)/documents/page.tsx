'use client';

import React, { useRef, useState } from 'react';
import { Search, Plus, ChevronRight, Sparkles, Trash2 } from 'lucide-react';
import { useDocumentFiles } from '@/hooks/useDocumentFiles';
import { useToast } from './ToastContext';

const CATEGORIES = ['Corporate', 'Financials', 'Legal', 'Fundraising', 'Marketing', 'Archive'];

export default function DocumentsLibraryPage() {
  const { files: libraryDocs, uploading, uploadFile, deleteFile } = useDocumentFiles();
  const { triggerToast } = useToast();
  const [libraryViewMode, setLibraryViewMode] = useState<'Grid' | 'List'>('List');
  const [selectedCategory, setSelectedCategory] = useState<string>('All documents');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        return 'bg-[#F2ECE1] text-[#7A6025]';
      case 'Final': 
      case 'Signed': 
      case 'Complete': 
        return 'bg-[#E5EFEA] text-[#1E3E2B]';
      case 'Draft': 
        return 'bg-[#ECEEEF] text-[#55625A]';
      case 'Expired': 
        return 'bg-[#FDF2F2] text-[#B93838]';
      default: return 'bg-[#F5F5F0] text-[#617065]';
    }
  };

  return (
<main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div>
            <h1 className="text-3xl font-display text-[#1C2621] tracking-tight mb-1">Documents</h1>
            <p className="text-xs text-[#738279]">Every file your company has produced, versioned and searchable.</p>
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
              className="px-4 py-1.5 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-xs font-semibold shadow-card transition-colors h-[34px] disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button 
              onClick={() => {
                window.location.href = '/documents/templates';
                triggerToast('Navigated to template page.');
              }}
              className="px-4 py-1.5 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-card text-xs font-semibold flex items-center space-x-1 shadow-card transition-colors h-[34px]"
            >
              <Plus size={14} />
              <span>+ New document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start pt-2">
            <div className="lg:col-span-1 bg-white border border-[#E8E8E2] rounded-modal p-2 shadow-card space-y-0.5">
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
                        ? 'bg-[#F2F4F2] text-[#1E2923] font-semibold' 
                        : 'text-[#617065] hover:bg-[#F9F9F6] hover:text-[#1E2923] font-medium'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5">
                      {cat.icon && <span className="text-[#8E9B90] text-xs">⊞</span>}
                      {cat.arrow && <ChevronRight size={12} className="text-[#C4C9C5]" />}
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[11px] text-[#8E9B90]">{countFor(cat.name)}</span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#9CA8A0]" size={15} />
                  <input 
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E8E8E2] rounded-card pl-10 pr-4 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44] shadow-card"
                  />
                </div>

                <div className="flex items-center space-x-0.5 bg-white border border-[#E8E8E2] p-0.5 rounded-card shadow-card shrink-0">
                  <button
                    onClick={() => setLibraryViewMode('Grid')}
                    className={`px-3 py-1 rounded-input text-xs font-medium transition-colors ${
                      libraryViewMode === 'Grid' ? 'bg-[#1C3B2B] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setLibraryViewMode('List')}
                    className={`px-3 py-1 rounded-input text-xs font-medium transition-colors ${
                      libraryViewMode === 'List' ? 'bg-[#1C3B2B] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {filteredLibraryDocs.length === 0 && (
                <div className="bg-white border border-[#E8E8E2] rounded-modal shadow-card p-12 text-center">
                  <p className="text-sm font-semibold text-[#1E2923]">No documents yet</p>
                  <p className="text-xs text-[#8E9B90] mt-1">
                    Upload a PDF, Office doc, image, text or CSV to get started.
                  </p>
                  <button
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="mt-4 px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-card text-xs font-semibold shadow-card transition-colors disabled:opacity-60"
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
                      onClick={() => { ; triggerToast(`Opened ${doc.title}`); }}
                      className="bg-white border border-[#E8E8E2] rounded-modal p-5 shadow-card flex flex-col justify-between h-44 hover:border-[#D5DDD6] transition-all cursor-pointer relative"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            doc.type === 'PDF' ? 'bg-[#FDF2F2] text-[#B93838]' :
                            doc.type === 'DOC' ? 'bg-[#EFF6FF] text-[#1D4ED8]' :
                            doc.type === 'XLS' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FFF7ED] text-[#C2410C]'
                          }`}>
                            {doc.type}
                          </span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs text-[#1E2923] leading-snug">{doc.title}</h3>
                          <p className="text-[11px] text-[#8E9B90] mt-1">{doc.owner} • {doc.modified}</p>
                        </div>
                      </div>

                      {doc.aiGenerated && (
                        <div className="flex items-center space-x-1 text-[11px] text-copper-600 font-medium pt-2 border-t border-[#F2F2EC]">
                          <Sparkles size={12} />
                          <span>AI generated</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {filteredLibraryDocs.length > 0 && libraryViewMode === 'List' && (
                <div className="bg-white border border-[#E8E8E2] rounded-modal shadow-card overflow-hidden">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#E8E8E2] text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider bg-white">
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Owner</th>
                        <th className="py-3 px-5">Modified</th>
                        <th className="py-3 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E8E2] text-xs">
                      {filteredLibraryDocs.map((doc) => (
                        <tr 
                          key={doc.id}
                          onClick={() => { ; triggerToast(`Opened ${doc.title}`); }}
                          className="hover:bg-[#F9F9F6] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-5 font-semibold text-[#1E2923] flex items-center space-x-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                              doc.type === 'PDF' ? 'bg-[#FDF2F2] text-[#B93838]' :
                              doc.type === 'DOC' ? 'bg-[#EFF6FF] text-[#1D4ED8]' :
                              doc.type === 'XLS' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FFF7ED] text-[#C2410C]'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="font-medium">{doc.title}</span>
                          </td>
                          <td className="py-3.5 px-5 text-[#617065]">{doc.owner}</td>
                          <td className="py-3.5 px-5 text-[#617065]">{doc.modified}</td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-between gap-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                                {doc.status}
                              </span>
                              <button
                                type="button"
                                aria-label={`Delete ${doc.title}`}
                                onClick={(e) => handleDelete(e, doc.id, doc.title)}
                                className="text-[#9CA8A0] hover:text-[#B93838] transition-colors shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
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
        </main>
  );
}
