"use client";

import React, { useRef, useState } from "react";
import { ModalDialog } from "@/components/modal-dialog";
import {
  createComplianceItem,
  proofFileProblem,
  toLegalError,
  updateComplianceItem,
  uploadComplianceProof,
  type ComplianceItem,
  type Recurrence,
} from "@/lib/api/legal";
import { RECURRENCE_LABEL, formatDate } from "@/lib/legal-format";
import { Drawer, Field, FormError, darkBtn, inputCls, secondaryBtn } from "./ui";

const RECURRENCES: Recurrence[] = ["none", "monthly", "quarterly", "annually"];

/** Create or edit a filing. Status is never edited here: marking done has its own flow. */
export function FilingDrawer({
  item,
  onClose,
  onSaved,
}: {
  item: ComplianceItem | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const isEdit = item !== null;
  const [title, setTitle] = useState(item?.title ?? "");
  const [authority, setAuthority] = useState(item?.authority ?? "");
  const [dueOn, setDueOn] = useState(item?.due_on ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>(item?.recurrence ?? "none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Enter what is being filed.";
    if (!dueOn) errs.due_on = "Pick a due date.";
    if (Object.keys(errs).length) return setFieldErrors(errs);
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const input = { title: title.trim(), authority: authority.trim() || null, due_on: dueOn, recurrence };
    try {
      if (item) await updateComplianceItem(item.id, input);
      else await createComplianceItem(input);
      await onSaved(item ? "Filing updated." : "Filing added.");
    } catch (err) {
      const le = toLegalError(err, "Couldn't save this filing. Try again.");
      setFieldErrors(le.fieldErrors);
      setError(le.notFound ? "That filing no longer exists." : le.message);
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={isEdit ? "Edit filing" : "Add filing"}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className={`${secondaryBtn} flex-1`} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="filing-form" className={`${darkBtn} flex-1`} disabled={busy}>
            {busy ? "Saving" : isEdit ? "Save changes" : "Save filing"}
          </button>
        </div>
      }
    >
      <form id="filing-form" onSubmit={(e) => void submit(e)} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Filing" htmlFor="filing-title" error={fieldErrors.title}>
          <input id="filing-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VAT return" className={inputCls} />
        </Field>
        <Field label="Authority (optional)" htmlFor="filing-authority" error={fieldErrors.authority}>
          <input id="filing-authority" value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. FIRS" className={inputCls} />
        </Field>
        <Field
          label="Due date"
          htmlFor="filing-due"
          error={fieldErrors.due_on}
          hint="A date that has already passed is fine: the filing shows as overdue straight away."
        >
          <input id="filing-due" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={inputCls} />
        </Field>
        <Field
          label="Repeats"
          htmlFor="filing-recurrence"
          error={fieldErrors.recurrence}
          hint="When you mark a repeating filing done, the next one is created for you."
        >
          <select id="filing-recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)} className={inputCls}>
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {RECURRENCE_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Drawer>
  );
}

function ProofPicker({ file, onPick, error }: { file: File | null; onPick: (f: File | null) => void; error: string | null }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <label htmlFor="proof-file" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
        Proof of filing
      </label>
      <input
        id="proof-file"
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-card file:border file:border-neutral-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold"
      />
      <p className="text-xs text-neutral-500">PNG, JPEG or PDF, up to 10 MB.{file ? ` Selected: ${file.name}` : ""}</p>
      {error && <p className="text-xs font-medium text-danger-600">{error}</p>}
    </div>
  );
}

const dialogOverlay = "fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4";
const dialogPanel = "bg-white rounded-modal p-6 w-full max-w-md shadow-accent space-y-5 outline-none";

/** Mark a filing done, optionally attaching proof first. Proof is never required. */
export function MarkDoneDialog({
  item,
  onClose,
  onDone,
}: {
  item: ComplianceItem;
  onClose: () => void;
  onDone: (item: ComplianceItem) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setFileError(f ? proofFileProblem(f) : null);
  };

  const confirm = async () => {
    if (busy || fileError) return;
    setBusy(true);
    setError(null);
    try {
      // Proof goes up first: if it is rejected the filing stays open and nothing is half done.
      if (file) await uploadComplianceProof(item.id, file);
      await updateComplianceItem(item.id, { status: "done" });
      await onDone(item);
    } catch (err) {
      const le = toLegalError(err, "Couldn't mark this done. Try again.");
      setError(le.notFound ? "That filing no longer exists." : le.message);
      setBusy(false);
    }
  };

  return (
    <ModalDialog label="Mark filing done" onClose={onClose} overlayClassName={dialogOverlay} className={dialogPanel}>
      <h2 className="text-xl font-display font-bold text-neutral-900">Mark as done</h2>
      <p className="text-sm text-neutral-600">
        {item.title}, due {formatDate(item.due_on)}.
        {item.recurrence !== "none" && ` This filing repeats ${RECURRENCE_LABEL[item.recurrence].toLowerCase()}, so the next one is added for you.`}
      </p>
      <FormError message={error} />
      <ProofPicker file={file} onPick={pick} error={fileError} />
      <p className="text-xs text-neutral-500">Proof is optional. You can attach it later.</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="button" onClick={() => void confirm()} className={darkBtn} disabled={busy || fileError !== null}>
          {busy ? "Saving" : "Mark done"}
        </button>
      </div>
    </ModalDialog>
  );
}

/** Attach or replace proof without changing the filing's status. */
export function ProofDialog({
  item,
  onClose,
  onUploaded,
}: {
  item: ComplianceItem;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setFileError(f ? proofFileProblem(f) : null);
  };

  const upload = async () => {
    if (!file) return setFileError("Choose a file first.");
    if (busy || fileError) return;
    setBusy(true);
    setError(null);
    try {
      await uploadComplianceProof(item.id, file);
      await onUploaded();
    } catch (err) {
      const le = toLegalError(err, "Couldn't upload that file. Try again.");
      setError(le.notFound ? "That filing no longer exists." : le.message);
      setBusy(false);
    }
  };

  return (
    <ModalDialog label={item.proof_url ? "Replace proof" : "Attach proof"} onClose={onClose} overlayClassName={dialogOverlay} className={dialogPanel}>
      <h2 className="text-xl font-display font-bold text-neutral-900">{item.proof_url ? "Replace proof" : "Attach proof"}</h2>
      <p className="text-sm text-neutral-600">
        {item.title}. This does not change the filing&apos;s status.{item.proof_url ? " The current file is replaced." : ""}
      </p>
      <FormError message={error} />
      <ProofPicker file={file} onPick={pick} error={fileError} />
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className={secondaryBtn} disabled={busy}>
          Cancel
        </button>
        <button type="button" onClick={() => void upload()} className={darkBtn} disabled={busy || fileError !== null}>
          {busy ? "Uploading" : "Upload"}
        </button>
      </div>
    </ModalDialog>
  );
}
