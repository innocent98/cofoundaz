'use client';

import React from 'react';
import { DashboardErrorBoundary } from './error-boundary';
import type { ActivityLogEntry } from '@/types/dashboard';

export function TemporalFeeds({
  activities,
  onRefetch
}: {
  activities: ActivityLogEntry[];
  onRefetch: () => void;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full col-span-1 md:col-span-12">
      {/* Team Activity Timeline */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-8 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col h-[400px] overflow-hidden">
          <h3 className="font-bold text-base text-sage-900 mb-4 shrink-0">Team Activity</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 [scrollbar-width:thin]">
            {activities.length === 0 ? (
              <p className="text-sm text-sage-500 py-4">
                Activity from you and your team will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative pl-6">
                    {/* Timeline line connecting dots */}
                    {index !== activities.length - 1 && (
                      <div className="absolute top-5 left-[9px] bottom-[-20px] w-px bg-sage-200" />
                    )}
                    <span className="absolute left-1.5 top-2 w-2 h-2 rounded-full bg-sage-300 ring-4 ring-white" />
                    
                    <p className="text-sm text-sage-900">
                      <span className="font-bold">{activity.actor}</span>{' '}
                      <span className="text-sage-600">{activity.verb}</span>{' '}
                      <span className="font-semibold">{activity.entity}</span>
                    </p>
                    <p className="text-[10px] font-bold text-sage-400 mt-0.5">
                      {formatRelativeTime(activity.relativeTime || activity.timestamp || '')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardErrorBoundary>

      {/* Upcoming Schedule */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-4 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col h-[400px]">
          <h3 className="font-bold text-base text-sage-900 mb-4 shrink-0">Upcoming Schedule</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 [scrollbar-width:thin]">
            {/* Mock Schedule Data */}
            <div className="space-y-4">
              <div className="p-3 bg-sage-50 rounded-card border border-sage-100">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-sage-900">Weekly Sync</h4>
                  <span className="bg-copper-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-pill">
                    Tomorrow
                  </span>
                </div>
                <p className="text-xs text-sage-600">10:00 AM - 11:00 AM</p>
              </div>

              <div className="p-3 bg-sage-50 rounded-card border border-sage-100">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-sage-900">Tax Compliance Gate</h4>
                  <span className="bg-[#B0483B] text-white text-[10px] font-bold px-2 py-0.5 rounded-pill">
                    3 days left
                  </span>
                </div>
                <p className="text-xs text-sage-600">File Q3 VAT Returns</p>
              </div>

              <div className="p-3 bg-sage-50 rounded-card border border-sage-100">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-sage-900">Investor Pitch</h4>
                  <span className="bg-sage-200 text-sage-700 text-[10px] font-bold px-2 py-0.5 rounded-pill">
                    5 days
                  </span>
                </div>
                <p className="text-xs text-sage-600">Sahel Fund Partners</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardErrorBoundary>
    </section>
  );
}

// Helper to format time relative to now for < 7 days
function formatRelativeTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
