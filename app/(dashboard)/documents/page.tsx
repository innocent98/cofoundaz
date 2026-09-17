'use client';

import React, { useState } from 'react';
import { FileText, Search, Plus, List, Grid as GridIcon, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useDocumentsApi } from '@/hooks/useDocumentsApi';
import { useToast } from './ToastContext';

export default function DocumentsLibraryPage() {
  const { libraryDocs } = useDocumentsApi();
  const { triggerToast } = useToast();
  const [libraryViewMode, setLibraryViewMode] = useState<'Grid' | 'List'>('List');
  const [selectedCategory, setSelectedCategory] = useState<string>('All documents');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLibraryDocs = libraryDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.owner.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All documents') return matchesSearch;
    return matchesSearch && doc.category.toLowerCase() === selectedCategory.toLowerCase();
  });

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
            <button 
              onClick={() => triggerToast('Upload dialog opened.')}
              className="px-4 py-1.5 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-xs font-semibold shadow-card transition-colors h-[34px]"
            >
              Upload
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
                { name: 'All documents', count: 38, icon: true },
                { name: 'Corporate', count: 6, arrow: true },
                { name: 'Financials', count: 9, arrow: true },
                { name: 'Legal', count: 7, arrow: true },
                { name: 'Fundraising', count: 8, arrow: true },
                { name: 'Marketing', count: 5, arrow: true },
                { name: 'Archive', count: 3, arrow: true },
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
                    <span className="text-[11px] text-[#8E9B90]">{cat.count}</span>
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

              {libraryViewMode === 'Grid' && (
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

              {libraryViewMode === 'List' && (
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
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyles(doc.status)}`}>
                              {doc.status}
                            </span>
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
