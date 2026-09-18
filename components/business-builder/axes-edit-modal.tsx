'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PositioningAxes } from '@/hooks/useBusinessPositioningMap';

interface AxesEditModalProps {
  axes: PositioningAxes;
  saving?: boolean;
  onSave: (next: PositioningAxes) => void;
  onClose: () => void;
}

const inputClass =
  'w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58] placeholder:text-[#A3B899]';

export function AxesEditModal({ axes, saving, onSave, onClose }: AxesEditModalProps) {
  const [draft, setDraft] = useState<PositioningAxes>(() => ({
    x: { ...axes.x },
    y: { ...axes.y },
  }));

  const setField = (axis: 'x' | 'y', key: 'label' | 'low' | 'high', value: string) =>
    setDraft((prev) => ({ ...prev, [axis]: { ...prev[axis], [key]: value } }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // All six strings are required (validate_axes 422s on empty/missing).
    onSave(draft);
  };

  const axisFields = (axis: 'x' | 'y', title: string) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-[#55625A] uppercase tracking-wider">{title}</span>
      <input
        type="text"
        required
        value={draft[axis].label}
        onChange={(e) => setField(axis, 'label', e.target.value)}
        placeholder="Axis label (e.g. Price)"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" required value={draft[axis].low} onChange={(e) => setField(axis, 'low', e.target.value)} placeholder="Low end" className={inputClass} />
        <input type="text" required value={draft[axis].high} onChange={(e) => setField(axis, 'high', e.target.value)} placeholder="High end" className={inputClass} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#061A12]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-modal w-full max-w-md shadow-raised overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#FBFBFA]">
          <h3 className="font-bold text-[#1E2923]">Edit map axes</h3>
          <button type="button" onClick={onClose} className="text-[#8E9B90] hover:text-[#1E2923] transition-colors p-1 rounded-input hover:bg-[#E8E8E2]" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {axisFields('x', 'X axis (horizontal)')}
          {axisFields('y', 'Y axis (vertical)')}

          <div className="pt-1 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#12261C] disabled:opacity-60 text-white rounded-card text-sm font-bold transition-colors">{saving ? 'Saving…' : 'Save axes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
