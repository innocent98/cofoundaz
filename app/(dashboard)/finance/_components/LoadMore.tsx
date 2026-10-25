"use client";

import React from "react";
import type { PagedList } from "@/hooks/useFinancePaged";
import { secondaryBtn } from "./ui";

/** "Showing N of M" plus a Load more button for any cursor-paginated list. */
export function LoadMore<T>({ list, noun }: { list: PagedList<T>; noun: string }) {
  if (list.items.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-2 border-t border-neutral-100 p-4">
      <p className="text-xs text-neutral-500" aria-live="polite">
        Showing {list.items.length}
        {list.total !== null ? ` of ${list.total}` : ""} {noun}
      </p>
      {list.moreError && (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {list.moreError}
        </p>
      )}
      {list.hasMore && (
        <button type="button" className={secondaryBtn} disabled={list.loadingMore} onClick={() => void list.loadMore()}>
          {list.loadingMore ? "Loading" : `Load more ${noun}`}
        </button>
      )}
    </div>
  );
}
