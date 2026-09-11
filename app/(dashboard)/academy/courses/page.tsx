"use client";

import React, { useState } from "react";
import { useAcademyApi, Course, Lesson } from "@/hooks/useAcademyApi";
import { useToast } from "../ToastContext";
import { PlayCircle, Clock, CheckCircle2, ChevronLeft, Search } from "lucide-react";

export default function CoursesCatalogPage() {
  const { courses, lessons, markLessonComplete } = useAcademyApi();
  const { triggerToast } = useToast();

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [playerTab, setPlayerTab] = useState<'transcript' | 'notes'>('transcript');
  const [notes, setNotes] = useState("");

  const handleCourseClick = (course: Course) => {
    setActiveCourse(course);
    const firstLesson = lessons.find(l => l.courseId === course.id);
    if (firstLesson) setActiveLesson(firstLesson);
  };

  const handleLessonComplete = () => {
    if (activeLesson) {
      markLessonComplete(activeLesson.id);
      triggerToast("Lesson marked complete.");
      // Ideally auto-play next
    }
  };

  if (activeCourse && activeLesson) {
    const courseLessons = lessons.filter(l => l.courseId === activeCourse.id);

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <button 
          onClick={() => setActiveCourse(null)}
          className="flex items-center gap-1.5 text-sage-600 hover:text-sage-900 transition-colors text-sm font-medium w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Player & Tabs */}
          <div className="lg:col-span-8 space-y-6">
            <div className="aspect-video bg-black rounded-modal overflow-hidden flex items-center justify-center relative">
              <PlayCircle className="w-16 h-16 text-white/50 hover:text-white transition-colors cursor-pointer" />
              <div className="absolute bottom-4 left-4 text-white font-semibold">
                {activeLesson.order}. {activeLesson.title}
              </div>
            </div>

            <div className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden">
              <div className="flex border-b border-sage-200">
                <button
                  onClick={() => setPlayerTab('transcript')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${playerTab === 'transcript' ? 'border-b-2 border-[#1e4836] text-[#1e4836]' : 'text-sage-600 hover:bg-sage-50'}`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setPlayerTab('notes')}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${playerTab === 'notes' ? 'border-b-2 border-[#1e4836] text-[#1e4836]' : 'text-sage-600 hover:bg-sage-50'}`}
                >
                  Private Notes
                </button>
              </div>

              <div className="p-6 h-64 overflow-y-auto">
                {playerTab === 'transcript' && (
                  <p className="text-sm text-sage-700 leading-relaxed">{activeLesson.transcript}</p>
                )}
                {playerTab === 'notes' && (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Jot down key takeaways for this lesson..."
                    className="w-full h-full bg-sage-50 border border-sage-200 rounded-card p-4 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] resize-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Curriculum Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
            <div className="p-6 border-b border-sage-200">
              <h3 className="font-semibold text-lg text-sage-900">{activeCourse.title}</h3>
              <p className="text-xs text-sage-500 mt-1">{courseLessons.length} lessons</p>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-sage-100">
              {courseLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                    activeLesson.id === lesson.id ? "bg-sage-50/80" : "hover:bg-sage-50"
                  }`}
                >
                  {lesson.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#1e4836] shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-sage-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`text-sm font-medium ${activeLesson.id === lesson.id ? "text-[#1e4836]" : "text-sage-900"}`}>
                      {lesson.order}. {lesson.title}
                    </h4>
                    <p className="text-xs text-sage-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {lesson.durationString}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-sage-200 bg-sage-50">
              <button
                onClick={handleLessonComplete}
                className="w-full bg-[#1e4836] hover:bg-[#153427] text-white font-semibold py-3 px-4 rounded-card text-sm transition-colors shadow-card"
              >
                Mark complete & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Catalog View
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold text-sage-900">Course catalog</h1>
          <p className="text-sm text-sage-500">Explore all available operational playbooks.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-sage-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses..."
            className="pl-9 pr-4 py-2 bg-white border border-sage-200 rounded-full text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] shadow-card w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {courses.map((course) => (
          <div 
            key={course.id} 
            className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden hover:border-[#9C5B34] transition-colors cursor-pointer group flex flex-col h-full"
            onClick={() => handleCourseClick(course)}
          >
            <div className="aspect-video bg-sage-100 flex items-center justify-center relative">
              <PlayCircle className="w-12 h-12 text-sage-400 group-hover:text-[#8A5330] group-hover:scale-110 transition-all" />
              {course.progressPct > 0 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-sage-200">
                  <div className="h-full bg-[#1e4836]" style={{ width: `${course.progressPct}%` }}></div>
                </div>
              )}
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage-500 bg-sage-50 px-2 py-0.5 rounded-[2px]">
                  {course.level}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5330] bg-[#f5efe6] px-2 py-0.5 rounded-[2px]">
                  {course.stageTag}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg text-sage-900 group-hover:text-[#8A5330] transition-colors line-clamp-2 flex-1">
                {course.title}
              </h3>
              
              <div className="flex items-center justify-between text-xs font-medium text-sage-500 pt-4 border-t border-sage-100 mt-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.durationMinutes}m</span>
                  <span>{course.lessonCount} lessons</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
