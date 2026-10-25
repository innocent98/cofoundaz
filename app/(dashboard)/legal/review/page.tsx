"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText } from "lucide-react";
import { useToast } from "../ToastContext";

export default function ContractReviewPage() {
  const router = useRouter();
  const { triggerToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUploaded, setFileUploaded] = useState(true); // Default true for demo based on mock data

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUploaded(true);
      triggerToast(`Contract loaded: ${e.target.files[0].name}. Analyzing...`);
    }
  };

  const handleSendToAdvisor = () => {
    router.push("/legal/requests");
    triggerToast("Draft sent to legal advisor for review.");
  };

  const handleAcceptAndContinue = () => {
    triggerToast("Accepted findings. Continuing to signature flow.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Contractor agreement, review</h1>
        <span className="text-sm font-semibold text-danger-700">3 findings · 1 high risk</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DOCUMENT PREVIEW AREA */}
        <div className="lg:col-span-6 bg-white rounded-modal border border-neutral-200/90 shadow-card min-h-[460px] flex flex-col justify-between">
          {!fileUploaded ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-neutral-200 m-4 rounded-card">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-bold text-neutral-900 mb-2">Upload contract for review</h3>
              <p className="text-sm text-neutral-500 mb-6">PDF, DOCX up to 10MB</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-card text-sm font-semibold transition-colors shadow-card"
              >
                Browse files
              </button>
            </div>
          ) : (
            <div className="p-6 flex flex-col space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 mb-2">
                <FileText className="w-5 h-5 text-brand-hover" />
                <span className="font-semibold text-neutral-900 text-sm">contractor_agreement_v2.pdf</span>
              </div>
              
              {/* Mock skeleton for document text highlighting */}
              <div className="space-y-4 flex-1">
                <div className="h-4 bg-neutral-100 rounded-[6px] w-3/4"></div>
                <div className="h-3 bg-neutral-50 rounded-[6px] w-full"></div>
                <div className="h-3 bg-neutral-50 rounded-[6px] w-5/6"></div>
                
                <div className="relative group cursor-pointer">
                  <div className="h-3 bg-danger-100/70 border border-danger-200 rounded-[6px] w-full"></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-danger-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    Clause 8.2: Non-compete scope
                  </div>
                </div>
                
                <div className="h-3 bg-neutral-50 rounded-[6px] w-4/5"></div>
                
                <div className="relative group cursor-pointer">
                  <div className="h-3 bg-accent-100/60 border border-accent-200 rounded-[6px] w-2/3"></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-accent-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    Clause 4.1: Payment terms
                  </div>
                </div>

                <div className="h-3 bg-neutral-50 rounded-[6px] w-full"></div>
                <div className="h-3 bg-neutral-50 rounded-[6px] w-11/12"></div>
                <div className="h-3 bg-neutral-50 rounded-[6px] w-full"></div>
                <div className="h-3 bg-neutral-50 rounded-[6px] w-5/6"></div>
                <div className="h-3 bg-neutral-50 rounded-[6px] w-4/5"></div>
              </div>
            </div>
          )}
        </div>

        {/* FINDINGS PANEL */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-modal border border-neutral-200/90 p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-danger-100 text-danger-800 text-xs font-semibold px-2.5 py-0.5 rounded-[6px]">High risk</span>
              <span className="text-xs text-neutral-400 font-medium">Clause 8.2</span>
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">
              This non-compete is 5 years and worldwide, far beyond typical enforceable scope. Narrow it to your market and 12 months.
            </p>
          </div>

          <div className="bg-white rounded-modal border border-neutral-200/90 p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-accent-100 text-accent-800 text-xs font-semibold px-2.5 py-0.5 rounded-[6px]">Caution</span>
              <span className="text-xs text-neutral-400 font-medium">Clause 4.1</span>
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">
              Payment terms are net-60. For a small vendor that is a long float, consider net-30.
            </p>
          </div>

          <div className="bg-white rounded-modal border border-neutral-200/90 p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-neutral-100 text-neutral-700 text-xs font-semibold px-2.5 py-0.5 rounded-[6px]">FYI</span>
              <span className="text-xs text-neutral-400 font-medium">Clause 11</span>
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">
              Governing law is set to Lagos State. Standard and fine for your setup.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSendToAdvisor}
              className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-semibold py-3 px-4 rounded-card text-sm transition-colors cursor-pointer text-center shadow-card"
            >
              Send to my legal advisor
            </button>
            <button
              onClick={handleAcceptAndContinue}
              className="flex-1 bg-accent-600 hover:bg-accent-700 text-white font-semibold py-3 px-4 rounded-card text-sm transition-colors cursor-pointer text-center shadow-card"
            >
              Accept & continue
            </button>
          </div>

          <div className="bg-neutral-xf5efe6 border border-accent-xe8d5c4 rounded p-3 mt-4 flex gap-2">
            <p className="text-xs text-accent-700 font-medium leading-relaxed">
              <strong>§1.4 Disclaimer:</strong> This is AI-assisted guidance, not professional legal advice. For anything non-standard or high-stakes, involve a licensed legal professional. You can find one in the Marketplace.
            </p>
          </div>
        </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".pdf,.docx,.doc"
      />
    </div>
  );
}
