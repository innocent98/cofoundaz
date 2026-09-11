"use client";

import React from "react";
import { useAcademyApi } from "@/hooks/useAcademyApi";
import { BookOpen, ArrowRight } from "lucide-react";

export default function ArticlesPage() {
  const { articles } = useAcademyApi();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Articles & Playbooks</h1>
        <p className="text-sm text-sage-500">Quick reads for high-leverage tactical advice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {articles.map((article) => (
          <div key={article.id} className="bg-white rounded-modal border border-sage-200 shadow-card p-6 flex flex-col h-full space-y-4 hover:border-[#EAD5C6] transition-colors group cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              {article.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-sage-500 bg-sage-50 px-2 py-0.5 rounded-sm">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="font-display font-semibold text-xl text-sage-900 group-hover:text-[#8A5330] transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-sage-600 line-clamp-3 leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-sage-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-sage-500">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{article.readTime}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-[#8A5330] group-hover:translate-x-1 transition-transform">
                <span>Read article</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
