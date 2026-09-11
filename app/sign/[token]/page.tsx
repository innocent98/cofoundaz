'use client';

import React, { useState } from 'react';
import { Check, Edit3, X } from 'lucide-react';

export default function PublicSignerPage({ params }: { params: { token: string } }) {
  const [hasSigned, setHasSigned] = useState(false);

  if (hasSigned) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-card shadow-raised p-8 text-center border border-sage-200">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[#1E2923] mb-2">Document Signed</h1>
          <p className="text-sage-600 mb-6 font-body">Thank you. You can safely close this tab. A copy has been emailed to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50 font-body text-[#1E2923]">
      <header className="bg-white border-b border-sage-200 px-6 py-4 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tight text-[#1E2923]">Cofaundaz.</div>
        <div className="text-sm font-medium text-sage-600">Review and Sign</div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-card shadow-card border border-sage-200 overflow-hidden">
          <div className="border-b border-sage-200 px-6 py-4 flex items-center justify-between bg-sage-50">
            <div>
              <h2 className="text-lg font-semibold text-[#1E2923]">Contractor Agreement</h2>
              <p className="text-sm text-sage-600">Please review the document below before signing.</p>
            </div>
            <button
              onClick={() => setHasSigned(true)}
              className="bg-copper-600 hover:bg-copper-700 text-white px-6 py-2 rounded-input font-medium shadow-raised transition-colors flex items-center gap-2"
            >
              <Edit3 size={16} />
              <span>Sign Document</span>
            </button>
          </div>
          
          <div className="p-12 min-h-[600px] flex flex-col gap-4 font-serif text-sage-800">
            <h1 className="text-2xl font-bold text-center mb-8">INDEPENDENT CONTRACTOR AGREEMENT</h1>
            <p>This Independent Contractor Agreement (the &quot;Agreement&quot;) is entered into as of the date of signing.</p>
            <p><strong>1. SERVICES.</strong> The Contractor agrees to perform the services described in Exhibit A attached hereto.</p>
            <p><strong>2. COMPENSATION.</strong> As full compensation for the Services, the Company shall pay the Contractor the fees outlined in Exhibit A.</p>
            <p><strong>3. TERM AND TERMINATION.</strong> This Agreement shall commence on the Effective Date and shall continue until the Services are completed, unless earlier terminated in accordance with this Agreement.</p>
            
            <div className="mt-20 border-t border-sage-300 pt-8 flex gap-20">
              <div className="flex-1">
                <p className="font-bold mb-8">The Company:</p>
                <div className="border-b border-sage-300 w-full mb-2">Amara Okafor</div>
                <p className="text-sm text-sage-600">Authorized Signature</p>
              </div>
              <div className="flex-1">
                <p className="font-bold mb-8">The Contractor:</p>
                <div className="border-b border-copper-300 bg-copper-50 w-full h-8 mb-2 flex items-end px-2 pb-1 text-copper-800 text-sm cursor-pointer" onClick={() => setHasSigned(true)}>Click to sign</div>
                <p className="text-sm text-sage-600">Contractor Signature</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
