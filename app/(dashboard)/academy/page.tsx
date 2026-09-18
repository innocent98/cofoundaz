"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAcademyApi } from "@/hooks/useAcademyApi";
import { Sparkles, PlayCircle, Clock, BookOpen } from "lucide-react";

export default function AcademyRecommendedPage() {
  const router = useRouter();
  const { courses } = useAcademyApi();

  const heroCourse = courses[0];
  const activeCourses = courses.filter(c => c.progressPct > 0 && c.progressPct < 100);
  const stageShelf = courses.filter(c => c.stageTag === "Validation");

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Learning Academy</h1>
        <p className="text-sm text-sage-500">Curated operational playbooks for your exact stage.</p>
      </div>

      {/* Hero Recommendation */}
      {heroCourse && (
        <div className="bg-[#1e3b30] rounded-modal border border-[#2a4d40] shadow-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2a4d40] opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="w-full md:w-1/3 aspect-video bg-[#152a22] rounded-card border border-[#2a4d40] flex items-center justify-center relative overflow-hidden shrink-0 group cursor-pointer" onClick={() => router.push("/academy/courses")}>
            <PlayCircle className="w-12 h-12 text-[#9C5B34] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          <div className="flex-1 space-y-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <Sparkles className="w-4 h-4 text-[#EAD5C6] mt-0.5 shrink-0" />
              <p className="text-sm text-[#d4e2d9] font-medium leading-relaxed italic">
                Because your assessment flagged pricing as a gap and you&apos;re entering Validation.
              </p>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-bold text-white">{heroCourse.title}</h2>
              <p className="text-sm text-[#a2c2b0] flex items-center gap-3 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {heroCourse.durationMinutes} min</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {heroCourse.lessonCount} lessons</span>
                <span>{heroCourse.instructor}</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => router.push("/academy/courses")}
                className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-2.5 px-6 rounded-card text-sm transition-colors shadow-card flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Start course</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching */}
      {activeCourses.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-sage-900 uppercase tracking-wider">Continue watching</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCourses.map(course => (
              <div key={course.id} className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden hover:border-[#9C5B34] transition-colors cursor-pointer group" onClick={() => router.push("/academy/courses")}>
                <div className="aspect-video bg-sage-100 flex items-center justify-center relative">
                  <PlayCircle className="w-10 h-10 text-sage-400 group-hover:text-[#8A5330] group-hover:scale-110 transition-all" />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {course.progressPct}% complete
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-sage-900 group-hover:text-[#8A5330] transition-colors line-clamp-1">{course.title}</h4>
                  <div className="w-full bg-sage-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#1e4836] h-full rounded-full" style={{ width: `${course.progressPct}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Shelf */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-sage-900 uppercase tracking-wider">For the Validation stage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stageShelf.map(course => (
            <div key={course.id} className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden hover:border-[#9C5B34] transition-colors cursor-pointer group" onClick={() => router.push("/academy/courses")}>
              <div className="aspect-video bg-sage-100 flex items-center justify-center">
                <PlayCircle className="w-10 h-10 text-sage-400 group-hover:text-[#8A5330] group-hover:scale-110 transition-all" />
              </div>
              <div className="p-4 space-y-2">
                <h4 className="font-semibold text-sm text-sage-900 group-hover:text-[#8A5330] transition-colors line-clamp-1">{course.title}</h4>
                <p className="text-xs text-sage-500">{course.durationMinutes} min · {course.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
