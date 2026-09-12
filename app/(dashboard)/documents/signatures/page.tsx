'use client';

import React, { useState } from 'react';
import { Search, Plus, Mail } from 'lucide-react';
import { useDocumentsApi } from '@/hooks/useDocumentsApi';
import { useToast } from '../ToastContext';

export default function SignaturesPage() {
  const { signatureRequests, setSignatureRequests } = useDocumentsApi();
  const { triggerToast } = useToast();
  
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerEmail, setSignerEmail] = useState('tayo@lawfirm.ng');

  const handleSignatureAction = (index: number) => {
    const req = signatureRequests[index];
    triggerToast(req.actionText + ' • ' + req.title);
  };
  
  const handleSignSubmit = (e: unknown) => {
    e.preventDefault();
    setIsSignModalOpen(false);
    triggerToast('Signature request sent.');
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
<main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-display text-[#1C2621] tracking-tight mb-1">E-signature requests</h1>
            <p className="text-xs text-[#738279]">Track pending and completed document signatures.</p>
          </div>

          <div className="space-y-4">
            {signatureRequests.map((req, idx) => (
              <div key={idx} className="bg-white border border-[#E8E8E2] rounded-modal p-6 shadow-card space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#FDF2F2] text-[#B93838]">PDF</span>
                    <div>
                      <h3 className="font-semibold text-xs text-[#1E2923]">{req.title}</h3>
                      <p className="text-xs text-[#8E9B90] mt-0.5">{req.meta}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 self-end md:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyles(req.status)}`}>
                      {req.status}
                    </span>
                    <button 
                      onClick={() => handleSignatureAction(idx)}
                      className="text-xs font-semibold text-[#183B28] hover:text-[#A07C44] transition-colors"
                    >
                      {req.actionText}
                    </button>
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
        </main>
  );
}
