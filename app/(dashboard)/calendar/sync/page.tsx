'use client';

import React, { useState } from 'react';

const useToast = () => ({ triggerToast: (msg: string) => console.log(msg) });

export default function SyncPage() {
  const { triggerToast } = useToast();
  
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isAppleConnected, setIsAppleConnected] = useState(false);
  const [blockFocusTime, setBlockFocusTime] = useState(true);
  const [remindDeadlines, setRemindDeadlines] = useState(true);
  const [showWeekends, setShowWeekends] = useState(false);

  const showToast = (msg: string) => triggerToast(msg);

  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Calendar sync</h1>
        <p className="text-xs text-[#617065]">Bring your real calendar in so your mission never collides with a meeting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Calendar */}
        <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-modal bg-[#EAF2ED] text-[#183B28] flex items-center justify-center font-bold text-sm shrink-0">G</div>
            <div className="space-y-0.5">
              <h2 className="font-semibold text-xs text-[#1E2923]">Google Calendar</h2>
              <p className="text-xs text-[#617065]">{isGoogleConnected ? 'Connected as amara@kolo.africa' : 'Not connected'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isGoogleConnected) { setIsGoogleConnected(false); showToast('Google Calendar disconnected.'); }
              else { setIsGoogleConnected(true); showToast('Google Calendar connected as amara@kolo.africa.'); }
            }}
            className={`w-full py-2 rounded-modal text-xs font-semibold transition-colors border shadow-xs ${isGoogleConnected ? 'bg-white text-[#B93838] border-[#E8E8E2] hover:bg-[#FDF2F2]' : 'bg-[#A07C44] text-white border-transparent hover:bg-[#906D3A]'}`}
          >
            {isGoogleConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        {/* Outlook */}
        <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-modal bg-[#F5F5F0] text-[#617065] flex items-center justify-center font-bold text-sm shrink-0">O</div>
            <div className="space-y-0.5">
              <h2 className="font-semibold text-xs text-[#1E2923]">Outlook</h2>
              <p className="text-xs text-[#617065]">{isOutlookConnected ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isOutlookConnected) { setIsOutlookConnected(false); showToast('Outlook disconnected.'); }
              else { setIsOutlookConnected(true); showToast('Connecting to Outlook...'); }
            }}
            className={`w-full py-2 rounded-modal text-xs font-semibold transition-colors border shadow-xs ${isOutlookConnected ? 'bg-white text-[#B93838] border-[#E8E8E2] hover:bg-[#FDF2F2]' : 'bg-[#A07C44] text-white border-transparent hover:bg-[#906D3A]'}`}
          >
            {isOutlookConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        {/* Apple Calendar */}
        <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-modal bg-[#F5F5F0] text-[#617065] flex items-center justify-center font-bold text-sm shrink-0">A</div>
            <div className="space-y-0.5">
              <h2 className="font-semibold text-xs text-[#1E2923]">Apple Calendar</h2>
              <p className="text-xs text-[#617065]">{isAppleConnected ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isAppleConnected) { setIsAppleConnected(false); showToast('Apple Calendar disconnected.'); }
              else { setIsAppleConnected(true); showToast('Connecting to Apple Calendar...'); }
            }}
            className={`w-full py-2 rounded-modal text-xs font-semibold transition-colors border shadow-xs ${isAppleConnected ? 'bg-white text-[#B93838] border-[#E8E8E2] hover:bg-[#FDF2F2]' : 'bg-[#A07C44] text-white border-transparent hover:bg-[#906D3A]'}`}
          >
            {isAppleConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E8E8E2] rounded-[24px] divide-y divide-[#E8E8E2] shadow-xs overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-xs text-[#1E2923]">Block focus time for missions</h3>
            <p className="text-xs text-[#617065]">Reserve a window each morning for your daily mission.</p>
          </div>
          <button onClick={() => { setBlockFocusTime(!blockFocusTime); showToast(`Focus time blocking ${!blockFocusTime ? 'enabled' : 'disabled'}.`); }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${blockFocusTime ? 'bg-[#183B28]' : 'bg-[#D5DDD6]'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform duration-300 ${blockFocusTime ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-xs text-[#1E2923]">Remind me before deadlines</h3>
            <p className="text-xs text-[#617065]">A nudge 3 days and 1 day before anything with a penalty.</p>
          </div>
          <button onClick={() => { setRemindDeadlines(!remindDeadlines); showToast(`Deadline reminders ${!remindDeadlines ? 'enabled' : 'disabled'}.`); }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${remindDeadlines ? 'bg-[#183B28]' : 'bg-[#D5DDD6]'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform duration-300 ${remindDeadlines ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-xs text-[#1E2923]">Show weekends</h3>
            <p className="text-xs text-[#617065]">Include Saturday and Sunday in week view.</p>
          </div>
          <button onClick={() => { setShowWeekends(!showWeekends); showToast(`Weekends view ${!showWeekends ? 'enabled' : 'disabled'}.`); }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${showWeekends ? 'bg-[#183B28]' : 'bg-[#D5DDD6]'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform duration-300 ${showWeekends ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </main>
  );
}
