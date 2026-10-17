"use client";

import React, { useId } from "react";
import { inputCls } from "./ui";

/**
 * One category picker shared by the Expenses and Budgets forms. A budget's
 * "spent" matches the expense category string exactly (case and whitespace), so
 * both forms suggest the same list and the value is trimmed on the way out.
 */
export function CategoryInput({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const listId = useId();
  return (
    <>
      <input id={id} list={listId} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} maxLength={120} autoComplete="off" />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}
