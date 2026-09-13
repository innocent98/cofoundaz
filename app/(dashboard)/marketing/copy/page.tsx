'use client';

import React, { useState } from "react";
import { useToast } from "../ToastContext";

export default function MarketingCopyPage() {
  const { triggerToast } = useToast();

  const [assetType, setAssetType] = useState<string>("Social post");
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState<boolean>(false);
  
  const [channel, setChannel] = useState<string>("WhatsApp");
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState<boolean>(false);

  const [selectedTone, setSelectedTone] = useState<string>("Friendly");
  const [keyMessage, setKeyMessage] = useState<string>("Saving should be effortless, even on irregular income");
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const assetTypes = ["Social post", "Ad", "Email", "Landing headline"];
  const channels = ["WhatsApp", "Instagram", "X", "Email"];
  const tones = ["Bold", "Friendly", "Expert", "Playful"];

  const generateCopy = () => {
    if (!keyMessage) return;
    setHasGenerated(true);
    triggerToast("AI Copy generated successfully!");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          AI copy generator
        </h1>
      </div>

      <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 shadow-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          <div className="space-y-2 relative">
            <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
              Asset type
            </label>
            <div
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-sage-400"
            >
              <span className="text-sage-900">{assetType}</span>
              <span className="text-sage-500 text-xs">▼</span>
            </div>

            {isAssetDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage-200 rounded-card shadow-raised z-30 overflow-hidden">
                {assetTypes.map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      setAssetType(type);
                      setIsAssetDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sage-100 ${
                      assetType === type ? "bg-sage-200/60 font-semibold text-[#0e271f]" : "text-sage-700"
                    }`}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
              Channel
            </label>
            <div
              onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}
              className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-sage-400"
            >
              <span className="text-sage-900">{channel}</span>
              <span className="text-sage-500 text-xs">▼</span>
            </div>

            {isChannelDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage-200 rounded-card shadow-raised z-30 overflow-hidden">
                {channels.map((ch) => (
                  <div
                    key={ch}
                    onClick={() => {
                      setChannel(ch);
                      setIsChannelDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-sage-100 ${
                      channel === ch ? "bg-sage-200/60 font-semibold text-[#0e271f]" : "text-sage-700"
                    }`}
                  >
                    {ch}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
            Tone
          </label>
          <div className="flex flex-wrap gap-2.5">
            {tones.map((tone) => {
              const isSelected = selectedTone === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setSelectedTone(tone)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0e271f] text-white shadow-card"
                      : "bg-white border border-sage-200 text-sage-700 hover:bg-sage-50"
                  }`}
                >
                  {tone}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
            Key message
          </label>
          <div className="bg-white rounded-card border border-sage-300 overflow-hidden">
            <input
              type="text"
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              className="w-full px-4 py-3 bg-transparent text-sm text-sage-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <button
            onClick={generateCopy}
            className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-6 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card"
          >
            Generate copy
          </button>
        </div>
      </div>

      {hasGenerated && (
        <div className="space-y-4 animate-fadeIn pt-4">
          <p className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
            Ship two. Let the audience pick the winner.
          </p>

          {[
            "Your money disappears before the weekend? Kolo saves a little from every job, automatically. No bank, no willpower needed.",
            "The ajo box is not safe, and you know it. Kolo keeps your savings locked, growing, and one tap away. Join the waitlist.",
            "Save without thinking about it. Kolo rounds up every ride and delivery into savings that actually add up. Early access open now.",
          ].map((copyText, idx) => (
            <div
              key={idx}
              className="bg-white rounded-modal p-6 border border-sage-200/80 shadow-card space-y-4"
            >
              <p className="text-sage-900 text-sm md:text-base leading-relaxed">
                {copyText}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => triggerToast("Copy selected & applied!")}
                  className="bg-[#0e271f] hover:bg-[#15382d] text-white font-semibold px-4 py-1.5 rounded-card text-xs transition-colors cursor-pointer"
                >
                  Use
                </button>
                <button
                  onClick={() => triggerToast("Refining options with AI...")}
                  className="bg-white border border-sage-300 text-sage-700 hover:bg-sage-50 font-semibold px-4 py-1.5 rounded-card text-xs transition-colors cursor-pointer"
                >
                  Refine
                </button>
                <button
                  onClick={() => triggerToast("Saved to calendar!")}
                  className="text-[#0e271f] hover:underline font-semibold text-xs cursor-pointer ml-auto"
                >
                  Save to calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
