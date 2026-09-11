'use client';

import React, { useState } from "react";
import { useMarketingApi } from "@/hooks/useMarketingApi";
import { useToast } from "../ToastContext";

export default function MarketingCalendarPage() {
  const { triggerToast } = useToast();
  const { calendar } = useMarketingApi();

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 1)); // July 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
            Content calendar
          </h1>
          <div className="flex items-center gap-3 pt-1">
            <button 
              onClick={prevMonth}
              className="text-xs font-semibold text-sage-500 hover:text-sage-900 px-2 py-1 rounded bg-sage-200/60 cursor-pointer"
            >
              ← Prev
            </button>
            <span className="text-sage-600 font-medium text-sm">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={nextMonth}
              className="text-xs font-semibold text-sage-500 hover:text-sage-900 px-2 py-1 rounded bg-sage-200/60 cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>

        <button
          onClick={() => triggerToast("AI proposed a 7-day starter calendar.")}
          className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card flex items-center gap-2 self-start md:self-auto"
        >
          <span>✦</span>
          <span>Plan my first week</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-xs text-sage-600 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9C5B34]"></span>
          <span className="font-medium">Paid social</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0e271f]"></span>
          <span className="font-medium">Organic</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1e4836]"></span>
          <span className="font-medium">Email</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#46735e]"></span>
          <span className="font-medium">Content</span>
        </div>
      </div>

      <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden">
        <div className="grid grid-cols-7 bg-sage-50/80 border-b border-sage-200 text-center text-xs font-bold text-sage-500 uppercase tracking-wider py-3">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
        </div>

        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-sage-100">
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[110px] bg-sage-50/30 p-2 opacity-40"></div>
          ))}

          {Array.from({ length: totalDays }).map((_, index) => {
            const dayNum = index + 1;
            
            // Map live entries to current month
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = calendar.filter((e: any) => e.scheduledAt.startsWith(dayStr));

            return (
              <div
                key={dayNum}
                className="min-h-[115px] p-2 bg-white flex flex-col justify-between hover:bg-sage-50/50 transition-colors"
              >
                <span className="text-xs font-semibold text-sage-700">{dayNum}</span>
                
                <div className="space-y-1 mt-1 flex-1">
                  {dayEvents.map((evt: any, eIdx: number) => {
                    let badgeColor = "bg-[#0e271f] text-white";
                    if (evt.channel === "paid_social") badgeColor = "bg-[#9C5B34] text-white";
                    if (evt.channel === "content_seo") badgeColor = "bg-[#46735e] text-white";
                    if (evt.channel === "email") badgeColor = "bg-[#1e4836] text-white";

                    return (
                      <div
                        key={eIdx}
                        className={`text-[11px] font-medium px-2 py-1 rounded-[6px] truncate shadow-card cursor-pointer ${badgeColor}`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
