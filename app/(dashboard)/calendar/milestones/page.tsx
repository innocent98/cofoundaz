'use client';

import React, { useState } from 'react';
import { Clock, AlertCircle, Check, Circle, Plus, X } from 'lucide-react';
import { useCalendarApi } from '@/hooks/useCalendarApi';

const useToast = () => ({ triggerToast: (msg: string) => console.log(msg) });

export default function MilestonesPage() {
  const { milestones } = useCalendarApi();
  const { triggerToast } = useToast();
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-07-15');

  const showToast = (msg: string) => triggerToast(msg);

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEventModalOpen(false);
    showToast('New milestone created.');
    setEventTitle('');
  };

  return (
    <>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Milestones</h1>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-[#617065]">3 of 7 complete this quarter</span>
            <button 
              onClick={() => { setIsEventModalOpen(true); showToast('New milestone drawer opened.'); }}
              className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
            >
              <Plus size={15} />
              <span>+ Milestone</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {milestones.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => showToast(`Opened milestone: ${item.title}`)}
              className={`bg-white border ${item.cardBorderClass || 'border-[#E8E8E2]'} rounded-[24px] p-6 shadow-card space-y-4 cursor-pointer hover:border-[#D5DDD6] transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3.5">
                  <div className={`w-8 h-8 rounded-card flex items-center justify-center shrink-0 ${item.iconType === 'progress' ? 'bg-[#F2ECE1] text-[#7A6025]' : item.iconType === 'risk' ? 'bg-[#FDF2F2] text-[#B93838]' : item.iconType === 'complete' ? 'bg-[#183B28] text-white' : 'bg-[#F5F5F0] text-[#617065]'}`}>
                    {item.iconType === 'progress' && <Clock size={16} />}
                    {item.iconType === 'risk' && <AlertCircle size={16} />}
                    {item.iconType === 'complete' && <Check size={16} />}
                    {item.iconType === 'default' && <Circle size={16} />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-[#1E2923]">{item.title}</h2>
                    <p className="text-xs text-[#617065] mt-0.5">{item.dueDate}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${item.badgeClass}`}>{item.status}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#617065]">{item.tasksInfo}</span>
                  <span className="font-semibold text-[#1E2923]">{item.progress}%</span>
                </div>
                <div className="w-full bg-[#F5F5F0] h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${item.progressBarClass}`} style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL: NEW EVENT / MILESTONE DRAWER */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 shadow-accent max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display text-[#1E2923]">Create calendar milestone</h2>
              <button onClick={() => setIsEventModalOpen(false)} className="p-1 rounded-card text-[#617065] hover:bg-[#F5F5F0]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Milestone Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Series A term sheet signed"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-card px-3 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Date</label>
                <input 
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-card px-3 py-2 text-xs text-[#1E2923] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#E8E8E2] rounded-card text-xs font-semibold text-[#1E2923] hover:bg-[#F5F5F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-card text-xs font-semibold shadow-card transition-colors"
                >
                  Save milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
