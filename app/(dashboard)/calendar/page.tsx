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
      case 'milestone': return 'bg-accent-xf2ece1 text-accent-x7a6025 border-l-2 border-accent-gold';
      case 'meeting': return 'bg-brand-strong text-white';
      case 'deadline': return 'bg-danger-tint text-danger-bold border-l-2 border-danger-bold';
      case 'task': return 'bg-neutral-xe5efea text-brand-x1e3e2b';
      default: return 'bg-surface-muted text-ink-muted';
    }
  };

  const filteredEvents = eventsData.filter(ev => {
    if (selectedFilter === 'All') return true;
    return ev.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <>
      <div className="flex justify-between items-center px-6 py-4 border-b border-line bg-white">
        <div className="flex space-x-6">
          {(['Month', 'Week', 'Agenda'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 -mb-[17px] text-sm font-semibold transition-colors ${activeTab === tab ? 'text-brand-strong border-b-2 border-brand-strong' : 'text-ink-muted hover:text-brand-strong'}`}
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
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">July 2026</h1>
              <div className="flex items-center space-x-1 border border-line rounded-card bg-white p-0.5 shadow-card">
                <button onClick={() => showToast('Switched to previous month.')} className="p-1 hover:bg-surface-muted rounded text-ink-muted transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => showToast('Switched to next month.')} className="p-1 hover:bg-surface-muted rounded text-ink-muted transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-white border border-line p-1 rounded-modal shadow-card overflow-x-auto">
                {(['All', 'Milestone', 'Meeting', 'Deadline', 'Task'] as FilterType[]).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-card text-xs font-medium flex items-center space-x-1.5 transition-colors ${isSelected ? 'bg-brand-strong text-white font-semibold' : 'text-ink-muted hover:bg-surface-muted'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filter === 'All' ? 'bg-neutral-400' : filter === 'Milestone' ? 'bg-accent-gold' : filter === 'Meeting' ? 'bg-brand-strong' : filter === 'Deadline' ? 'bg-danger-bold' : 'bg-brand-x1e3e2b'}`} />
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
                className="px-4 py-2 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Event</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-neutral-xf9f9f6 text-center">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="py-3 text-[10px] font-bold text-ink-subtle tracking-wider">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-line">
              {gridMatrix.flat().map((dayNum, index) => {
                const dayEvents = dayNum !== null ? filteredEvents.filter(ev => ev.day === dayNum) : [];
                return (
                  <div key={index} className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${dayNum === null ? 'bg-neutral-xfcfcfb opacity-40' : 'bg-white hover:bg-neutral-xfaf9f5'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${dayNum === 27 ? 'bg-brand-strong text-white w-5 h-5 rounded-full flex items-center justify-center font-bold' : 'text-ink-muted'}`}>{dayNum !== null ? dayNum : ''}</span>
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
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">July 12 - 18, 2026</h1>
              <div className="flex items-center space-x-1 border border-line rounded-card bg-white p-0.5 shadow-card">
                <button onClick={() => showToast('Switched to previous week.')} className="p-1 hover:bg-surface-muted rounded text-ink-muted transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => showToast('Switched to next week.')} className="p-1 hover:bg-surface-muted rounded text-ink-muted transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-white border border-line p-1 rounded-modal shadow-card overflow-x-auto">
                {(['All', 'Milestone', 'Meeting', 'Deadline', 'Task'] as FilterType[]).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-card text-xs font-medium flex items-center space-x-1.5 transition-colors ${isSelected ? 'bg-brand-strong text-white font-semibold' : 'text-ink-muted hover:bg-surface-muted'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filter === 'All' ? 'bg-neutral-400' : filter === 'Milestone' ? 'bg-accent-gold' : filter === 'Meeting' ? 'bg-brand-strong' : filter === 'Deadline' ? 'bg-danger-bold' : 'bg-brand-x1e3e2b'}`} />
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
                className="px-4 py-2 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Event</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
            <div className="grid grid-cols-8 border-b border-line bg-neutral-xf9f9f6 text-center">
              <div className="py-3 text-[10px] font-bold text-ink-subtle tracking-wider border-r border-line">TIME</div>
              {weekDaysList.map((d, idx) => (
                <div key={idx} className="py-3 text-center border-r border-line last:border-r-0">
                  <span className="text-[10px] font-bold text-ink-subtle tracking-wider block">{d.name}</span>
                  <span className={`text-xs font-semibold mt-0.5 inline-block ${d.num === 13 ? 'bg-brand-strong text-white w-5 h-5 rounded-full flex items-center justify-center mx-auto' : 'text-ink'}`}>{d.num}</span>
                </div>
              ))}
            </div>

            <div className="divide-y divide-line">
              {hoursList.map((hour, hIdx) => (
                <div key={hIdx} className="grid grid-cols-8 min-h-[70px] divide-x divide-line">
                  <div className="p-2 text-[10px] font-medium text-ink-subtle text-right pr-3 bg-neutral-xfcfcfb flex items-start justify-end pt-3">{hour}</div>
                  {weekDaysList.map((dayObj, dIdx) => {
                    const matchingEvents = weekEventsData.filter(ev => ev.dayIndex === dIdx && ev.time === hour && (selectedFilter === 'All' || ev.type.toLowerCase() === selectedFilter.toLowerCase()));
                    return (
                      <div key={dIdx} className="p-1.5 bg-white hover:bg-neutral-xfaf9f5 transition-colors relative space-y-1">
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
            <h1 className="text-3xl font-display text-ink-strong tracking-tight">Agenda</h1>
            <button 
              onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
              className="px-4 py-2 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-modal text-xs font-semibold flex items-center space-x-1.5 shadow-card transition-colors h-[36px]"
            >
              <Plus size={15} />
              <span>+ Event</span>
            </button>
          </div>

          <div className="space-y-8">
            {agendaGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h2 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">{group.dateLabel}</h2>
                <div className="space-y-3">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      onClick={() => showToast(`Opened agenda item: ${item.title}`)}
                      className={`bg-white border border-line rounded-modal p-5 shadow-card flex items-center justify-between border-l-4 ${item.borderColor} hover:border-line-strong transition-all cursor-pointer`}
                    >
                      <div className="flex items-center space-x-6">
                        <span className="text-xs font-semibold text-ink-subtle w-12 shrink-0">{item.time}</span>
                        <div>
                          <h3 className="font-semibold text-xs text-ink">{item.title}</h3>
                          <p className="text-xs text-ink-muted mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${item.type === 'Milestone' ? 'bg-accent-xf2ece1 text-accent-x7a6025' : item.type === 'Meeting' ? 'bg-brand-strong text-white' : item.type === 'Deadline' ? 'bg-danger-tint text-danger-bold' : 'bg-neutral-xe5efea text-brand-x1e3e2b'}`}>
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
          <div className="bg-white border border-line rounded-[24px] p-6 md:p-8 shadow-accent max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display text-ink">Create calendar event</h2>
              <button onClick={() => setIsEventModalOpen(false)} className="p-1 rounded-card text-ink-muted hover:bg-surface-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Event Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Investor pitch meeting"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-white border border-line rounded-card px-3 py-2 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-accent-bronze"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Event Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['milestone', 'meeting', 'deadline', 'task'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setEventType(t)}
                      className={`py-1.5 rounded-card text-xs font-semibold capitalize border transition-all ${eventType === t ? 'bg-brand-x1c3b2b text-white border-brand-x1c3b2b' : 'bg-white text-ink-muted border-line hover:bg-surface-muted'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Date</label>
                <input 
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-white border border-line rounded-card px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent-bronze"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-line rounded-card text-xs font-semibold text-ink hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-card text-xs font-semibold shadow-card transition-colors"
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
