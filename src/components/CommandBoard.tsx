"use client";

import { useState } from "react";
import { ASPECT_OPTIONS, FORMAT_OPTIONS, NICHE_PRESETS } from "@/lib/formats";
import { commandInputSchema, defaultCommand, sampleCommand } from "@/lib/validation";
import type { CommandInput } from "@/types";

interface CommandBoardProps {
  onSubmit: (input: CommandInput) => void;
  isLoading: boolean;
}

export default function CommandBoard({ onSubmit, isLoading }: CommandBoardProps) {
  const [form, setForm] = useState<CommandInput>(defaultCommand);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = <K extends keyof CommandInput>(key: K, value: CommandInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (id: string) => {
    const preset = NICHE_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      command: preset.command,
      format: preset.format,
      niche: preset.label,
    }));
    setErrors({});
  };

  const addCharacter = () => {
    if (form.characters.length >= 6) return;
    setForm((prev) => ({
      ...prev,
      characters: [...prev.characters, { name: "", role: "" }],
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = commandInputSchema.safeParse({
      ...form,
      characters: form.characters.filter((character) => character.name.trim()),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[issue.path.join(".")] = issue.message;
      });
      setErrors(next);
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="glass-panel p-8 animate-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Command the episode</h2>
            <p className="text-sm text-white/50 mt-1">
              Describe the video. Forge writes the bible, shot list, and captions.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              setForm(sampleCommand);
              setShowAdvanced(true);
              setErrors({});
            }}
          >
            Load sample series
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {NICHE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                form.niche === preset.label
                  ? "bg-brand-500/20 border-brand-400/50 text-brand-200"
                  : "bg-white/5 border-white/10 text-white/70 hover:border-white/25"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <textarea
          className="input-field min-h-[140px] resize-y text-lg"
          placeholder="Example: 6-episode animated series. Maya and Leo launch FluxMug. Episode 1 is the leaky prototype in a rideshare. Keep the mug and both faces locked."
          value={form.command}
          onChange={(event) => update("command", event.target.value)}
        />
        {errors.command && <p className="text-red-400 text-sm mt-2">{errors.command}</p>}

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-sm text-white/60 mb-2">Format</p>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => update("format", option.id)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    form.format === option.id
                      ? "bg-brand-500/15 border-brand-400/40"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="block font-semibold text-sm">{option.title}</span>
                  <span className="block text-xs text-white/45 mt-1">{option.blurb}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-white/60 mb-2">Aspect</p>
            <div className="space-y-2">
              {ASPECT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => update("aspect", option.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                    form.aspect === option.id
                      ? "bg-brand-500/15 border-brand-400/40"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-sm text-white/45">{option.hint}</span>
                </button>
              ))}
            </div>
            {form.format === "series" && (
              <label className="block mt-4 text-sm text-white/60">
                Episodes
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input-field mt-2"
                  value={form.episodeCount}
                  onChange={(event) => update("episodeCount", Number(event.target.value) || 1)}
                />
              </label>
            )}
          </div>
        </div>
      </section>

      <section className="glass-panel p-8">
        <button
          type="button"
          className="text-sm text-white/60 hover:text-white"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? "Hide" : "Lock"} characters & product
        </button>
        {showAdvanced && (
          <div className="mt-6 grid md:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Characters</p>
                <button type="button" className="btn-secondary text-xs" onClick={addCharacter}>
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {form.characters.map((character, index) => (
                  <div key={`${index}-${character.name}`} className="grid grid-cols-2 gap-2">
                    <input
                      className="input-field"
                      placeholder="Name"
                      value={character.name}
                      onChange={(event) => {
                        const characters = form.characters.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item
                        );
                        update("characters", characters);
                      }}
                    />
                    <input
                      className="input-field"
                      placeholder="Role"
                      value={character.role}
                      onChange={(event) => {
                        const characters = form.characters.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, role: event.target.value } : item
                        );
                        update("characters", characters);
                      }}
                    />
                  </div>
                ))}
                {form.characters.length === 0 && (
                  <p className="text-sm text-white/40">Leave empty to infer names from the command.</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-semibold">Product lock</p>
              <input
                className="input-field"
                placeholder="Product name"
                value={form.productName}
                onChange={(event) => update("productName", event.target.value)}
              />
              <input
                className="input-field"
                placeholder="Features (comma separated)"
                value={form.productFeatures}
                onChange={(event) => update("productFeatures", event.target.value)}
              />
              <div className="flex gap-3">
                <input
                  type="color"
                  className="w-14 h-12 rounded-xl border border-white/10 bg-transparent"
                  value={form.brandColor}
                  onChange={(event) => update("brandColor", event.target.value)}
                />
                <input
                  className="input-field font-mono"
                  value={form.brandColor}
                  onChange={(event) => update("brandColor", event.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn-primary text-lg px-10">
          {isLoading ? "Directing…" : "Generate production"}
        </button>
      </div>
    </form>
  );
}
