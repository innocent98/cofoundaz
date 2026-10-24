"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, ChevronLeft } from "lucide-react";
import { useArticle } from "@/hooks/useLearning";
import { DraftBadge, ResourceView } from "@/components/academy/parts";
import { Markdown } from "@/components/academy/markdown";
import { formatDuration, levelLabel } from "@/lib/learning-format";

export default function ArticleReaderPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const res = useArticle(articleId);
  const [pct, setPct] = useState(0);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = body.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total));
      setPct(Math.round(done * 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    queueMicrotask(onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [res.data]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <Link href="/academy/articles" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-sage-600 hover:text-sage-900">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span>All articles</span>
      </Link>
      <ResourceView res={res} notFoundText="We could not find that article.">
        {(a) => (
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="sticky top-[7.5rem] z-30 h-1 overflow-hidden rounded-full bg-sage-200" role="progressbar" aria-label="Reading progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-green-700" style={{ width: `${pct}%` }} />
            </div>
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {a.tags.map((t) => (
                  <span key={t} className="rounded-[2px] bg-sage-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-600">{t}</span>
                ))}
                <DraftBadge status={a.review_status} />
              </div>
              <h1 className="text-3xl font-display font-semibold text-sage-900">{a.title}</h1>
              <p className="flex items-center gap-1.5 text-xs font-medium text-sage-600"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {a.read_min} min read</p>
            </header>
            <div ref={body} className="rounded-modal border border-sage-200 bg-white p-6 shadow-card md:p-8">
              <Markdown source={a.body} />
            </div>

            {(a.related.articles.length > 0 || a.related.courses.length > 0) && (
              <section aria-labelledby="related" className="space-y-4">
                <h2 id="related" className="text-sm font-semibold uppercase tracking-wider text-sage-900">Related</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {a.related.articles.map((r) => (
                    <Link key={r.id} href={`/academy/articles/${r.id}`} className="rounded-card border border-sage-200 bg-white p-4 shadow-card hover:border-copper-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sage-600">Article · {r.read_min} min</p>
                      <p className="mt-1 text-sm font-semibold text-sage-900">{r.title}</p>
                    </Link>
                  ))}
                  {a.related.courses.map((c) => (
                    <Link key={c.id} href={`/academy/courses/${c.id}`} className="rounded-card border border-sage-200 bg-white p-4 shadow-card hover:border-copper-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-copper-700">Course · {levelLabel(c.level)} · {formatDuration(c.duration_min)}</p>
                      <p className="mt-1 text-sm font-semibold text-sage-900">{c.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </ResourceView>
    </div>
  );
}
