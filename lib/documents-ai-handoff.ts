// The template page creates the document and the editor shows the AI draft's progress.
// A short-lived sessionStorage note carries the job between the two routes (a reload still works:
// the editor also shows the finished state from the job itself).
import type { AiRequest } from '@/lib/api/documents';

const key = (docId: string) => `cf_doc_ai_${docId}`;

export function stashAiHandoff(docId: string, ai: AiRequest): void {
  try {
    if (ai.status === 'not_requested' || ai.status === 'nothing_to_draft') return;
    sessionStorage.setItem(key(docId), JSON.stringify(ai));
  } catch {
    /* storage can be blocked; the document is still created */
  }
}

export function readAiHandoff(docId: string): AiRequest | null {
  try {
    const raw = sessionStorage.getItem(key(docId));
    return raw ? (JSON.parse(raw) as AiRequest) : null;
  } catch {
    return null;
  }
}

export function clearAiHandoff(docId: string): void {
  try {
    sessionStorage.removeItem(key(docId));
  } catch {
    /* ignore */
  }
}
