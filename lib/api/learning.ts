import { ApiError, apiClient } from './client';

// Typed client for the Learning Academy backend (Module 17), /api/v1/learning/*
// plus the public GET /verify/{code}. Shapes are copied from the live-captured
// guide cofoundaz-api/docs/fe-integration-guide-academy.md. Every function
// unwraps the `{data, meta}` envelope and returns the payload.
//
// Access is founder / team_member only; other roles get 403 FORBIDDEN.

export type ReviewStatus = 'draft' | 'reviewed';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

/** The same summary shape is used on the shelf, continue watching and /courses. */
export interface CourseSummary {
  id: string;
  title: string;
  summary: string;
  level: CourseLevel;
  stage_tags: string[];
  lesson_count: number;
  duration_min: number;
  review_status: ReviewStatus;
  enrolled: boolean;
  /** Percent integer, 0 to 100. */
  progress: number;
  completed: boolean;
  last_lesson_id: string | null;
  /** Where Continue opens; null once every lesson is done. */
  next_lesson_id: string | null;
  /** Saved position of `next_lesson_id`, in seconds. */
  position_s: number;
}

export interface Hero {
  course_id: string;
  reason: string;
  reason_source: 'template' | 'ai';
  matched_gaps: string[];
}

export interface Recommendations {
  stage: string | null;
  recommendation_reason: string;
  hero: Hero | null;
  recommended: CourseSummary[];
  continue_watching: CourseSummary[];
}

export interface LessonVideo {
  provider: string;
  id: string;
  embed_url: string;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  duration_min: number;
  video: LessonVideo | null;
  /** Raw markdown written by us. Render only through the sanitising renderer. */
  transcript: string;
  completed: boolean;
  position_s: number;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  outcomes: string[];
  lessons: Lesson[];
}

export interface PathCourse {
  id: string;
  title: string;
  level: CourseLevel;
  duration_min: number;
  progress: number;
  completed: boolean;
  next_lesson_id: string | null;
}

export interface LearningPath {
  id: string;
  title: string;
  summary: string;
  stage: string;
  review_status: ReviewStatus;
  course_ids: string[];
  course_count: number;
  duration_min: number;
  progress: number;
  courses: PathCourse[];
}

export interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  read_min: number;
  review_status: ReviewStatus;
}

export interface RelatedCourse {
  id: string;
  title: string;
  summary: string;
  level: CourseLevel;
  duration_min: number;
}

export interface ArticleDetail extends ArticleSummary {
  /** Raw markdown. Render only through the sanitising renderer. */
  body: string;
  related: { articles: ArticleSummary[]; courses: RelatedCourse[] };
}

export interface Certificate {
  id: string;
  course_id: string;
  course_title: string;
  holder_name: string;
  /** Short public code `CFZ-XXXX-XXXX-XXXX`. Show this, never `id`. */
  credential_id: string;
  issuer: string;
  issued_at: string;
  verify_url: string;
  pdf_ready: boolean;
  pdf_url: string | null;
  linkedin_url: string;
}

export interface Enrollment {
  course_id: string;
  progress: number;
  completed_at: string | null;
}

export interface ProgressResult {
  lesson_id: string;
  course_id: string;
  progress: number;
  completed_at: string | null;
  position_s: number | null;
  /** Only the call that takes the course to 100% carries the new certificate. */
  certificate: Certificate | null;
}

export interface LessonNote {
  lesson_id: string;
  body: string;
  updated_at: string | null;
}

export interface Verification {
  valid: boolean;
  holder_name?: string;
  course_title?: string;
  issued_on?: string;
  issuer?: string;
}

interface Envelope<T> {
  data: T;
}

const unwrap = <T>(res: Envelope<T>): T => res.data;

export async function getRecommendations(): Promise<Recommendations> {
  return unwrap(await apiClient<Envelope<Recommendations>>('/learning/recommendations'));
}

