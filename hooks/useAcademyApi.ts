import { useState } from "react";

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
}

export function useAcademyApi() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "c-1",
      title: "B2B SaaS Pricing Strategy",
      level: "Intermediate",
      durationMinutes: 120,
      lessonCount: 8,
      progressPct: 45,
      stageTag: "Validation",
      instructor: "Patrick Campbell"
    },
    {
      id: "c-2",
      title: "Customer Discovery Interview Mastery",
      level: "Beginner",
      durationMinutes: 90,
      lessonCount: 6,
      progressPct: 0,
      stageTag: "Ideation",
      instructor: "Steve Blank"
    },
    {
      id: "c-3",
      title: "Financial Modeling for Pre-Seed",
      level: "Advanced",
      durationMinutes: 180,
      lessonCount: 12,
      progressPct: 100,
      stageTag: "Funding",
      instructor: "Taylor Davidson"
    }
  ]);

  const [lessons, setLessons] = useState<Lesson[]>([
    { id: "l-1", courseId: "c-1", order: 1, title: "Value Metric Selection", durationString: "15:20", transcript: "Welcome to module 1...", isCompleted: true },
    { id: "l-2", courseId: "c-1", order: 2, title: "Tier Structuring", durationString: "18:45", transcript: "Let's talk about tiers...", isCompleted: false },
    { id: "l-3", courseId: "c-1", order: 3, title: "Discounting Pitfalls", durationString: "12:10", transcript: "Never discount to close...", isCompleted: false },
  ]);

  const [certificates] = useState<Certificate[]>([
    {
      id: "cert-1",
      courseTitle: "Financial Modeling for Pre-Seed",
      issuedOn: "Aug 15, 2026",
      credentialCode: "COF-FIN-9921"
    }
  ]);

  const [articles] = useState<Article[]>([
    {
      id: "a-1",
      title: "How to survive your first board meeting",
      tags: ["Governance", "Funding"],
      readTime: "8 min read",
      excerpt: "The worst thing you can do is surprise your board. The second worst is boring them with operational trivia."
    },
    {
      id: "a-2",
      title: "Structuring your first sales comp plan",
      tags: ["Sales", "HR"],
      readTime: "12 min read",
      excerpt: "Aligning incentives is hard. Aligning them when you don't yet have product-market fit is a nightmare."
    }
  ]);

  const markLessonComplete = (lessonId: string) => {
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isCompleted: true } : l));
    // In a real app, this would recalculate course.progressPct as well.
  };

  return {
    courses,
    lessons,
    certificates,
    articles,
    markLessonComplete
  };
}
