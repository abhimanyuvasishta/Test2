"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  clientBriefSchema,
  defaultBrief,
  sampleBrief,
  type ClientBriefInput,
} from "@/lib/validation";

interface BriefFormProps {
  onSubmit: (data: ClientBriefInput) => void;
  isLoading: boolean;
}

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
    if (form.highlights.length >= 8) return;
    setForm((prev) => ({
      ...prev,
      highlights: [
        ...prev.highlights,
        { id: uuidv4(), title: "", description: "", metric: "" },
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
    const result = clientBriefSchema.safeParse(form);
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
      {/* Client & Product */}
      <section className="glass-panel p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold">Client & Product Details</h3>
            <p className="text-sm text-white/50 mt-1">
              Basic information about your client and their product
            </p>
          </div>
          <button type="button" onClick={loadSample} className="btn-secondary text-sm">
            Load Sample
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Client Name" error={errors.clientName}>
            <input
              className="input-field"
              placeholder="Acme Corporation"
              value={form.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
            />
          </Field>
          <Field label="Product Name" error={errors.productName}>
            <input
              className="input-field"
              placeholder="Nexus Platform"
              value={form.productName}
              onChange={(e) => updateField("productName", e.target.value)}
            />
          </Field>
          <Field label="Tagline" error={errors.tagline} className="md:col-span-2">
            <input
              className="input-field"
              placeholder="Enterprise intelligence, reimagined"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
            />
          </Field>
          <Field label="Industry" error={errors.industry}>
            <input
              className="input-field"
              placeholder="Enterprise SaaS"
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
            />
          </Field>
          <Field label="Brand Color" error={errors.brandColor}>
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

      {/* Audience & Tone */}
      <section className="glass-panel p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 className="font-display text-xl font-bold mb-6">Audience & Tone</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Target Audience">
            <select
              className="input-field"
              value={form.targetAudience}
              onChange={(e) =>
                updateField("targetAudience", e.target.value as ClientBriefInput["targetAudience"])
              }
            >
              <option value="ceo">CEO — Strategic & ROI focused</option>
              <option value="cto">CTO — Technical & architecture focused</option>
              <option value="marketing">Marketing — Brand & differentiation focused</option>
              <option value="mixed">Mixed C-Suite audience</option>
            </select>
          </Field>
          <Field label="Video Tone">
            <select
              className="input-field"
              value={form.tone}
              onChange={(e) => updateField("tone", e.target.value as ClientBriefInput["tone"])}
            >
              <option value="executive">Executive — Polished & authoritative</option>
              <option value="technical">Technical — Precise & credible</option>
              <option value="visionary">Visionary — Aspirational & transformative</option>
              <option value="bold">Bold — Disruptive & confident</option>
            </select>
          </Field>
          <Field label="Call to Action" error={errors.callToAction} className="md:col-span-2">
            <input
              className="input-field"
              placeholder="Schedule a strategic demo today"
              value={form.callToAction}
              onChange={(e) => updateField("callToAction", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="glass-panel p-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold">Product Highlights</h3>
            <p className="text-sm text-white/50 mt-1">
              Add the key capabilities and proof points your client wants featured
            </p>
          </div>
          <button
            type="button"
            onClick={addHighlight}
            disabled={form.highlights.length >= 8}
            className="btn-secondary text-sm"
          >
            + Add Highlight
          </button>
        </div>

        {errors.highlights && (
          <p className="text-red-400 text-sm mb-4">{errors.highlights}</p>
        )}

        <div className="space-y-5">
          {form.highlights.map((highlight, index) => (
            <div
              key={highlight.id}
              className="p-5 rounded-xl bg-surface-700/30 border border-white/5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-400">
                  Highlight {index + 1}
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
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Title"
                  error={errors[`highlights.${index}.title`]}
                >
                  <input
                    className="input-field"
                    placeholder="Unified Data Intelligence"
                    value={highlight.title}
                    onChange={(e) => updateHighlight(index, "title", e.target.value)}
                  />
                </Field>
                <Field
                  label="Key Metric (optional)"
                  error={errors[`highlights.${index}.metric`]}
                >
                  <input
                    className="input-field"
                    placeholder="40% faster decisions"
                    value={highlight.metric || ""}
                    onChange={(e) => updateHighlight(index, "metric", e.target.value)}
                  />
                </Field>
                <Field
                  label="Description"
                  error={errors[`highlights.${index}.description`]}
                  className="md:col-span-2"
                >
                  <textarea
                    className="input-field min-h-[80px] resize-y"
                    placeholder="Describe the capability and its business impact..."
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
              Generating Script...
            </>
          ) : (
            <>
              Generate AI Script
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
