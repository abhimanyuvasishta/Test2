"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  clientBriefSchema,
  defaultBrief,
  sampleBrief,
  type ClientBriefInput,
} from "@/lib/validation";
import type { AudienceType, HighlightKind, VideoTone } from "@/types";

interface BriefFormProps {
  onSubmit: (data: ClientBriefInput) => void;
  isLoading: boolean;
}

const AUDIENCES: { id: AudienceType; title: string; detail: string }[] = [
  { id: "ceo", title: "CEO", detail: "Value, risk, speed to outcome" },
  { id: "cto", title: "CTO", detail: "Architecture, reliability, production" },
  { id: "marketing", title: "Marketing", detail: "Category story and proof" },
  { id: "mixed", title: "C-suite mix", detail: "CEO, CTO, and CMO in one room" },
];

const TONES: { id: VideoTone; title: string }[] = [
  { id: "executive", title: "Executive" },
  { id: "technical", title: "Technical" },
  { id: "visionary", title: "Visionary" },
  { id: "bold", title: "Bold" },
];

const KINDS: { id: HighlightKind; label: string }[] = [
  { id: "capability", label: "Capability" },
  { id: "outcome", label: "Outcome" },
  { id: "proof", label: "Proof" },
];

export default function BriefForm({ onSubmit, isLoading }: BriefFormProps) {
  const [form, setForm] = useState<ClientBriefInput>(defaultBrief);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof ClientBriefInput>(key: K, value: ClientBriefInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateHighlight = (
    index: number,
    field: keyof ClientBriefInput["highlights"][0],
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const addHighlight = () => {
    if (form.highlights.length >= 12) return;
    setForm((prev) => ({
      ...prev,
      highlights: [
        ...prev.highlights,
        { id: uuidv4(), title: "", description: "", metric: "", kind: "capability" },
      ],
    }));
  };

  const removeHighlight = (index: number) => {
    if (form.highlights.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = {
      ...form,
      customerQuote: form.customerQuote?.trim() || undefined,
      quoteAttribution: form.quoteAttribution?.trim() || undefined,
      highlights: form.highlights.map((h) => ({
        ...h,
        metric: h.metric?.trim() || undefined,
      })),
    };
    const result = clientBriefSchema.safeParse(normalized);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
  };

  const loadSample = () => {
    setForm({
      ...sampleBrief,
      highlights: sampleBrief.highlights.map((h) => ({ ...h, id: uuidv4() })),
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="glass-panel p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold">Client & product</h3>
            <p className="text-sm text-white/50 mt-1">
              Who commissioned the film, and what must the room remember.
            </p>
          </div>
          <button type="button" onClick={loadSample} className="btn-secondary text-sm">
            Load sample brief
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Client name" error={errors.clientName}>
            <input
              className="input-field"
              placeholder="Meridian Systems"
              value={form.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
            />
          </Field>
          <Field label="Product name" error={errors.productName}>
            <input
              className="input-field"
              placeholder="Aether Control"
              value={form.productName}
              onChange={(e) => updateField("productName", e.target.value)}
            />
          </Field>
          <Field label="Tagline" error={errors.tagline} className="md:col-span-2">
            <input
              className="input-field"
              placeholder="The operating system for industrial intelligence"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
            />
          </Field>
          <Field label="Industry" error={errors.industry}>
            <input
              className="input-field"
              placeholder="Industrial AI"
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
            />
          </Field>
          <Field label="Brand color" error={errors.brandColor}>
            <div className="flex gap-3">
              <input
                type="color"
                className="w-14 h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                value={form.brandColor}
                onChange={(e) => updateField("brandColor", e.target.value)}
              />
              <input
                className="input-field flex-1 font-mono"
                value={form.brandColor}
                onChange={(e) => updateField("brandColor", e.target.value)}
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="glass-panel p-8 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <h3 className="font-display text-xl font-bold mb-2">Stakes the room must feel</h3>
        <p className="text-sm text-white/50 mb-6">
          CEO, CTO, and marketing heads need the problem, the outcome, and optional social proof.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Problem to call out" error={errors.problemStatement} className="md:col-span-2">
            <textarea
              className="input-field min-h-[96px] resize-y"
              placeholder="What breaks if they do nothing?"
              value={form.problemStatement}
              onChange={(e) => updateField("problemStatement", e.target.value)}
            />
          </Field>
          <Field label="Desired outcome" error={errors.desiredOutcome} className="md:col-span-2">
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="What does a successful quarter look like after this product?"
              value={form.desiredOutcome}
              onChange={(e) => updateField("desiredOutcome", e.target.value)}
            />
          </Field>
          <Field label="Customer quote (optional)" error={errors.customerQuote}>
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="A sentence a buyer would actually say"
              value={form.customerQuote || ""}
              onChange={(e) => updateField("customerQuote", e.target.value)}
            />
          </Field>
          <Field label="Quote attribution" error={errors.quoteAttribution}>
            <input
              className="input-field"
              placeholder="Name, title, company"
              value={form.quoteAttribution || ""}
              onChange={(e) => updateField("quoteAttribution", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="glass-panel p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 className="font-display text-xl font-bold mb-6">Audience & tone</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {AUDIENCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateField("targetAudience", item.id)}
              className={`text-left rounded-xl border px-4 py-4 transition-all ${
                form.targetAudience === item.id
                  ? "border-brand-400/60 bg-brand-500/15"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="font-display font-semibold">{item.title}</div>
              <div className="text-xs text-white/50 mt-1">{item.detail}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => updateField("tone", tone.id)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                form.tone === tone.id
                  ? "border-brand-400/60 bg-brand-500/15 text-brand-200"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              {tone.title}
            </button>
          ))}
        </div>
        <Field label="Call to action" error={errors.callToAction}>
          <input
            className="input-field"
            placeholder="Request the executive briefing"
            value={form.callToAction}
            onChange={(e) => updateField("callToAction", e.target.value)}
          />
        </Field>
      </section>

      <section className="glass-panel p-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold">Product callouts</h3>
            <p className="text-sm text-white/50 mt-1">
              Each callout becomes its own scene. Add capabilities, outcomes, and proof.
            </p>
          </div>
          <button
            type="button"
            onClick={addHighlight}
            disabled={form.highlights.length >= 12}
            className="btn-secondary text-sm"
          >
            + Add callout
          </button>
        </div>

        {errors.highlights && <p className="text-red-400 text-sm mb-4">{errors.highlights}</p>}

        <div className="space-y-5">
          {form.highlights.map((highlight, index) => (
            <div
              key={highlight.id}
              className="p-5 rounded-xl bg-surface-700/30 border border-white/5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-brand-400">
                  Callout {String(index + 1).padStart(2, "0")}
                </span>
                {form.highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="text-white/40 hover:text-red-400 text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {KINDS.map((kind) => (
                  <button
                    key={kind.id}
                    type="button"
                    onClick={() => updateHighlight(index, "kind", kind.id)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      (highlight.kind || "capability") === kind.id
                        ? "border-brand-400/50 text-brand-200 bg-brand-500/10"
                        : "border-white/10 text-white/45"
                    }`}
                  >
                    {kind.label}
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Title" error={errors[`highlights.${index}.title`]}>
                  <input
                    className="input-field"
                    placeholder="Live Operational Twin"
                    value={highlight.title}
                    onChange={(e) => updateHighlight(index, "title", e.target.value)}
                  />
                </Field>
                <Field label="Metric (optional)" error={errors[`highlights.${index}.metric`]}>
                  <input
                    className="input-field"
                    placeholder="18 min to insight"
                    value={highlight.metric || ""}
                    onChange={(e) => updateHighlight(index, "metric", e.target.value)}
                  />
                </Field>
                <Field
                  label="What to say on screen"
                  error={errors[`highlights.${index}.description`]}
                  className="md:col-span-2"
                >
                  <textarea
                    className="input-field min-h-[80px] resize-y"
                    placeholder="The sentence a CTO or CEO should be able to repeat."
                    value={highlight.description}
                    onChange={(e) => updateHighlight(index, "description", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn-primary text-lg px-10">
          {isLoading ? (
            <>
              <Spinner />
              Directing film...
            </>
          ) : (
            <>
              Generate executive film
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-white/70 mb-2">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
