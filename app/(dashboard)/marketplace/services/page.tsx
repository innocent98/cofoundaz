"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMarketplaceApi } from "@/hooks/useMarketplaceApi";
import { useToast } from "../ToastContext";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function ServicesPage() {
  const router = useRouter();
  const { services, providers } = useMarketplaceApi();
  const { triggerToast } = useToast();

  const handleBook = (serviceTitle: string) => {
    triggerToast(`Booking ${serviceTitle}...`);
    setTimeout(() => {
      router.push("/marketplace/bookings");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Packaged services</h1>
        <p className="text-sm text-sage-500">Fixed-scope deliverables with transparent pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {services.map((service) => {
          const provider = providers.find(p => p.id === service.providerId);
          if (!provider) return null;

          return (
            <div key={service.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 md:p-8 flex flex-col h-full space-y-6">
              <div className="space-y-2 flex-1">
                <h3 className="font-display font-semibold text-xl text-sage-900">{service.title}</h3>
                
                <div className="flex items-center gap-2 pt-1 pb-3">
                  <div className="w-6 h-6 rounded-full bg-[#e2ede6] text-[#1e4836] flex items-center justify-center font-display font-bold text-[10px]">
                    {provider.avatarUrl}
                  </div>
                  <span className="text-sm font-medium text-sage-700">{provider.name}</span>
                  {provider.isVetted && (
                    <span title="Vetted Provider">
                      <ShieldCheck className="w-4 h-4 text-[#1e4836]" />
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sage-500">Deliverables</h4>
                  <ul className="space-y-2">
                    {service.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-sage-700">
                        <CheckCircle2 className="w-4 h-4 text-[#8A5330] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-sage-100 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-lg font-bold text-sage-900">₦{(service.priceMinor / 100).toLocaleString()}</p>
                  <p className="text-xs text-sage-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{service.deliveryDays} days delivery</span>
                  </p>
                </div>
                <button
                  onClick={() => handleBook(service.title)}
                  className="bg-[#1e4836] hover:bg-[#153427] text-white font-semibold py-2.5 px-6 rounded-card text-sm transition-colors shadow-card"
                >
                  Book this
                </button>
              </div>
            </div>
          );
        })}
        {services.length === 0 && (
          <div className="col-span-full py-12 text-center text-sage-500 text-sm">
            No packaged services available right now.
          </div>
        )}
      </div>
    </div>
  );
}
