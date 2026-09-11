"use client";

import React from "react";
import { useAcademyApi } from "@/hooks/useAcademyApi";
import { useToast } from "../ToastContext";
import { Award, Download, Share2 } from "lucide-react";

export default function CertificatesPage() {
  const { certificates } = useAcademyApi();
  const { triggerToast } = useToast();

  const handleDownload = (certId: string) => {
    triggerToast(`Downloading certificate ${certId}...`);
  };

  const handleShare = (certId: string) => {
    triggerToast(`Opening LinkedIn share dialogue for ${certId}...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Certificates</h1>
        <p className="text-sm text-sage-500">Credentials earned from completing Cofoundaz learning paths.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden flex flex-col h-full hover:border-[#1e4836] transition-colors group">
            
            <div className="bg-[#1e4836] p-8 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2a4d40] rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3"></div>
              <Award className="w-16 h-16 text-[#D89A6E] relative z-10" />
              <div className="space-y-1 relative z-10">
                <p className="text-[10px] text-[#d4e2d9] uppercase tracking-widest font-bold">Certificate of Completion</p>
                <h3 className="text-lg font-display font-bold text-white">{cert.courseTitle}</h3>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs text-sage-500">
                  <span className="uppercase font-bold tracking-wider">Issued on</span>
                  <span className="font-medium text-sage-900">{cert.issuedOn}</span>
                </div>
                <div className="flex justify-between text-xs text-sage-500">
                  <span className="uppercase font-bold tracking-wider">Credential ID</span>
                  <span className="font-body text-sage-900 bg-sage-50 px-1.5 py-0.5 rounded">{cert.credentialCode}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-sage-100 flex gap-3">
                <button
                  onClick={() => handleDownload(cert.id)}
                  className="flex-1 bg-white hover:bg-sage-50 text-sage-800 border border-sage-300 font-semibold py-2 px-4 rounded-card text-xs transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleShare(cert.id)}
                  className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-2 px-4 rounded-card text-xs transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {certificates.length === 0 && (
          <div className="col-span-full py-12 text-center text-sage-500 text-sm">
            You haven&apos;t earned any certificates yet. Complete a course to get started.
          </div>
        )}
      </div>
    </div>
  );
}
