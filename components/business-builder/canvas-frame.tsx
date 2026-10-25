'use client';

import React, { useCallback, useState } from 'react';
import type { CanvasType } from '@/lib/api/business-builder';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { useCanvasCommentCounts } from '@/hooks/useCommentCounts';
import { ArtifactHeader } from '@/components/business-builder/artifact-header';
import { ExportButton } from '@/components/business-builder/export-button';
import { VersionHistoryPanel } from '@/components/business-builder/version-history-panel';
import { CommentDrawer } from '@/components/business-builder/comment-drawer';
import { CommentButton } from '@/components/business-builder/comment-button';
import { SectionAiButton } from '@/components/business-builder/section-ai-button';
import { SuggestBar } from '@/components/business-builder/suggest-bar';

type Editor = ReturnType<typeof useCanvasEditor>;

export interface BlockToolOptions {
  /** Show the per-section AI button (list blocks, or an empty text block). */
  ai?: boolean;
}

interface Props {
  type: CanvasType;
  title: string;
  editor: Editor;
  /** Extra header actions (e.g. the whole-canvas AI fill), rendered before Export. */
  actions?: React.ReactNode;
  children: (tools: (key: string, label: string, opts?: BlockToolOptions) => React.ReactNode) => React.ReactNode;
}

/**
 * Everything every canvas editor shares: header (autosave, last edited, version
 * link, Export), the version history panel, the consultant's send-suggestion
 * bar, and the per-block comment drawer. Pages only render their blocks.
 */
export function CanvasFrame({ type, title, editor, actions, children }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [thread, setThread] = useState<{ key: string; label: string } | null>(null);
  const { counts, refresh } = useCanvasCommentCounts(editor.canvasId);
  const { canEdit } = editor.access;

  const tools = useCallback(
    (key: string, label: string, opts: BlockToolOptions = {}) => (
      <span className="flex items-center gap-3">
        {opts.ai && (
          <SectionAiButton
            type={type}
            block={key}
            label={label}
            flush={editor.flush}
            reload={editor.reload}
            highlight={editor.highlight}
          />
        )}
        <CommentButton
          label={label}
          open={counts[key]?.open ?? 0}
          total={counts[key]?.total ?? 0}
          onClick={() => setThread({ key, label })}
        />
      </span>
    ),
    [type, editor.flush, editor.reload, editor.highlight, counts]
  );

  return (
    <div className="flex flex-col gap-6">
      <ArtifactHeader
        title={title}
        saveStatus={canEdit ? editor.saveStatus : undefined}
        updatedAt={editor.updatedAt}
        updatedBy={editor.updatedBy}
        onOpenHistory={() => setHistoryOpen(true)}
        actions={
          <>
            {actions}
            <ExportButton target={{ canvas: type }} />
          </>
        }
      />

      {editor.loadError && !editor.loading && (
        <p role="alert" className="text-sm text-danger-text bg-danger-wash border border-danger-xf0d5d5 rounded-modal p-4">{editor.loadError}</p>
      )}

      {children(tools)}

      <SuggestBar dirty={editor.dirty} onSend={editor.sendSuggestion} onDiscard={editor.discardChanges} />

      <VersionHistoryPanel
        open={historyOpen}
        type={type}
        blockDefs={editor.blockDefs}
        canRestore={canEdit}
        flush={editor.flush}
        getVersion={editor.getVersion}
        onRestored={editor.applyCanvas}
        onStale={editor.reload}
        onClose={() => setHistoryOpen(false)}
      />

      <CommentDrawer
        open={thread !== null}
        title={thread?.label ?? ''}
        entityType="business_canvas"
        entityId={editor.canvasId}
        anchor={thread?.key}
        onClose={() => setThread(null)}
        onChanged={refresh}
      />
    </div>
  );
}
