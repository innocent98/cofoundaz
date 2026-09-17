'use client';

import React from 'react';
import { Check } from 'lucide-react';

export default function MissionCompletedPage() {
  const completedTasksGrouped = [
    {
      group: 'TODAY',
      tasks: [
        {
          id: 201,
          title: 'Interview 3 gig workers about how they save today',
        },
      ],
    },
    {
      group: 'YESTERDAY',
      tasks: [
        {
          id: 202,
          title: 'Set up the smoke-test landing page',
        },
        {
          id: 203,
          title: 'Categorized last month’s expenses',
        },
      ],
    },
    {
      group: 'SATURDAY',
      tasks: [
        {
          id: 204,
          title: 'Wrote the problem statement',
        },
        {
          id: 205,
          title: 'Shortlisted 3 grant options',
        },
      ],
    },
  ];

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
            Completed
          </h2>

          <div className="bg-[#EAF2ED] text-[#2D5A3F] px-4 py-2 rounded-full text-xs font-semibold shrink-0">
            This week: 86% complete
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {completedTasksGrouped.map((section) => (
            <div key={section.group} className="flex flex-col gap-2.5">
              <h3 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                {section.group}
              </h3>

              <div className="flex flex-col gap-2.5">
                {section.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-modal px-5 py-4 border border-[#EBEBE6] shadow-card flex items-center gap-3.5"
                  >
                    <div className="w-6 h-6 rounded-input bg-[#2B4C38] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </div>

                    <span className="text-sm font-medium text-[#1E2923]">
                      {task.title}
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