export async function listCourses(): Promise<CourseSummary[]> {
  return unwrap(await apiClient<Envelope<{ courses: CourseSummary[] }>>('/learning/courses')).courses;
}

export async function getCourse(courseId: string): Promise<CourseDetail> {
  return unwrap(await apiClient<Envelope<CourseDetail>>(`/learning/courses/${encodeURIComponent(courseId)}`));
}

export async function listPaths(): Promise<LearningPath[]> {
  return unwrap(await apiClient<Envelope<{ paths: LearningPath[] }>>('/learning/paths')).paths;
}

export async function listArticles(params: { q?: string; tag?: string } = {}): Promise<ArticleSummary[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.tag) qs.set('tag', params.tag);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return unwrap(await apiClient<Envelope<{ articles: ArticleSummary[] }>>(`/learning/articles${suffix}`)).articles;
}

export async function getArticle(articleId: string): Promise<ArticleDetail> {
  return unwrap(await apiClient<Envelope<ArticleDetail>>(`/learning/articles/${encodeURIComponent(articleId)}`));
}

export async function enroll(courseId: string): Promise<Enrollment> {
  return unwrap(
    await apiClient<Envelope<Enrollment>>('/learning/enrollments', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId }),
    }),
  );
}

export async function saveProgress(
  lessonId: string,
  body: { completed?: true; position_s?: number },
): Promise<ProgressResult> {
  return unwrap(
    await apiClient<Envelope<ProgressResult>>(`/learning/lessons/${encodeURIComponent(lessonId)}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  );
}

export async function getNote(lessonId: string): Promise<LessonNote> {
  return unwrap(await apiClient<Envelope<LessonNote>>(`/learning/lessons/${encodeURIComponent(lessonId)}/notes`));
}

export async function saveNote(lessonId: string, body: string): Promise<LessonNote> {
  return unwrap(
    await apiClient<Envelope<LessonNote>>(`/learning/lessons/${encodeURIComponent(lessonId)}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ body }),
    }),
  );
}

export async function listCertificates(): Promise<Certificate[]> {
  return unwrap(await apiClient<Envelope<{ certificates: Certificate[] }>>('/learning/certificates')).certificates;
}

/** Public, no token needed (apiClient only sends one when it exists). */
export async function verifyCredential(code: string): Promise<Verification> {
  return unwrap(await apiClient<Envelope<Verification>>(`/verify/${encodeURIComponent(code)}`));
}

/**
 * Fetch the certificate PDF with the bearer token (a plain link cannot send it)
 * and hand the browser a blob download. Throws ApiError (409 CERTIFICATE_NOT_READY).
 */
export async function downloadCertificatePdf(cert: Certificate): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (workspaceId) headers['X-Workspace-Id'] = workspaceId;
  const path = cert.pdf_url ?? `/api/v1/learning/certificates/${encodeURIComponent(cert.id)}/pdf`;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
  const url = path.startsWith('/api/v1') ? `${apiBase}${path.slice('/api/v1'.length)}` : path;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, res.statusText, data);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `cofoundaz-certificate-${cert.credential_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

// ---------------------------------------------------------------- errors

interface ErrorBody {
  code?: string;
  message?: string;
  field_errors?: { field: string; message: string }[];
}

function errorBody(err: unknown): ErrorBody | null {
  if (!(err instanceof ApiError)) return null;
  const data = err.data as { error?: ErrorBody } | null;
  return data && typeof data === 'object' ? (data.error ?? null) : null;
}

export function isForbiddenError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403;
}

export function isNotFoundError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export function isRateLimitedError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429;
}

export function isNotReadyError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409 && errorBody(err)?.code === 'CERTIFICATE_NOT_READY';
}

export function learningErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'The Academy is not available for your role.';
    const body = errorBody(err);
    const first = body?.field_errors?.[0]?.message;
    if (err.status === 422 && first) return first;
    if (body?.message) return body.message;
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
