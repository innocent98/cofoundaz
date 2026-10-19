'use client';

import React from 'react';
import { toast } from 'sonner';
import { useMissionApi, type MissionSettings } from '@/hooks/useMissionApi';

const TIMES = ['05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM'];
const SIZES = [1, 2, 3];

const timeLabel = (t: string) => t.replace(/^0/, '');

export default function MissionSettingsPage() {
  const { settings, settingsError, updateSettings, refetch } = useMissionApi();

  const save = async (patch: Partial<MissionSettings>) => {
    if (await updateSettings(patch)) toast.success('Settings saved.');
    else toast.error("Couldn't save that change. Your settings were restored.");
  };

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">Mission settings</h2>
          <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">Shape how your daily mission arrives.</p>
        </div>

        {!settings && !settingsError && (
          <div role="status" aria-label="Loading mission settings" className="flex flex-col gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-modal h-40 border border-[#EBEBE6] shadow-card animate-pulse" />
            ))}
          </div>
        )}

        {!settings && settingsError && (
          <div role="alert" className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-modal p-4 text-sm text-[#B0483B] flex items-center justify-between gap-3">
            <span>We couldn&apos;t load your mission settings.</span>
            <button type="button" onClick={() => void refetch()} className="text-xs font-semibold underline cursor-pointer">
              Try again
            </button>
          </div>
        )}

        {settings && (
          <>
            <div className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
              <h3 id="mission-size-label" className="text-sm font-semibold text-[#1E2923]">
                Mission size
              </h3>

              <div role="radiogroup" aria-labelledby="mission-size-label" className="grid grid-cols-3 gap-4">
                {SIZES.map((size) => {
                  const selected = settings.missionSize === size;
                  return (
                    <label
                      key={size}
                      className={`rounded-card p-5 border transition-all flex flex-col items-center justify-center cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-[#183B28] ${
                        selected ? 'bg-[#E3EFE8] border-[#183B28] text-[#183B28]' : 'bg-white border-[#EBEBE6] text-[#1E2923] hover:border-[#C5CFC7]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mission-size"
                        value={size}
                        checked={selected}
                        onChange={() => void save({ missionSize: size })}
                        className="sr-only"
                      />
                      <span className="text-2xl font-display font-semibold">{size}</span>
                      <span className="text-xs text-[#768478] mt-1 font-medium">{size === 1 ? 'task' : 'tasks'}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#F0F0EC]">
                <div>
                  <label htmlFor="delivery-time" className="text-sm font-semibold text-[#1E2923]">
                    Delivery time
                  </label>
                  <p className="text-xs text-[#768478] mt-1 font-normal">When your mission lands each morning.</p>
                </div>

                <select
                  id="delivery-time"
                  value={settings.deliveryTime}
                  onChange={(e) => void save({ deliveryTime: e.target.value })}
                  className="bg-white border border-[#EBEBE6] rounded-card px-4 py-2 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#183B28] cursor-pointer shadow-card"
                >
                  {(TIMES.includes(settings.deliveryTime) ? TIMES : [...TIMES, settings.deliveryTime]).map((t) => (
                    <option key={t} value={t}>
                      {timeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <div>
                  <h3 id="weekends-off-label" className="text-sm font-semibold text-[#1E2923]">
                    Weekends off
                  </h3>
                  <p id="weekends-off-desc" className="text-xs text-[#768478] mt-1 font-normal">
                    Rest is a strategy too.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.weekendsOff}
                  aria-labelledby="weekends-off-label"
                  aria-describedby="weekends-off-desc"
                  onClick={() => void save({ weekendsOff: !settings.weekendsOff })}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183B28] ${
                    settings.weekendsOff ? 'bg-[#183B28]' : 'bg-[#C5CFC7]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.weekendsOff ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
