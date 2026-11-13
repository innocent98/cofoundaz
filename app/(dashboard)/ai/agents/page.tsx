'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAIAgents } from '@/hooks/useAIBench';

export default function AgentsPage() {
  const router = useRouter();
  const { agents, loading, error, refresh } = useAIAgents();

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-1">Your bench</h2>
        <p className="text-xs text-ink-muted">
          Every specialist, one chat away. You never have to pick, I route automatically, but you can go direct.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500" role="status">Loading your bench...</p>
      ) : error ? (
        <p className="text-sm text-neutral-500">
          {error}{' '}
          <button type="button" onClick={() => { void refresh(); }} className="font-semibold text-brand-700 hover:underline cursor-pointer">
            Try again
          </button>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <div
              key={agent.key}
              className={`bg-white rounded-modal p-5 border border-line-soft shadow-card flex flex-col justify-between ${
                agent.available ? '' : 'opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-card bg-brand-strong text-white flex items-center justify-center shrink-0 text-sm font-bold" aria-hidden="true">
                    {agent.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-ink leading-tight">{agent.name}</h3>
                    <span className="text-[11px] font-semibold text-accent-600">{agent.category}</span>
                  </div>
                </div>
                <p className="text-xs text-ink-body leading-relaxed mb-6">{agent.description}</p>
              </div>
              {agent.available ? (
                <button
                  type="button"
                  onClick={() => router.push(`/ai?agent=${encodeURIComponent(agent.key)}`)}
                  className="w-full bg-white hover:bg-surface-muted text-brand-strong font-semibold text-xs py-2 rounded-card border border-line-strong transition-colors cursor-pointer"
                >
                  Ask {agent.name}
                </button>
              ) : (
                <p className="w-full text-center text-xs font-semibold text-ink-subtle py-2 rounded-card bg-surface-faint">
                  Coming soon
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
