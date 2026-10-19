'use client';

import React from 'react';
import { Check, History, Loader2 } from 'lucide-react';
import type { EditorRef } from '@/lib/api/business-builder';
import { lastEditedLabel } from '@/lib/relative-time';
import type { SaveStatus } from '@/hooks/useCanvasEditor';

interface ArtifactHeaderProps {
  title: string;
  /** Canvas editors autosave; record pages have no save status. */
  saveStatus?: SaveStatus;
  updatedAt?: string | null;
  updatedBy?: EditorRef | null;
  /** Canvas editors only: opens the version history panel. */
  onOpenHistory?: () => void;
  /** AI / Export / Add buttons. */
  actions?: React.ReactNode;
}

/**
 * The shared editor header (PRD Module 08): title, autosave state, "Last edited
 * by {name}, {relative}", a version link, and the action buttons.
 */
export function ArtifactHeader({ title, saveStatus, updatedAt, updatedBy, onOpenHistory, actions }: ArtifactHeaderProps) {
  const edited = lastEditedLabel(updatedAt, updatedBy);
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">{title}</h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#556358] mt-1.5" aria-live="polite">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[#8A5330] font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[#183B28] font-medium"><Check className="w-3 h-3" /> Saved</span>
          )}
          {saveStatus === 'error' && <span className="text-[#B0483B] font-medium">Not saved. Retrying on your next edit.</span>}
          {saveStatus && edited && <span aria-hidden="true">·</span>}
          {edited && <span>{edited}</span>}
          {onOpenHistory && (
            <>
              {(saveStatus || edited) && <span aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1 font-semibold text-[#183B28] hover:underline"
              >
                <History className="w-3 h-3" /> Version history
              </button>
            </>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 self-start">{actions}</div>}
    </div>
  );
}
