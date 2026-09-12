'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useCalendarApi, FilterType } from '@/hooks/useCalendarApi';

const useToast = () => ({ triggerToast: (msg: string) => console.log(msg) });

export default function CalendarPage() {
  const { eventsData, daysOfWeek, gridMatrix, weekDaysList, weekEventsData, hoursList, agendaGroups } = useCalendarApi();
  const { triggerToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'Month' | 'Week' | 'Agenda'>('Month');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'milestone' | 'meeting' | 'deadline' | 'task'>('meeting');
  const [eventDate, setEventDate] = useState('2026-07-15');

  const showToast = (msg: string) => triggerToast(msg);

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEventModalOpen(false);
    showToast('New event created.');
    setEventTitle('');
  };

  const getEventBadgeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case 'milestone': return 'bg-[#F2ECE1] text-[#7A6025] border-l-2 border-[#B39353]';
      case 'meeting': return 'bg-[#183B28] text-white';
      case 'deadline': return 'bg-[#FDF2F2] text-[#B93838] border-l-2 border-[#B93838]';
      case 'task': return 'bg-[#E5EFEA] text-[#1E3E2B]';
      default: return 'bg-[#F5F5F0] text-[#617065]';
    }
  };

  const filteredEvents = eventsData.filter(ev => {
    if (selectedFilter === 'All') return true;
    return ev.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <>
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#E8E8E2] bg-white">
        <div className="flex space-x-6">
          {(['Month', 'Week', 'Agenda'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 -mb-[17px] text-sm font-semibold transition-colors ${activeTab === tab ? 'text-[#183B28] border-b-2 border-[#183B28]' : 'text-[#617065] hover:text-[#183B28]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Month' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">July 2026</h1>
              <div className="flex items-center space-x-1 border border-[#E8E8E2] rounded-card bg-white p-0.5 shadow-card">
                <button onClick={() => showToast('Switched to previous month.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => showToast('Switched to next month.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-white border border-[#E8E8E2] p-1 rounded-modal shadow-card overflow-x-auto">
                {(['All', 'Milestone', 'Meeting', 'Deadline', 'Task'] as FilterType[]).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-card text-xs font-medium flex items-center space-x-1.5 transition-colors ${isSelected ? 'bg-[#183B28] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filter === 'All' ? 'bg-sage-400' : filter === 'Milestone' ? 'bg-[#B39353]' : filter === 'Meeting' ? 'bg-[#183B28]' : filter === 'Deadline' ? 'bg-[#B93838]' : 'bg-[#1E3E2B]'}`} />
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
                className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Event</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E8E8E2] rounded-[24px] shadow-card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#E8E8E2] bg-[#F9F9F6] text-center">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="py-3 text-[10px] font-bold text-[#8E9B90] tracking-wider">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E8E2]">
              {gridMatrix.flat().map((dayNum, index) => {
                const dayEvents = dayNum !== null ? filteredEvents.filter(ev => ev.day === dayNum) : [];
                return (
                  <div key={index} className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${dayNum === null ? 'bg-[#FCFCFB] opacity-40' : 'bg-white hover:bg-[#FAF9F5]'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${dayNum === 27 ? 'bg-[#183B28] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold' : 'text-[#617065]'}`}>{dayNum !== null ? dayNum : ''}</span>
                    </div>
                    <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                      {dayEvents.map((ev, eIdx) => (
                        <div key={eIdx} onClick={() => showToast(`Opened event: ${ev.title}`)} className={`px-2 py-1 rounded text-[10px] font-medium truncate cursor-pointer transition-all hover:opacity-90 shadow-card ${getEventBadgeStyles(ev.type)}`}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'Week' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">July 12 – 18, 2026</h1>
              <div className="flex items-center space-x-1 border border-[#E8E8E2] rounded-card bg-white p-0.5 shadow-card">
                <button onClick={() => showToast('Switched to previous week.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => showToast('Switched to next week.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-white border border-[#E8E8E2] p-1 rounded-modal shadow-card overflow-x-auto">
                {(['All', 'Milestone', 'Meeting', 'Deadline', 'Task'] as FilterType[]).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-card text-xs font-medium flex items-center space-x-1.5 transition-colors ${isSelected ? 'bg-[#183B28] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filter === 'All' ? 'bg-sage-400' : filter === 'Milestone' ? 'bg-[#B39353]' : filter === 'Meeting' ? 'bg-[#183B28]' : filter === 'Deadline' ? 'bg-[#B93838]' : 'bg-[#1E3E2B]'}`} />
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
                className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Event</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E8E8E2] rounded-[24px] shadow-card overflow-hidden">
            <div className="grid grid-cols-8 border-b border-[#E8E8E2] bg-[#F9F9F6] text-center">
              <div className="py-3 text-[10px] font-bold text-[#8E9B90] tracking-wider border-r border-[#E8E8E2]">TIME</div>
              {weekDaysList.map((d, idx) => (
                <div key={idx} className="py-3 text-center border-r border-[#E8E8E2] last:border-r-0">
                  <span className="text-[10px] font-bold text-[#8E9B90] tracking-wider block">{d.name}</span>
                  <span className={`text-xs font-semibold mt-0.5 inline-block ${d.num === 13 ? 'bg-[#183B28] text-white w-5 h-5 rounded-full flex items-center justify-center mx-auto' : 'text-[#1E2923]'}`}>{d.num}</span>
                </div>
              ))}
            </div>

            <div className="divide-y divide-[#E8E8E2]">
              {hoursList.map((hour, hIdx) => (
                <div key={hIdx} className="grid grid-cols-8 min-h-[70px] divide-x divide-[#E8E8E2]">
                  <div className="p-2 text-[10px] font-medium text-[#8E9B90] text-right pr-3 bg-[#FCFCFB] flex items-start justify-end pt-3">{hour}</div>
                  {weekDaysList.map((dayObj, dIdx) => {
                    const matchingEvents = weekEventsData.filter(ev => ev.dayIndex === dIdx && ev.time === hour && (selectedFilter === 'All' || ev.type.toLowerCase() === selectedFilter.toLowerCase()));
                    return (
                      <div key={dIdx} className="p-1.5 bg-white hover:bg-[#FAF9F5] transition-colors relative space-y-1">
                        {matchingEvents.map((ev, eIdx) => (
                          <div key={eIdx} onClick={() => showToast(`Opened event: ${ev.title}`)} className={`p-2 rounded text-[11px] font-medium cursor-pointer transition-all hover:opacity-90 shadow-card ${getEventBadgeStyles(ev.type)}`}>
                            <p className="font-semibold leading-tight">{ev.title}</p>
                            <p className="text-[9px] opacity-80 mt-0.5">{ev.time}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'Agenda' && (
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Agenda</h1>
            <button 
              onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
              className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
            >
              <Plus size={15} />
              <span>+ Event</span>
            </button>
          </div>

          <div className="space-y-8">
            {agendaGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h2 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">{group.dateLabel}</h2>
                <div className="space-y-3">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      onClick={() => showToast(`Opened agenda item: ${item.title}`)}
                      className={`bg-white border border-[#E8E8E2] rounded-modal p-5 shadow-card flex items-center justify-between border-l-4 ${item.borderColor} hover:border-[#D5DDD6] transition-all cursor-pointer`}
                    >
                      <div className="flex items-center space-x-6">
                        <span className="text-xs font-semibold text-[#8E9B90] w-12 shrink-0">{item.time}</span>
                        <div>
                          <h3 className="font-semibold text-xs text-[#1E2923]">{item.title}</h3>
                          <p className="text-xs text-[#617065] mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${item.type === 'Milestone' ? 'bg-[#F2ECE1] text-[#7A6025]' : item.type === 'Meeting' ? 'bg-[#183B28] text-white' : item.type === 'Deadline' ? 'bg-[#FDF2F2] text-[#B93838]' : 'bg-[#E5EFEA] text-[#1E3E2B]'}`}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* MODAL: NEW EVENT / MILESTONE DRAWER */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 md:p-8 shadow-accent max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display text-[#1E2923]">Create calendar event</h2>
              <button onClick={() => setIsEventModalOpen(false)} className="p-1 rounded-card text-[#617065] hover:bg-[#F5F5F0]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Event Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Investor pitch meeting"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-card px-3 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Event Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['milestone', 'meeting', 'deadline', 'task'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setEventType(t)}
                      className={`py-1.5 rounded-card text-xs font-semibold capitalize border transition-all ${eventType === t ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-[#617065] border-[#E8E8E2] hover:bg-[#F5F5F0]'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
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
                  Save event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
