"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Map, ArrowRight } from "lucide-react";

export default function LearningPathsPage() {
  const router = useRouter();

  const paths = [
    {
      id: "p-1",
      title: "From Idea to MVP",
      description: "A complete step-by-step track covering customer discovery, lean prototyping, and initial go-to-market strategies.",
      coursesCount: 4,
      totalDuration: "5.5 hours",
      progress: 25,
      stage: "Ideation"
    },
    {
      id: "p-2",
      title: "Seed Fundraise Prep",
      description: "Master financial modeling, pitch deck design, and term sheet negotiation to close your round.",
      coursesCount: 3,
      totalDuration: "4 hours",
      progress: 0,
      stage: "Funding"
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Learning Paths</h1>
        <p className="text-sm text-sage-500">Structured tracks designed to get you from point A to point B.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {paths.map((path) => (
          <div key={path.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 md:p-8 flex flex-col h-full space-y-6 hover:border-[#1e4836] transition-colors group">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-xl bg-sage-50 border border-sage-200 text-[#1e4836] flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#1e4836] group-hover:text-white transition-colors">
                <Map className="w-6 h-6" />
              </div>
              <span className="bg-[#f5efe6] text-[#8A5330] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {path.stage}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-xl text-sage-900">{path.title}</h3>
              <p className="text-sm text-sage-600 leading-relaxed">{path.description}</p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-sage-500 pt-2">
                <span>{path.coursesCount} courses</span>
                <span>•</span>
                <span>{path.totalDuration}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-sage-100 space-y-4">
              {path.progress > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-sage-500">
                    <span>Progress</span>
                    <span>{path.progress}%</span>
                  </div>
                  <div className="w-full bg-sage-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#1e4836] h-full rounded-full" style={{ width: `${path.progress}%` }}></div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => router.push("/academy/courses")}
                className="w-full bg-white hover:bg-sage-50 text-sage-800 border border-sage-300 font-semibold py-2.5 px-4 rounded-card text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{path.progress > 0 ? "Continue Path" : "Start Path"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
