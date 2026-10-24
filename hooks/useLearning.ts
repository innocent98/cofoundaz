'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/lib/api/learning';
import { isForbiddenError, isNotFoundError, learningErrorMessage } from '@/lib/api/learning';

// Academy data hooks. One request per page, and every read exposes the same
// honest states (loading / ready / error / forbidden / notfound) so a failed call
// is never shown as an empty list.

export type LoadStatus = 'loading' | 'ready' | 'error' | 'forbidden' | 'notfound';

export interface Resource<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
  reload: () => void;
}

interface State<T> {
  data: T | null;
  status: LoadStatus;
  error: string | null;
}

/** Load `fetcher()` on mount and when its (memoised) identity changes. `reload()` keeps stale data visible. */
export function useResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const [state, setState] = useState<State<T>>({ data: null, status: 'loading', error: null });
  const reqId = useRef(0);

  const run = useCallback(
    async (showLoading: boolean) => {
      const id = ++reqId.current;
      if (showLoading) setState((s) => ({ ...s, status: 'loading', error: null }));
      try {
        const data = await fetcher();
        if (id === reqId.current) setState({ data, status: 'ready', error: null });
      } catch (err) {
        if (id !== reqId.current) return;
        setState((s) => ({
          data: s.data,
          status: isForbiddenError(err) ? 'forbidden' : isNotFoundError(err) ? 'notfound' : 'error',
          error: learningErrorMessage(err, 'Could not load this data.'),
        }));
      }
    },
    [fetcher],
  );

  const invalidate = useCallback(() => {
    reqId.current++;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void run(true);
    });
    return invalidate;
  }, [run, invalidate]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const reload = useCallback(() => {
    void run(stateRef.current.data === null);
  }, [run]);

  return { data: state.data, status: state.status, error: state.error, reload };
}

/**
 * Learn next. While the hero reason is still the template sentence, re-read it
 * once after ~5 s and once after ~15 s (guide section 9) so the AI sentence shows up.
 */
export function useRecommendations() {
  const res = useResource<api.Recommendations>(api.getRecommendations);
  const { reload } = res;
  const templated = res.data?.hero?.reason_source === 'template';
  useEffect(() => {
    if (!templated) return;
    const t1 = setTimeout(reload, 5000);
    const t2 = setTimeout(reload, 15000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // Only the first two refreshes: re-arming on every reload would poll forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templated]);
  return res;
}

export function useCourses() {
  return useResource<api.CourseSummary[]>(api.listCourses);
}

export function useCourse(courseId: string) {
  const fetcher = useCallback(() => api.getCourse(courseId), [courseId]);
  return useResource<api.CourseDetail>(fetcher);
}

export function usePaths() {
  return useResource<api.LearningPath[]>(api.listPaths);
}

export function useArticles(q: string, tag: string) {
  const fetcher = useCallback(() => api.listArticles({ q: q || undefined, tag: tag || undefined }), [q, tag]);
  return useResource<api.ArticleSummary[]>(fetcher);
}

export function useArticle(articleId: string) {
  const fetcher = useCallback(() => api.getArticle(articleId), [articleId]);
  return useResource<api.ArticleDetail>(fetcher);
}

/**
 * Certificates. While any PDF is not ready, poll every 3 s for up to 30 s, and
 * never while the tab is hidden (guide section 6). `stalled` is true once the
 * budget is spent and a PDF is still pending.
 */
export function useCertificates() {
  const res = useResource<api.Certificate[]>(api.listCertificates);
  const { reload } = res;
  const pending = (res.data ?? []).some((c) => !c.pdf_ready);
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (!pending) return;
    let ticks = 0;
    const timer = setInterval(() => {
      if (document.hidden) return;
      ticks += 1;
      if (ticks > 10) {
        clearInterval(timer);
        setStalled(true);
        return;
      }
      reload();
    }, 3000);
    return () => clearInterval(timer);
  }, [pending, reload]);
  return { ...res, pending, stalled: pending && stalled };
}
