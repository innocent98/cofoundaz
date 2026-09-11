"use client";

import React, { useState } from "react";
import { useMarketplaceApi, BookingStatus } from "@/hooks/useMarketplaceApi";
import { useToast } from "../ToastContext";
import { Calendar, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function BookingsPage() {
  const { bookings, updateBookingStatus } = useMarketplaceApi();
  const { triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState<BookingStatus>("upcoming");

  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);

  const tabs: { id: BookingStatus; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "in_progress", label: "In progress" },
    { id: "delivered", label: "Delivered" },
    { id: "closed", label: "Closed" },
  ];

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  const handleAcceptDelivery = (id: string) => {
    updateBookingStatus(id, "closed");
    triggerToast("Delivery accepted. Order closed.");
  };

  const handleRequestChanges = (id: string) => {
    updateBookingStatus(id, "in_progress");
    triggerToast("Change request sent to provider.");
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingDrawerOpen(false);
    setBookingStep(1);
    triggerToast("Booking confirmed!");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold text-sage-900">Bookings</h1>
          <p className="text-sm text-sage-500">Manage your active projects and requests.</p>
        </div>
        <button
          onClick={() => setIsBookingDrawerOpen(true)}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-2.5 px-6 rounded-card text-sm transition-colors shadow-card"
        >
          New booking request
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none border-b border-sage-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-[#1e4836] border-b-2 border-[#1e4836]"
                : "text-sage-500 hover:text-sage-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-sage-900">{booking.serviceTitle}</h3>
              <p className="text-sm text-sage-600">Provider: <span className="font-medium text-sage-900">{booking.providerName}</span></p>
              <div className="flex items-center gap-4 text-xs font-medium text-sage-500 pt-1">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {booking.date}</span>
                <span>₦{(booking.amountMinor / 100).toLocaleString()}</span>
              </div>
            </div>

            {activeTab === "delivered" && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleRequestChanges(booking.id)}
                  className="w-full sm:w-auto bg-white hover:bg-sage-50 text-sage-800 border border-sage-300 font-semibold py-2.5 px-4 rounded-card text-sm transition-colors shadow-sm"
                >
                  Request changes
                </button>
                <button
                  onClick={() => handleAcceptDelivery(booking.id)}
                  className="w-full sm:w-auto bg-[#1e4836] hover:bg-[#153427] text-white font-semibold py-2.5 px-4 rounded-card text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept delivery</span>
                </button>
              </div>
            )}
            {activeTab !== "delivered" && (
              <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sage-100 text-sage-600">
                {activeTab.replace("_", " ")}
              </div>
            )}
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="bg-white rounded-modal border border-sage-200 p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-sage-300 mx-auto" />
            <p className="text-sage-900 font-medium">No bookings found for this status.</p>
          </div>
        )}
      </div>

      {/* Booking Flow Drawer */}
      {isBookingDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fadeIn"
            onClick={() => setIsBookingDrawerOpen(false)}
          ></div>
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] border-l border-sage-200 flex flex-col animate-[slideInRight_0.3s_ease-out]">
            <div className="p-6 border-b border-sage-100 space-y-4">
              <h2 className="text-xl font-display font-bold text-sage-900">New Booking Request</h2>
              
              {/* Stepper */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex-1 h-1.5 rounded-full bg-sage-100 overflow-hidden">
                    <div className={`h-full ${bookingStep >= step ? 'bg-[#1e4836]' : 'bg-transparent'}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="booking-form" onSubmit={submitBooking} className="space-y-6">
                {bookingStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="font-semibold text-sage-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#8A5330]" /> Select Date & Slot
                    </h3>
                    <input
                      type="date"
                      required
                      className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]"
                    />
                    <select required className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]">
                      <option value="">Select a time slot...</option>
                      <option value="10:00">10:00 AM WAT</option>
                      <option value="14:00">2:00 PM WAT</option>
                    </select>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="font-semibold text-sage-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#8A5330]" /> Project Brief
                    </h3>
                    <textarea
                      required
                      placeholder="What do you need done? Be as specific as possible."
                      className="w-full h-32 bg-sage-50 border border-sage-200 rounded-input px-4 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] resize-none"
                    />
                    <div className="border-2 border-dashed border-sage-200 rounded-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sage-50 transition-colors">
                      <span className="text-sm font-semibold text-[#1e4836]">Click to upload files</span>
                      <span className="text-xs text-sage-500 mt-1">PDF, DOCX, PNG (max 10MB)</span>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    <h3 className="font-semibold text-sage-900 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#8A5330]" /> Confirmation
                    </h3>
                    <div className="bg-sage-50 p-4 rounded-card border border-sage-200 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-sage-600">Service</span>
                        <span className="font-semibold text-sage-900">Custom Request</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-sage-600">Date</span>
                        <span className="font-semibold text-sage-900">Selected Date</span>
                      </div>
                      <div className="pt-3 border-t border-sage-200 flex justify-between">
                        <span className="font-bold text-sage-900">Total</span>
                        <span className="font-bold text-[#1e4836]">TBD via quote</span>
                      </div>
                    </div>
                    <p className="text-xs text-sage-500 italic">
                      The provider will review your brief and send a formal quote before you are charged.
                    </p>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-sage-100 flex gap-3 bg-white">
              <button
                type="button"
                onClick={() => {
                  if (bookingStep > 1) setBookingStep(bookingStep - 1);
                  else setIsBookingDrawerOpen(false);
                }}
                className="flex-1 bg-white hover:bg-sage-50 text-sage-800 border border-sage-300 font-semibold py-3 px-4 rounded-card text-sm transition-colors shadow-sm"
              >
                {bookingStep === 1 ? "Cancel" : "Back"}
              </button>
              
              {bookingStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep(bookingStep + 1)}
                  className="flex-1 bg-[#1e4836] hover:bg-[#153427] text-white font-semibold py-3 px-4 rounded-card text-sm transition-colors shadow-sm"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  form="booking-form"
                  className="flex-1 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-3 px-4 rounded-card text-sm transition-colors shadow-card"
                >
                  Submit Brief
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
