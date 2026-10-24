"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, Copy, Download, Share2 } from "lucide-react";
import { useCertificates } from "@/hooks/useLearning";
import { ResourceView } from "@/components/academy/parts";
import { downloadCertificatePdf, isNotReadyError, learningErrorMessage, type Certificate } from "@/lib/api/learning";
import { formatIssued, safeLinkedInUrl } from "@/lib/learning-format";
import { useToast } from "../ToastContext";

function CertificateCard({ cert, onRefresh }: { cert: Certificate; onRefresh: () => void }) {
  const { triggerToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const linkedin = safeLinkedInUrl(cert.linkedin_url);

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificatePdf(cert);
    } catch (err) {
      if (isNotReadyError(err)) onRefresh();
      triggerToast(learningErrorMessage(err, "Could not download the PDF."));
    } finally {
      setDownloading(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(cert.verify_url);
      triggerToast("Verify link copied.");
    } catch {
      triggerToast("Could not copy the link. Select it from the verify page instead.");
    }
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-modal border border-sage-200 bg-white shadow-card">
      <div className="relative flex flex-col items-center space-y-4 overflow-hidden bg-green-700 p-8 text-center">
        <Award className="relative h-16 w-16 text-copper-500" aria-hidden="true" />
        <div className="relative space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-100">Certificate of Completion</p>
          <h2 className="text-lg font-display font-bold text-white">{cert.course_title}</h2>
          <p className="text-sm text-green-100">{cert.holder_name}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-6">
        <dl className="flex-1 space-y-2 text-xs text-sage-600">
          <div className="flex justify-between gap-3"><dt className="font-bold uppercase tracking-wider">Issued on</dt><dd className="font-medium text-sage-900">{formatIssued(cert.issued_at)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="font-bold uppercase tracking-wider">Issued by</dt><dd className="font-medium text-sage-900">{cert.issuer}</dd></div>
          <div className="flex justify-between gap-3"><dt className="font-bold uppercase tracking-wider">Credential ID</dt><dd className="rounded bg-sage-50 px-1.5 py-0.5 font-medium text-sage-900">{cert.credential_id}</dd></div>
        </dl>
        {!cert.pdf_ready && <p role="status" className="text-xs text-sage-600">Preparing your PDF...</p>}
        <div className="grid grid-cols-2 gap-3 border-t border-sage-100 pt-4">
          <button type="button" onClick={onDownload} disabled={!cert.pdf_ready || downloading} className="flex min-h-11 items-center justify-center gap-2 rounded-card border border-sage-300 bg-white px-3 text-xs font-semibold text-sage-800 shadow-card hover:bg-sage-50 disabled:opacity-60">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{downloading ? "Downloading..." : "Download PDF"}</span>
          </button>
          {linkedin ? (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-card bg-[#0A66C2] px-3 text-xs font-semibold text-white shadow-card hover:bg-[#004182]">
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add to LinkedIn</span>
            </a>
          ) : (
            <span className="flex min-h-11 items-center justify-center rounded-card bg-sage-100 px-3 text-xs text-sage-600">LinkedIn link unavailable</span>
          )}
          <button type="button" onClick={onCopy} className="flex min-h-11 items-center justify-center gap-2 rounded-card border border-sage-300 bg-white px-3 text-xs font-semibold text-sage-800 hover:bg-sage-50">
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Copy verify link</span>
          </button>
          <Link href={`/verify/${cert.credential_id}`} className="flex min-h-11 items-center justify-center rounded-card border border-sage-300 bg-white px-3 text-xs font-semibold text-sage-800 hover:bg-sage-50">
            View verify page
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function CertificatesPage() {
  const res = useCertificates();
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Certificates</h1>
        <p className="text-sm text-sage-600">Credentials earned from completing courses.</p>
      </div>
      {res.stalled && <p role="status" className="text-sm text-sage-700">Still preparing. Check back soon.</p>}
      <ResourceView res={res}>
        {(certs) =>
          certs.length === 0 ? (
            <div className="py-12 text-center text-sm text-sage-600">
              <p>Finish any course to earn your first certificate.</p>
              <Link href="/academy/courses" className="mt-3 inline-flex min-h-11 items-center rounded-card bg-green-700 px-4 font-semibold text-white hover:bg-green-800">Browse courses</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
              {certs.map((c) => <CertificateCard key={c.id} cert={c} onRefresh={res.reload} />)}
            </div>
          )
        }
      </ResourceView>
    </div>
  );
}
