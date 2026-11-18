"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, GripVertical, Lock, Plus, Save, Search, StickyNote, Trash2, X } from "lucide-react";
import {
  createReport,
  exportReport,
  getCatalog,
  getReport,
  listTemplates,
  patchReport,
  previewReport,
  toAnalyticsError,
  type Block,
  type Catalog,
  type CatalogMetric,
  type CompareKey,
  type MetricBlock,
  type Preview,
  type RangeKey,
  type RangeSpec,
  type Report,
  type Template,
  type TextBlock,
  type Viz,
} from "@/lib/api/analytics";
import { COMPARE_OPTIONS, DEFAULT_RANGE, MAX_BLOCKS, RANGE_OPTIONS, hubLabel, moveItem, newBlockId, periodLabel, reorderTo, asOfLabel } from "@/lib/analytics-format";
import { useAnalyticsResource } from "@/hooks/useAnalyticsResource";
import { useToast } from "../../ToastContext";
import { useAnalyticsAccess } from "../../_components/access";
import { ExportMenu } from "../../_components/export-menu";
import { RangePicker } from "../../_components/metric";
import { RunResults } from "../../_components/run-view";
import {
  ErrorBlock,
  Field,
  ForbiddenBlock,
  FormError,
  ResourceGate,
  SkeletonRows,
  cardCls,
  darkBtn,
  inputCls,
  labelCls,
  linkBtn,
  secondaryBtn,
} from "../../_components/ui";

type Step = "sources" | "canvas" | "config";

interface Draft {
  name: string;
  description: string;
  blocks: Block[];
  range: RangeSpec;
}

const VIZ_OPTIONS: { key: Viz; label: string }[] = [
  { key: "number", label: "Number" },
  { key: "line", label: "Line chart" },
  { key: "bar", label: "Bar chart" },
];

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "new";
  const access = useAnalyticsAccess();
  const loadCatalog = useCallback(() => getCatalog(), []);
  const catalog = useAnalyticsResource<Catalog>(access.canWrite ? loadCatalog : null);
  const loadReport = useCallback(() => getReport(id), [id]);
  const report = useAnalyticsResource<Report>(id !== "new" && access.canWrite ? loadReport : null);

  if (access.loading) return <SkeletonRows rows={3} label="Loading" />;
  if (!access.canWrite) {
    return <ForbiddenBlock body="Only founders and team members build reports. Open a report shared with you from Reports to read it." />;
  }
  if (id === "new") {
    return (
      <ResourceGate resource={catalog} skeleton={<SkeletonRows rows={3} label="Loading metrics" />}>
        {(cat) => <Builder key="new" catalog={cat} initial={null} />}
      </ResourceGate>
    );
  }
  return (
    <ResourceGate resource={report} what="report" skeleton={<SkeletonRows rows={3} label="Loading report" />}>
      {(r) =>
        !r.can_edit ? (
          <ForbiddenBlock body="You can read this report but not change it. Team members edit only reports they own." />
        ) : (
          <ResourceGate resource={catalog} skeleton={<SkeletonRows rows={3} label="Loading metrics" />}>
            {(cat) => <Builder key={`${r.id}-${r.version}`} catalog={cat} initial={r} onReload={() => void report.reload()} />}
          </ResourceGate>
        )
      }
    </ResourceGate>
  );
}

function draftOf(r: Report | null): Draft {
  if (!r) return { name: "", description: "", blocks: [], range: DEFAULT_RANGE };
  return { name: r.name, description: r.description ?? "", blocks: r.blocks, range: r.default_range };
}

