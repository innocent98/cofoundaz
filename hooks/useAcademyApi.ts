import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export interface Course {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  lessonCount: number;
  progressPct: number;
  stageTag: string;
  thumbnailUrl?: string;
  instructor?: string;
  enrolled?: boolean;
  completed?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  durationString: string;
  videoUrl?: string;
  transcript: string;
  isCompleted: boolean;
}

export interface Certificate {
  id: string;
  courseTitle: string;
  issuedOn: string;
  credentialCode: string;
}

export interface Article {
  id: string;
  title: string;
  tags: string[];
  readTime: string;
  excerpt: string;
  body: string;
}

export interface LearningPath {
  id: string;
  title: string;
  stage: string;
  courseCount: number;
  durationMinutes: number;
  progressPct: number;
}

// --- API shapes ---
interface RawCourse {
  id: string; title: string; level: string; stage_tags: string[];
  lesson_count: number; duration_min: number; enrolled: boolean; progress: number; completed: boolean;
}
interface RawLesson {
  id: string; title: string; order: number; video_ref: string; duration_min: number; transcript: string; completed: boolean;
}
interface RawCert { id: string; course_id: string; credential_code: string; issued_at: string; }
interface RawArticle { id: string; title: string; tags: string[]; body: string; }
interface RawPath { id: string; title: string; stage: string; course_ids: string[]; course_count: number; duration_min: number; progress: number; }

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function levelLabel(l: string): Course['level'] {
  const c = cap((l || '').toLowerCase());
  return c === 'Intermediate' || c === 'Advanced' ? c : 'Beginner';
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function readTime(body: string): string {
  const words = (body || '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function mapCourse(c: RawCourse): Course {
  return {
    id: c.id,
    title: c.title,
    level: levelLabel(c.level),
    durationMinutes: c.duration_min,
    lessonCount: c.lesson_count,
    progressPct: c.progress ?? 0,
    stageTag: cap((c.stage_tags?.[0] || '').toLowerCase()),
    enrolled: c.enrolled,
    completed: c.completed,
  };
}
function mapLesson(l: RawLesson, courseId: string): Lesson {
  return {
    id: l.id,
    courseId,
    order: l.order,
    title: l.title,
    durationString: `${l.duration_min} min`,
    videoUrl: l.video_ref,
    transcript: l.transcript,
    isCompleted: l.completed,
  };
}

export function useAcademyApi() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesRes, articlesRes, pathsRes, certsRes] = await Promise.all([
        apiClient<{ data?: { courses?: RawCourse[] } }>('/learning/courses'),
        apiClient<{ data?: { articles?: RawArticle[] } }>('/learning/articles').catch(() => ({ data: { articles: [] } })),
        apiClient<{ data?: { paths?: RawPath[] } }>('/learning/paths').catch(() => ({ data: { paths: [] } })),
        apiClient<{ data?: { certificates?: RawCert[] } }>('/learning/certificates').catch(() => ({ data: { certificates: [] } })),
      ]);
      const rawCourses = coursesRes?.data?.courses ?? [];
      const mappedCourses = rawCourses.map(mapCourse);
      setCourses(mappedCourses);

      const titleById = new Map(mappedCourses.map((c) => [c.id, c.title]));

      // Flatten lessons from each course's detail (small catalog).
      const details = await Promise.all(
        rawCourses.map((c) =>
          apiClient<{ data?: { lessons?: RawLesson[] } }>(`/learning/courses/${c.id}`)
            .then((d) => (d?.data?.lessons ?? []).map((l) => mapLesson(l, c.id)))
            .catch(() => [] as Lesson[])
        )
      );
      setLessons(details.flat());

      setArticles(
        (articlesRes?.data?.articles ?? []).map((a) => ({
          id: a.id, title: a.title, tags: a.tags ?? [], readTime: readTime(a.body), excerpt: (a.body || '').slice(0, 140), body: a.body,
        }))
      );
      setPaths(
        (pathsRes?.data?.paths ?? []).map((p) => ({
          id: p.id, title: p.title, stage: cap((p.stage || '').toLowerCase()), courseCount: p.course_count, durationMinutes: p.duration_min, progressPct: p.progress ?? 0,
        }))
      );
      setCertificates(
        (certsRes?.data?.certificates ?? []).map((c) => ({
          id: c.id, courseTitle: titleById.get(c.course_id) || 'Course', issuedOn: fmtDate(c.issued_at), credentialCode: c.credential_code,
        }))
      );
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Academy unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  const enroll = useCallback(
    async (courseId: string) => {
      try {
        await apiClient('/learning/enrollments', { method: 'POST', body: JSON.stringify({ course_id: courseId }) });
        await refetch();
        return true;
      } catch {
        return false;
      }
    },
    [refetch]
  );

  // PATCH /learning/lessons/{id}/progress {completed:true} — completing the last
  // lesson issues a certificate, so refetch to pick up progress + any new cert.
  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      setLessons((prev) => prev.map((l) => (l.id === lessonId ? { ...l, isCompleted: true } : l))); // optimistic
      try {
        await apiClient(`/learning/lessons/${lessonId}/progress`, { method: 'PATCH', body: JSON.stringify({ completed: true }) });
      } finally {
        await refetch();
      }
    },
    [refetch]
  );

  return { courses, lessons, certificates, articles, paths, loading, error, refetch, enroll, markLessonComplete };
}
