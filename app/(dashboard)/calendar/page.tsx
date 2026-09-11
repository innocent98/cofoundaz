'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Bell, Menu } from 'lucide-react';
import { useCalendarApi, FilterType } from '@/hooks/useCalendarApi';
import { useToast } from './ToastContext';

export default function CalendarPage() {
  const { eventsData, daysOfWeek, gridMatrix, weekDaysList, weekEventsData, hoursList, agendaGroups } = useCalendarApi();
  const { triggerToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'Month' | 'Week' | 'Agenda'>('Month');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const getEventBadgeStyles = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-[#F2ECE1] text-[#7A6025]';
      case 'meeting': return 'bg-[#183B28] text-white';
      case 'deadline': return 'bg-[#FDF2F2] text-[#B93838]';
      case 'task': return 'bg-[#E5EFEA] text-[#1E3E2B]';
      default: return 'bg-[#F5F5F0] text-[#617065]';
    }
  };

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
        
${fixExtract(extractMonth).replace(/WEEK_DAYS_LIST/g, 'weekDaysList').replace(/WEEK_EVENTS_DATA/g, 'weekEventsData').replace(/DAYS_OF_WEEK_LIST/g, 'daysOfWeek').replace(/CALENDAR_DAYS_GRID_MATRIX/g, 'gridMatrix').replace(/CALENDAR_EVENTS_DATA/g, 'eventsData')}
      )}

      {activeTab === 'Week' && (
        
${fixExtract(extractWeek).replace(/WEEK_DAYS_LIST/g, 'weekDaysList').replace(/WEEK_EVENTS_DATA/g, 'weekEventsData').replace(/HOURS_LIST/g, 'hoursList')}
      )}

      {activeTab === 'Agenda' && (
        
${fixExtract(extractAgenda).replace(/AGENDA_GROUPS_DATA/g, 'agendaGroups')}
      )}

      {/* Reused Event Modal Drawer from original */}
      ${extractModals}
    </>
  );
}
