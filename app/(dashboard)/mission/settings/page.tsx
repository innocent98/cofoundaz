'use client';

import React from 'react';
import { useMissionApi } from '@/hooks/useMissionApi';

export default function MissionSettingsPage() {
  const { settings, updateSettings, isReady } = useMissionApi();

  if (!isReady) return null;

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        {/* Header Info */}
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
            Mission settings
          </h2>
          <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
            Shape how your daily mission arrives.
          </p>
        </div>

        {/* Mission Size Card */}
        <div className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-[#1E2923]">
            Mission size
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((size) => {
              const isSelected = settings.missionSize === size;
              return (
                <button
                  key={size}
                  onClick={() => updateSettings({ missionSize: size })}
                  className={`rounded-card p-5 border transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#E3EFE8] border-[#183B28] text-[#183B28]'
                      : 'bg-white border-[#EBEBE6] text-[#1E2923] hover:border-[#C5CFC7]'
                  }`}
                >
                  <span className="text-2xl font-display font-semibold">
                    {size}
                  </span>
                  <span className="text-xs text-[#768478] mt-1 font-medium">
                    {size === 1 ? 'task' : 'tasks'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery Time & Weekends Off Card */}
        <div className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          {/* Delivery Time Option */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#F0F0EC]">
            <div>
              <h3 className="text-sm font-semibold text-[#1E2923]">
                Delivery time
              </h3>
              <p className="text-xs text-[#768478] mt-1 font-normal">
                When your mission lands each morning.
              </p>
            </div>

            <select
              value={settings.deliveryTime}
              onChange={(e) => updateSettings({ deliveryTime: e.target.value })}
              className="bg-white border border-[#EBEBE6] rounded-card px-4 py-2 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#183B28] cursor-pointer shadow-card"
            >
              <option value="05:00 AM">5:00 AM</option>
              <option value="06:00 AM">6:00 AM</option>
              <option value="07:00 AM">7:00 AM</option>
              <option value="08:00 AM">8:00 AM</option>
              <option value="09:00 AM">9:00 AM</option>
            </select>
          </div>

          {/* Weekends Off Option */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-sm font-semibold text-[#1E2923]">
                Weekends off
              </h3>
              <p className="text-xs text-[#768478] mt-1 font-normal">
                Rest is a strategy too.
              </p>
            </div>

            <button
              onClick={() => updateSettings({ weekendsOff: !settings.weekendsOff })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.weekendsOff ? 'bg-[#183B28]' : 'bg-[#C5CFC7]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.weekendsOff ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
