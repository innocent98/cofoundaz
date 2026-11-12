import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDeckReview,
  listDeckReviews,
  readinessError,
  uploadAndReviewDeck,
  type DeckReview,
  type DeckReviewSummary,
  type ReadinessError,
} from '@/lib/api/readiness';
import { uploadProblem } from '@/lib/api/documents';

const POLL_MS = 2000;
const POLL_LIMIT_MS = 90_000;

export function deckUploadProblem(file: { name: string; size: number }): string | null {
  if (!/\.pdf$/i.test(file.name)) return 'A deck review needs a PDF. Export your deck as a PDF and try again.';
  return uploadProblem(file);
}

/** Message for a failed upload / start, using the API's own copy where it has one. */
export function deckStartMessage(err: ReadinessError): string {
  if (err.code === 'AI_BUDGET_EXHAUSTED') return 'Today’s AI allowance for this workspace is used up. Try again tomorrow.';
  if (err.code === 'FILE_NOT_CLEAN') return 'That file has not passed the security scan yet. Wait a minute and try again.';
  return err.message;
}

const inFlight = (d: { status: string }) => d.status === 'queued' || d.status === 'running';

export function useDeckReviews(preferredId: string | null) {
  const [reviews, setReviews] = useState<DeckReviewSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeckReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReadinessError | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [version, setVersion] = useState(0);
  const alive = useRef(true);
  const pollToken = useRef(0);

  useEffect(() => {
    alive.current = true;
    const token = pollToken;
    return () => {
      alive.current = false;
      // A counter that cancels running poll loops, not a DOM ref.
      token.current++;
    };
  }, []);

  const loadDetail = useCallback(async (id: string): Promise<DeckReview | null> => {
    try {
      const d = await getDeckReview(id);
      if (!alive.current) return null;
      setDetail(d);
      setError(null);
      return d;
    } catch (err) {
      if (alive.current) setError(readinessError(err, 'We could not load this review.'));
      return null;
    }
  }, []);

  const poll = useCallback(
    async (id: string) => {
      const token = ++pollToken.current;
      setSlow(false);
      const started = Date.now();
      for (;;) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (token !== pollToken.current || !alive.current) return;
        const d = await loadDetail(id);
        if (token !== pollToken.current || !alive.current) return;
        if (d && !inFlight(d)) {
          const list = await listDeckReviews().catch(() => null);
          if (list && alive.current) setReviews(list);
          return;
        }
        if (Date.now() - started > POLL_LIMIT_MS) {
          setSlow(true);
          return;
        }
      }
    },
    [loadDetail],
  );

  // Load the list, open the newest (or the one a link points to) and resume polling if it is running.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await listDeckReviews();
        if (!active) return;
        setReviews(list);
        setError(null);
        const pick = list.find((r) => r.id === preferredId) ?? list[0];
        if (pick) {
          setSelectedId(pick.id);
          const d = await loadDetail(pick.id);
          if (active && d && inFlight(d)) void poll(pick.id);
        }
      } catch (err) {
        if (active) setError(readinessError(err, 'We could not load your deck reviews.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [preferredId, version, loadDetail, poll]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  const select = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetail(null);
      setNotice(null);
      const d = await loadDetail(id);
      if (d && inFlight(d)) void poll(id);
    },
    [loadDetail, poll],
  );

  const upload = useCallback(
    async (file: File) => {
      setActionError(null);
      setNotice(null);
      const problem = deckUploadProblem(file);
      if (problem) {
        setActionError(problem);
        return;
      }
      setUploading(true);
      try {
        const res = await uploadAndReviewDeck(file);
        const list = await listDeckReviews();
        if (!alive.current) return;
        setReviews(list);
        setSelectedId(res.review.id);
        if (res.deduplicated) {
          setNotice('This exact deck was already reviewed, so nothing new was run. Change the deck, then upload the new version.');
          const d = await loadDetail(res.review.id);
          if (d && inFlight(d)) void poll(res.review.id);
        } else {
          setDetail(null);
          void poll(res.review.id);
        }
      } catch (err) {
        if (alive.current) setActionError(deckStartMessage(readinessError(err, 'We could not upload the deck. Try again.')));
      } finally {
        if (alive.current) setUploading(false);
      }
    },
    [loadDetail, poll],
  );

  /** Thumbnail links expire after ~15 minutes: refetch the review for fresh ones. */
  const refreshLinks = useCallback(async () => {
    if (selectedId) await loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  const resumePolling = useCallback(() => {
    if (selectedId) void poll(selectedId);
  }, [poll, selectedId]);

  return { reviews, selectedId, detail, loading, error, uploading, actionError, notice, slow, select, upload, reload, refreshLinks, resumePolling };
}
