"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Award, CheckCircle2, ChevronLeft, Clock } from "lucide-react";
import { useCourse } from "@/hooks/useLearning";
import { DraftBadge, ResourceView } from "@/components/academy/parts";
import { Markdown } from "@/components/academy/markdown";
import { NamePrompt } from "@/components/academy/name-prompt";
import { useWorkspace } from "@/components/workspace-context";
import { hasProfileName } from "@/lib/api/profile";
import { NoteEditor } from "@/components/academy/note-editor";
import { VideoPlayer } from "@/components/academy/video-player";
import { saveProgress, learningErrorMessage, type Certificate, type CourseDetail, type Lesson } from "@/lib/api/learning";
import { videoEmbedSrc } from "@/lib/learning-format";
import { useToast } from "../../../../ToastContext";

function LessonView({ course, lesson, reload }: { course: CourseDetail; lesson: Lesson; reload: () => void }) {
  const router = useRouter();
  const { triggerToast } = useToast();
  const { me, loading: meLoading, setMe } = useWorkspace();
  const [askName, setAskName] = useState(false);
  const [tab, setTab] = useState<"transcript" | "notes">("transcript");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earned, setEarned] = useState<Certificate | null>(null);
  const [justDone, setJustDone] = useState(false);

  const index = course.lessons.findIndex((l) => l.id === lesson.id);
  const next = course.lessons.slice(index + 1).find((l) => !l.completed) ?? course.lessons.slice(index + 1)[0] ?? null;
  const hasPlayer = videoEmbedSrc(lesson.video, 0) !== null;

  const onPosition = useCallback(
    (s: number) => {
      void saveProgress(lesson.id, { position_s: s }).catch(() => undefined);
    },
    [lesson.id],
  );

  // Finishing the course issues the certificate with the profile name, frozen for good.
  const finishesCourse = course.lessons.every((l) => l.id === lesson.id || l.completed);
  const nameMissing = !meLoading && me !== null && !hasProfileName(me);

  const onComplete = () => {
    if (finishesCourse && nameMissing) {
      setAskName(true);
      return;
    }
    void completeLesson();
  };

  const completeLesson = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await saveProgress(lesson.id, { completed: true });
      setJustDone(true);
      if (r.certificate) setEarned(r.certificate);
      else triggerToast("Lesson marked complete.");
      reload();
    } catch (err) {
      setError(learningErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const done = lesson.completed || justDone;
  const courseDone = earned !== null;

  return (
    <div className="grid grid-cols-1 items-start gap-6 max-lg:pb-24 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-semibold text-neutral-900">{lesson.order}. {lesson.title}</h1>
          <p className="flex items-center gap-2 text-xs text-neutral-600"><Clock className="h-3 w-3" aria-hidden="true" /> {lesson.duration_min} min <DraftBadge status={course.review_status} /></p>
        </div>

        {hasPlayer && lesson.video ? (
          <VideoPlayer video={lesson.video} title={lesson.title} startS={lesson.position_s} onPosition={onPosition} />
        ) : (
          <p className="rounded-card border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            There is no video for this lesson yet. Read the transcript below.
          </p>
        )}

        {askName && (
          <NamePrompt
            onCancel={() => setAskName(false)}
            onSaved={(next) => {
              setMe(next);
              setAskName(false);
              void completeLesson();
            }}
          />
        )}

        {earned && (
          <div role="status" className="flex flex-col gap-3 rounded-modal border border-brand-200 bg-brand-50 p-6">
            <p className="flex items-center gap-2 text-base font-semibold text-brand-900"><Award className="h-5 w-5" aria-hidden="true" /> Course complete</p>
            <p className="text-sm text-brand-900">You earned a certificate for {earned.course_title}.</p>
            <Link href="/academy/certificates" className="inline-flex min-h-11 w-fit items-center rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">View certificate</Link>
          </div>
        )}

        {justDone && !courseDone && next && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-modal border border-neutral-200 bg-white p-4 shadow-card">
            <p className="text-sm text-neutral-800">Up next: <span className="font-semibold">{next.title}</span></p>
            <span className="flex gap-2">
              <button type="button" onClick={() => router.push(`/academy/courses/${course.id}/lessons/${next.id}`)} className="min-h-11 rounded-card bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">Play</button>
              <button type="button" onClick={() => setJustDone(false)} className="min-h-11 rounded-card border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">Stay</button>
            </span>
          </div>
        )}

        <div className="overflow-hidden rounded-modal border border-neutral-200 bg-white shadow-card">
          <div role="tablist" className="flex border-b border-neutral-200">
            {(["transcript", "notes"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`panel-${t}`}
                onClick={() => setTab(t)}
                className={`min-h-11 flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? "border-b-2 border-brand-700 text-brand-700" : "text-neutral-600 hover:bg-neutral-50"}`}
              >
                {t === "transcript" ? "Transcript" : "Private notes"}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-h-64 p-6">
            {tab === "transcript" ? <Markdown source={lesson.transcript} /> : <NoteEditor key={lesson.id} lessonId={lesson.id} />}
          </div>
        </div>
      </div>

      <aside className="overflow-hidden rounded-modal border border-neutral-200 bg-white shadow-card lg:col-span-4">
        <div className="border-b border-neutral-200 p-6">
          <Link href={`/academy/courses/${course.id}`} className="text-lg font-semibold text-neutral-900 hover:text-accent-700">{course.title}</Link>
          <p className="mt-1 text-xs text-neutral-600">{course.lessons.length} lessons · {course.progress}% complete</p>
        </div>
        <details className="group" open>
          <summary className="flex min-h-11 cursor-pointer items-center px-6 text-sm font-semibold text-neutral-900 lg:hidden">Lessons</summary>
          <ol className="divide-y divide-neutral-100">
            {course.lessons.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/academy/courses/${course.id}/lessons/${l.id}`}
                  aria-current={l.id === lesson.id ? "page" : undefined}
                  className={`flex min-h-11 items-start gap-3 p-4 ${l.id === lesson.id ? "bg-neutral-50" : "hover:bg-neutral-50"}`}
                >
                  {l.completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Done" /> : <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-neutral-300" aria-label="Not done" />}
                  <span className={`text-sm font-medium ${l.id === lesson.id ? "text-brand-700" : "text-neutral-900"}`}>{l.order}. {l.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </details>
        <div className="border-t border-neutral-200 bg-neutral-50 p-4 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-16 max-lg:z-30 max-lg:shadow-raised">
          {error && <p role="alert" className="mb-2 text-sm text-danger-700">{error}</p>}
          <button
            type="button"
            onClick={onComplete}
            disabled={busy || done}
            className="min-h-11 w-full rounded-card bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-800 disabled:opacity-70"
          >
            {done ? "Completed ✓" : busy ? "Saving..." : "Mark complete"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const res = useCourse(courseId);
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <Link href={`/academy/courses/${courseId}`} className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to course</span>
      </Link>
      <ResourceView res={res} notFoundText="We could not find that lesson.">
        {(course) => {
          const lesson = course.lessons.find((l) => l.id === lessonId);
          if (!lesson) {
            return (
              <div role="alert" className="rounded-modal border border-neutral-200 bg-white p-8 text-center shadow-card">
                <p className="text-sm font-semibold text-neutral-900">We could not find that lesson.</p>
              </div>
            );
          }
          return <LessonView key={lesson.id} course={course} lesson={lesson} reload={res.reload} />;
        }}
      </ResourceView>
    </div>
  );
}
