"use client";

import React, { useState } from "react";
import { inputCls } from "./ui";

const ADD_NEW = "__add_new__";

/**
 * The one category picker for transactions, expenses and budgets. It lists what
 * `GET /finance/categories` returns, with an "Add category" option that reveals a
 * text box. The API normalises spelling on write ("hosting" becomes "Hosting"), so
 * callers must render the saved value from the response, not what was typed.
 */
export function CategorySelect({
  id,
  value,
  onChange,
  options,
  emptyLabel,
  ariaLabel,
  compact = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  /** Category names from `useCategories`. */
  options: string[];
  /** When set, adds a leading empty option with this label (categories are optional on the ledger). */
  emptyLabel?: string;
  ariaLabel?: string;
  compact?: boolean;
}) {
  const known = value && !options.some((o) => o.toLowerCase() === value.toLowerCase());
  const [adding, setAdding] = useState(false);
  const cls = compact
    ? "text-xs bg-white border border-accent-600 text-accent-700 rounded-input px-2 py-1 max-w-[9rem] outline-none font-medium"
    : inputCls;

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          aria-label={ariaLabel ?? "New category name"}
          className={cls}
          value={value}
          maxLength={120}
          autoComplete="off"
          placeholder="New category"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="text-xs font-bold text-neutral-600 hover:underline shrink-0"
          onClick={() => {
            setAdding(false);
            onChange("");
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      className={cls}
      value={value}
      onChange={(e) => {
        if (e.target.value === ADD_NEW) {
          setAdding(true);
          onChange("");
        } else onChange(e.target.value);
      }}
    >
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {emptyLabel === undefined && !value && (
        <option value="" disabled>
          Choose a category
        </option>
      )}
      {known && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value={ADD_NEW}>Add category...</option>
    </select>
  );
}