function Builder({ catalog, initial, onReload }: { catalog: Catalog; initial: Report | null; onReload?: () => void }) {
  const router = useRouter();
  const { triggerToast } = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftOf(initial));
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(initial && initial.blocks.length ? "canvas" : "sources");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [announce, setAnnounce] = useState("");
  const dragFrom = useRef<number | null>(null);

  const metricsByKey = useMemo(() => {
    const m = new Map<string, CatalogMetric>();
    for (const h of catalog.hubs) for (const x of h.metrics) m.set(x.key, x);
    return m;
  }, [catalog]);

  // Unsaved-changes guard for reloads and tab closes.
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  const update = (fn: (d: Draft) => Draft) => {
    setDraft((d) => fn(d));
    setDirty(true);
    setPreview(null);
  };

  const blockLabel = (b: Block): string => {
    if (b.locked) return `${b.needs_label} block`;
    if (b.type === "text") return b.title || "Text note";
    return b.title || metricsByKey.get(b.metric)?.label || "Metric no longer available";
  };

  const addMetric = (m: CatalogMetric) => {
    if (draft.blocks.length >= MAX_BLOCKS) {
      triggerToast(`A report holds up to ${MAX_BLOCKS} blocks.`, "error");
      return;
    }
    const block: MetricBlock = { id: newBlockId(), type: "metric", metric: m.key, viz: "number", title: null, range: null, compare: null };
    update((d) => ({ ...d, blocks: [...d.blocks, block] }));
    setSelectedId(block.id);
    setAnnounce(`Added ${m.label}. ${draft.blocks.length + 1} blocks.`);
  };

  const addText = () => {
    if (draft.blocks.length >= MAX_BLOCKS) {
      triggerToast(`A report holds up to ${MAX_BLOCKS} blocks.`, "error");
      return;
    }
    const block: TextBlock = { id: newBlockId(), type: "text", title: "Note", text: "" };
    update((d) => ({ ...d, blocks: [...d.blocks, block] }));
    setSelectedId(block.id);
    setStep("config");
    setAnnounce("Added a text note.");
  };

  const move = (i: number, delta: number) => {
    const next = moveItem(draft.blocks, i, delta);
    if (next === draft.blocks) return;
    update((d) => ({ ...d, blocks: next }));
    setAnnounce(`Moved ${blockLabel(draft.blocks[i])} to position ${i + delta + 1} of ${draft.blocks.length}.`);
  };

  const duplicate = (i: number) => {
    if (draft.blocks.length >= MAX_BLOCKS) {
      triggerToast(`A report holds up to ${MAX_BLOCKS} blocks.`, "error");
      return;
    }
    const copy = { ...draft.blocks[i], id: newBlockId() } as Block;
    update((d) => ({ ...d, blocks: [...d.blocks.slice(0, i + 1), copy, ...d.blocks.slice(i + 1)] }));
    setAnnounce(`Duplicated ${blockLabel(draft.blocks[i])}.`);
  };

  const remove = (i: number) => {
    const b = draft.blocks[i];
    update((d) => ({ ...d, blocks: d.blocks.filter((_, k) => k !== i) }));
    if (selectedId === b.id) setSelectedId(null);
    setAnnounce(`Removed ${blockLabel(b)}.`);
  };

  const setBlock = (blockId: string, patch: Partial<MetricBlock> | Partial<TextBlock>) =>
    update((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as Block) : b)) }));

  const applyTemplate = (t: Template) => {
    update((d) => ({
      name: d.name || t.name,
      description: d.description || t.description,
      range: t.default_range,
      blocks: t.blocks.map((b) => ({ id: newBlockId(), type: "metric", metric: b.metric, viz: b.viz, title: null, range: null, compare: null })),
    }));
    setStep("canvas");
    setAnnounce(`Started from ${t.name}: ${t.blocks.length} blocks.`);
  };

  const runPreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      setPreview(await previewReport(draft.blocks, draft.range));
      setStep("canvas");
    } catch (err) {
      setError(toAnalyticsError(err, "Couldn't preview the report. Try again.").message);
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setError("Give the report a name.");
      return;
    }
    if (draft.range.range === "custom" && (!draft.range.from || !draft.range.to)) {
      setError("Pick both dates for the report period.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = { name: draft.name.trim(), description: draft.description.trim() || null, blocks: draft.blocks, default_range: draft.range };
    try {
      if (!initial) {
        const created = await createReport(body);
        setDirty(false);
        triggerToast("Report saved");
        router.replace(`/analytics-reports/builder/${created.id}`);
      } else {
        await patchReport(initial.id, initial.version, body);
        setDirty(false);
        triggerToast("Report saved");
        onReload?.();
      }
    } catch (err) {
      const e = toAnalyticsError(err, "Couldn't save the report. Try again.");
      if (e.code === "VERSION_CONFLICT") setConflict(true);
      else setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selected = draft.blocks.find((b) => b.id === selectedId) ?? null;
  const exportDisabled = !initial || dirty;

  return (
    <div className="space-y-5 animate-fadeIn">
      <Link href={initial ? `/analytics-reports/saved/${initial.id}` : "/analytics-reports/saved"} className="inline-flex items-center gap-1 max-md:min-h-11 text-xs font-bold text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {initial ? "Back to the report" : "All reports"}
      </Link>

      {/* Header: name, period, Preview, Save, Export */}
      <div className={`${cardCls} p-4 md:p-5 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            <label htmlFor="rep-name" className="sr-only">
              Report name
            </label>
            <input
              id="rep-name"
              value={draft.name}
              maxLength={200}
              placeholder="Untitled report"
              onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
              className="w-full text-2xl font-display font-semibold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-accent-600 focus:outline-none py-1"
            />
            <label htmlFor="rep-desc" className="sr-only">
              Description
            </label>
            <input
              id="rep-desc"
              value={draft.description}
              maxLength={1000}
              placeholder="What is this report for? (optional)"
              onChange={(e) => update((d) => ({ ...d, description: e.target.value }))}
              className="w-full text-sm text-neutral-600 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-accent-600 focus:outline-none py-1"
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-start gap-2 shrink-0">
            <button type="button" className={secondaryBtn} disabled={previewing || draft.blocks.length === 0} onClick={() => void runPreview()}>
              <Eye className="w-4 h-4" aria-hidden="true" /> {previewing ? "Previewing" : "Preview"}
            </button>
            <button type="button" className={darkBtn} disabled={saving || (!dirty && !!initial)} onClick={() => void save()}>
              <Save className="w-4 h-4" aria-hidden="true" /> {saving ? "Saving" : dirty || !initial ? "Save report" : "Saved"}
            </button>
            <ExportMenu
              disabled={exportDisabled}
              disabledReason={exportDisabled ? "Save the report first." : undefined}
              options={
                initial
                  ? [
                      { label: "PDF (runs it now)", start: () => exportReport(initial.id, "pdf") },
                      { label: "Spreadsheet, XLSX (runs it now)", start: () => exportReport(initial.id, "xlsx") },
                    ]
                  : []
              }
            />
          </div>
        </div>
        <div>
          <p className={`${labelCls} mb-2`}>Report period</p>
          <RangePicker value={draft.range} onChange={(r) => update((d) => ({ ...d, range: r }))} idPrefix="rep" label="Report period" />
        </div>
        {dirty && <p className="text-xs text-warning-700">You have unsaved changes.</p>}
        <FormError message={error} />
        {conflict && (
          <div role="alert" className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-warning-50 border border-warning-500/40 rounded-card p-4">
            <p className="text-sm font-semibold text-warning-800">Someone else changed this report. Reload it and apply your change again.</p>
            <button type="button" className={secondaryBtn} onClick={() => onReload?.()}>
              Reload
            </button>
          </div>
        )}
      </div>

      {/* Below lg the three panes become steps. */}
      <div role="tablist" aria-label="Builder steps" className="lg:hidden grid grid-cols-3 gap-1 bg-white border border-neutral-200 rounded-card p-1">
        {(
          [
            ["sources", "1. Metrics"],
            ["canvas", `2. Canvas (${draft.blocks.length})`],
            ["config", "3. Block settings"],
          ] as [Step, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={step === k}
            onClick={() => setStep(k)}
            className={`min-h-11 rounded-input text-xs font-semibold ${step === k ? "bg-brand-900 text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)_18rem] gap-5 items-start">
        <div className={step === "sources" ? "" : "max-lg:hidden"}>
          <CatalogPane catalog={catalog} onAdd={(m) => addMetric(m)} onAddText={addText} full={draft.blocks.length >= MAX_BLOCKS} />
        </div>

        <div className={`${step === "canvas" ? "" : "max-lg:hidden"} space-y-4 min-w-0`}>
          <section aria-labelledby="canvas-h" className={`${cardCls} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 id="canvas-h" className="text-sm font-bold text-neutral-700">
                Canvas · {draft.blocks.length} of {MAX_BLOCKS} blocks
              </h2>
            </div>
            {draft.blocks.length === 0 ? (
              <EmptyCanvas onTemplate={applyTemplate} onBrowse={() => setStep("sources")} />
            ) : (
              <ol className="space-y-2">
                {draft.blocks.map((b, i) => {
                  const label = blockLabel(b);
                  const isSel = b.id === selectedId;
                  const meta = b.locked
                    ? "Locked for your role"
                    : b.type === "text"
                      ? "Text"
                      : `${hubLabel(metricsByKey.get(b.metric)?.hub ?? b.hub ?? "")} · ${VIZ_OPTIONS.find((v) => v.key === b.viz)?.label ?? b.viz}${b.range ? ` · ${RANGE_OPTIONS.find((r) => r.key === b.range!.range)?.label ?? b.range.range}` : ""}`;
                  return (
                    <li
                      key={b.id}
                      draggable
                      onDragStart={() => {
                        dragFrom.current = i;
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragFrom.current === null || dragFrom.current === i) return;
                        const from = dragFrom.current;
                        update((d) => ({ ...d, blocks: reorderTo(d.blocks, from, i) }));
                        setAnnounce(`Moved ${blockLabel(draft.blocks[from])} to position ${i + 1}.`);
                        dragFrom.current = null;
                      }}
                      className={`flex items-center gap-2 rounded-card border p-2.5 bg-white ${isSel ? "border-accent-600 ring-2 ring-accent-600/15" : "border-neutral-200"}`}
                    >
                      <GripVertical className="w-4 h-4 text-neutral-300 shrink-0 cursor-grab max-md:hidden" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(b.id);
                          setStep("config");
                        }}
                        aria-pressed={isSel}
                        className="flex-1 min-w-0 text-left max-md:min-h-11"
                      >
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 truncate">
                          {b.locked ? <Lock className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" /> : b.type === "text" ? <StickyNote className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" /> : null}
                          {label}
                        </span>
                        <span className="block text-xs text-neutral-500 truncate">{meta}</span>
                      </button>
                      <div className="flex items-center">
                        <IconBtn label={`Move ${label} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn label={`Move ${label} down`} disabled={i === draft.blocks.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn label={`Duplicate ${label}`} disabled={!!b.locked} onClick={() => duplicate(i)}>
                          <Copy className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn label={`Remove ${label}`} onClick={() => remove(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconBtn>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {preview && (
            <section aria-labelledby="preview-h" className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 id="preview-h" className="text-lg font-display font-semibold text-neutral-900">
                  Preview · {periodLabel(preview.period)}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-neutral-500">Live numbers {asOfLabel(preview.as_of)}, not saved</p>
                  <button type="button" className={linkBtn} onClick={() => setPreview(null)} aria-label="Close preview">
                    <X className="w-3.5 h-3.5" aria-hidden="true" /> Close
                  </button>
                </div>
              </div>
              <RunResults results={preview.results} />
            </section>
          )}
        </div>

        <div className={step === "config" ? "" : "max-lg:hidden"}>
          <ConfigPane block={selected} catalog={catalog} metricsByKey={metricsByKey} onChange={(p) => selected && setBlock(selected.id, p)} />
        </div>
      </div>
    </div>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 max-md:min-h-11 max-md:min-w-9 inline-flex items-center justify-center rounded-input text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function EmptyCanvas({ onTemplate, onBrowse }: { onTemplate: (t: Template) => void; onBrowse: () => void }) {
  const load = useCallback(() => listTemplates(), []);
  const templates = useAnalyticsResource<Template[]>(load);
  return (
    <div className="p-6 text-center space-y-4 border border-dashed border-neutral-300 rounded-card">
      <p className="text-sm text-neutral-700">
        Add a metric from the list to start.{" "}
        <button type="button" className="lg:hidden font-bold text-brand-800 underline max-md:min-h-11" onClick={onBrowse}>
          Browse metrics
        </button>{" "}
        Or start from a template:
      </p>
      {templates.status === "loading" && <SkeletonRows rows={1} label="Loading templates" />}
      {templates.status === "error" && <ErrorBlock message={templates.error ?? "Couldn't load templates."} onRetry={() => void templates.reload()} />}
      {templates.status === "ready" && (
        <div className="flex flex-wrap justify-center gap-2">
          {templates.data!.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTemplate(t)}
              title={t.description}
              className="px-3.5 py-2 max-md:min-h-11 rounded-full border border-accent-200 bg-accent-100 text-xs font-semibold text-ink hover:bg-accent-200"
            >
              {t.name}
              {t.omitted_hubs.length > 0 ? ` (without ${t.omitted_hubs.map(hubLabel).join(", ")})` : ""}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-neutral-500">Templates are fixed starting points, not AI.</p>
    </div>
  );
}

function CatalogPane({ catalog, onAdd, onAddText, full }: { catalog: Catalog; onAdd: (m: CatalogMetric) => void; onAddText: () => void; full: boolean }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  return (
    <section aria-labelledby="cat-h" className={`${cardCls} p-4 space-y-3 lg:max-h-[70vh] lg:overflow-y-auto`}>
      <h2 id="cat-h" className="text-sm font-bold text-neutral-700">
        Metrics
      </h2>
      <label htmlFor="cat-q" className="relative block">
        <span className="sr-only">Search metrics</span>
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input id="cat-q" type="search" className={`${inputCls} pl-9`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <button type="button" className={`${secondaryBtn} w-full`} onClick={onAddText} disabled={full}>
        <StickyNote className="w-4 h-4" aria-hidden="true" /> Add a text note
      </button>
      {catalog.hubs.map((h) => {
        const list = h.metrics.filter((m) => !needle || m.label.toLowerCase().includes(needle) || m.definition.toLowerCase().includes(needle));
        if (needle && list.length === 0 && !h.locked) return null;
        if (needle && h.locked && !h.label.toLowerCase().includes(needle)) return null;
        return (
          <div key={h.hub} className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              {h.locked && <Lock className="w-3 h-3" aria-hidden="true" />}
              {h.hub === "custom" ? "Entered by you" : h.label}
            </h3>
            {h.locked ? (
              <p className="text-xs text-neutral-500 pl-0.5">{h.label} access needed. Your role can&apos;t use these metrics.</p>
            ) : list.length === 0 ? (
              <p className="text-xs text-neutral-400 pl-0.5">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {list.map((m) => (
                  <li key={m.key}>
                    <button
                      type="button"
                      onClick={() => onAdd(m)}
                      disabled={full}
                      title={m.definition}
                      className="w-full flex items-center justify-between gap-2 text-left px-2.5 py-1.5 max-md:min-h-11 rounded-input text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <span className="truncate">
                        {m.label}
                        {m.entered_by_you && <span className="sr-only"> (entered by you)</span>}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-label={`Add ${m.label}`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function ConfigPane({
  block,
  catalog,
  metricsByKey,
  onChange,
}: {
  block: Block | null;
  catalog: Catalog;
  metricsByKey: Map<string, CatalogMetric>;
  onChange: (patch: Partial<MetricBlock> | Partial<TextBlock>) => void;
}) {
  if (!block) {
    return (
      <section className={`${cardCls} p-4`} aria-label="Block settings">
        <h2 className="text-sm font-bold text-neutral-700 mb-1">Block settings</h2>
        <p className="text-xs text-neutral-500">Pick a block on the canvas to change its title, chart, period or comparison.</p>
      </section>
    );
  }
  if (block.locked) {
    return (
      <section className={`${cardCls} p-4`} aria-label="Block settings">
        <p className="text-sm text-neutral-600">This block needs {block.needs_label} access. You can move or remove it, not change it.</p>
      </section>
    );
  }
  if (block.type === "text") {
    return (
      <section className={`${cardCls} p-4 space-y-4`} aria-label="Block settings">
        <h2 className="text-sm font-bold text-neutral-700">Text note</h2>
        <Field label="Title" htmlFor="tb-title">
          <input id="tb-title" className={inputCls} maxLength={80} value={block.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Text" htmlFor="tb-text" hint="Plain text, up to 2,000 characters.">
          <textarea id="tb-text" rows={6} className={inputCls} maxLength={2000} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
        </Field>
      </section>
    );
  }
  const own = block.range;
  const metric = metricsByKey.get(block.metric);
  return (
    <section className={`${cardCls} p-4 space-y-4`} aria-label="Block settings">
      <h2 className="text-sm font-bold text-neutral-700">{metric?.label ?? "Metric no longer available"}</h2>
      {metric && <p className="text-xs text-neutral-500">{metric.definition}</p>}
      <Field label="Metric" htmlFor="mb-metric">
        <select id="mb-metric" className={inputCls} value={block.metric} onChange={(e) => onChange({ metric: e.target.value })}>
          {!metric && <option value={block.metric}>Metric no longer available</option>}
          {catalog.hubs
            .filter((h) => !h.locked && h.metrics.length > 0)
            .map((h) => (
              <optgroup key={h.hub} label={h.hub === "custom" ? "Entered by you" : h.label}>
                {h.metrics.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </Field>
      <Field label="Title (optional)" htmlFor="mb-title">
        <input id="mb-title" className={inputCls} maxLength={80} value={block.title ?? ""} placeholder={metric?.label} onChange={(e) => onChange({ title: e.target.value || null })} />
      </Field>
      <Field label="Show as" htmlFor="mb-viz">
        <select id="mb-viz" className={inputCls} value={block.viz} onChange={(e) => onChange({ viz: e.target.value as Viz })}>
          {VIZ_OPTIONS.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Period" htmlFor="mb-range">
        <select
          id="mb-range"
          className={inputCls}
          value={own?.range ?? "report"}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ range: v === "report" ? null : { range: v as RangeKey, from: v === "custom" ? own?.from ?? null : null, to: v === "custom" ? own?.to ?? null : null } });
          }}
        >
          <option value="report">Use the report period</option>
          {RANGE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      {own?.range === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="From" htmlFor="mb-from">
            <input id="mb-from" type="date" className={inputCls} value={own.from ?? ""} onChange={(e) => onChange({ range: { ...own, from: e.target.value || null } })} />
          </Field>
          <Field label="To" htmlFor="mb-to">
            <input id="mb-to" type="date" className={inputCls} value={own.to ?? ""} onChange={(e) => onChange({ range: { ...own, to: e.target.value || null } })} />
          </Field>
        </div>
      )}
      <Field label="Compare with" htmlFor="mb-compare">
        <select
          id="mb-compare"
          className={inputCls}
          value={block.compare ?? "report"}
          onChange={(e) => onChange({ compare: e.target.value === "report" ? null : (e.target.value as CompareKey) })}
        >
          <option value="report">Same as the report</option>
          {COMPARE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </section>
  );
}
