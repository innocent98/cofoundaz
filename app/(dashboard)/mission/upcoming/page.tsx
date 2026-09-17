'use client';

import React from 'react';
import { GripVertical } from 'lucide-react';

export default function MissionUpcomingPage() {
  // Static grouped upcoming tasks from the design
  const upcomingTasksGrouped = [
    {
      group: 'TOMORROW, TUE',
      tasks: [
        {
          id: 101,
          title: 'Send the pricing survey to 20 users',
          tag: 'Pricing test',
        },
        {
          id: 102,
          title: "Log this week's interview notes",
          tag: 'Validate demand',
        },
      ],
    },
    {
      group: 'WED',
      tasks: [
        {
          id: 103,
          title: 'Draft the WhatsApp launch post',
          tag: 'First campaign',
        },
      ],
    },
    {
      group: 'THU',
      tasks: [
        {
          id: 104,
          title: 'Review runway assumptions with Grace',
          tag: 'Finance',
        },
      ],
    },
    {
      group: 'FRI',
      tasks: [
        {
          id: 105,
          title: 'Close out the validation milestone',
          tag: 'Validate demand',
        },
      ],
    },
  ];

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
            Upcoming
          </h2>
          <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
            The next 7 days, drawn from your roadmap. Reorder any time.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {upcomingTasksGrouped.map((section) => (
            <div key={section.group} className="flex flex-col gap-2.5">
              <h3 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                {section.group}
              </h3>

              <div className="flex flex-col gap-2.5">
                {section.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-modal px-5 py-4 border border-[#EBEBE6] shadow-card hover:border-[#D5DDD6] transition-all flex items-center justify-between gap-4 group cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <GripVertical className="w-4 h-4 text-[#C0C9C2] group-hover:text-[#8E9B90] transition-colors shrink-0" />
                      <span className="text-sm font-semibold text-[#1E2923] truncate">
                        {task.title}
                      </span>
                    </div>

                    <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-medium px-3.5 py-1.5 rounded-full shrink-0">
                      {task.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
