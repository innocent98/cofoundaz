"use client";

import React, { useState } from "react";
import { useToast } from "../ToastContext";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  const { triggerToast } = useToast();

  const [pendingReviews, setPendingReviews] = useState([
    { id: "pr-1", providerName: "Sarah Jenkins", service: "Landing Page Redesign" }
  ]);
  
  const [submittedReviews] = useState([
    { id: "sr-1", providerName: "Alex Okafor", service: "Terms of Service Drafting", rating: 5, date: "Aug 20, 2026", comment: "Alex was incredibly fast and thorough. Highly recommended for IP work." }
  ]);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleSubmitReview = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      triggerToast("Please select a star rating.");
      return;
    }
    setPendingReviews(prev => prev.filter(r => r.id !== id));
    setRating(0);
    setReviewText("");
    triggerToast("Review submitted successfully!");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto pt-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Reviews</h1>
        <p className="text-sm text-sage-500">Share your experience to help the Cofoundaz community.</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-sage-900">Pending reviews</h3>
          {pendingReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 md:p-8 space-y-6">
              <div>
                <h4 className="font-semibold text-lg text-sage-900">How was your engagement with {review.providerName}?</h4>
                <p className="text-sm text-sage-500">Service: {review.service}</p>
              </div>

              <form onSubmit={(e) => handleSubmitReview(review.id, e)} className="space-y-6">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1 transition-transform hover:scale-110"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? "fill-copper-400 text-copper-400"
                          : "text-sage-300"
                      }`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage-500">Feedback</label>
                  <textarea
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us what went well, what could be improved, and if you'd work with them again..."
                    className="w-full h-32 bg-sage-50 border border-sage-200 rounded-input px-4 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-2.5 px-6 rounded-card text-sm transition-colors shadow-card"
                >
                  Submit review
                </button>
              </form>
            </div>
          ))}
          {pendingReviews.length === 0 && (
            <div className="bg-sage-50 rounded-modal border border-sage-200/50 p-6 text-center text-sage-500 text-sm font-medium">
              You have no pending reviews.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-sage-900">Submitted reviews</h3>
          {submittedReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sage-900">{review.providerName}</h4>
                  <p className="text-xs text-sage-500">{review.service}</p>
                </div>
                <span className="text-xs text-sage-400 font-medium">{review.date}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-3.5 h-3.5 ${
                    star <= review.rating ? "fill-copper-400 text-copper-400" : "text-sage-200"
                  }`} />
                ))}
              </div>
              <p className="text-sm text-sage-700 italic border-l-2 border-sage-200 pl-3">
                &quot;{review.comment}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
