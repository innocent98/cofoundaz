"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { useArticles } from "@/hooks/useLearning";
import { DraftBadge, ResourceView } from "@/components/academy/parts";

export default function ArticlesPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const res = useArticles(q, tag);
  // Tags come from the unfiltered list so the chips stay put while filtering.
  const all = useArticles("", "");
  const tags = Array.from(new Set((all.data ?? []).flatMap((a) => a.tags))).sort();

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-semibold transition-colors ${
      active ? "border-green-700 bg-green-700 text-white" : "border-sage-200 bg-white text-sage-700 hover:bg-sage-50"
    }`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold text-sage-900">Articles &amp; Playbooks</h1>
          <p className="text-sm text-sage-600">Quick reads for high-leverage tactical advice.</p>
        </div>
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}
          className="relative w-full md:w-72"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-500" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search articles"
            value={input}
            maxLength={100}
            onChange={(e) => { setInput(e.target.value); if (!e.target.value) setQ(""); }}
            placeholder="Search articles"
            className="min-h-11 w-full rounded-full border border-sage-200 bg-white pl-9 pr-4 text-sm text-sage-900 shadow-card focus:border-green-700 focus:outline-none"
          />
        </form>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
          <button type="button" aria-pressed={!tag} onClick={() => setTag("")} className={chip(!tag)}>All</button>
          {tags.map((t) => (
            <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)} className={chip(tag === t)}>{t}</button>
          ))}
        </div>
      )}

      <ResourceView res={res}>
        {(articles) =>
          articles.length === 0 ? (
            <p className="py-12 text-center text-sm text-sage-600">No articles match.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
              {articles.map((a) => (
                <Link key={a.id} href={`/academy/articles/${a.id}`} className="group flex h-full flex-col space-y-4 rounded-modal border border-sage-200 bg-white p-6 shadow-card transition-colors hover:border-copper-200">
                  <div className="flex flex-wrap items-center gap-2">
                    {a.tags.map((t) => (
                      <span key={t} className="rounded-[2px] bg-sage-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-600">{t}</span>
                    ))}
                    <DraftBadge status={a.review_status} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="line-clamp-2 text-xl font-display font-semibold text-sage-900 group-hover:text-copper-700">{a.title}</h2>
                    <p className="line-clamp-3 text-sm leading-relaxed text-sage-600">{a.summary}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-sage-100 pt-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-sage-600"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {a.read_min} min read</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-copper-700"><span>Read article</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </ResourceView>
    </div>
  );
}
