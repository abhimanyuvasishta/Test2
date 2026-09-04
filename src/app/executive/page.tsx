"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import BriefForm from "@/components/BriefForm";
import ScriptPreview from "@/components/ScriptPreview";
import VideoStudio from "@/components/VideoStudio";
import StepIndicator from "@/components/StepIndicator";
import type { ClientBrief, GenerationResult } from "@/types";
import type { ClientBriefInput } from "@/lib/validation";
import { generateScript } from "@/lib/generate-script";

const STEPS = [
  { id: 1, label: "Client Brief" },
  { id: 2, label: "AI Script" },
  { id: 3, label: "Video Studio" },
];

export default function ExecutiveStudioPage() {
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState<ClientBrief | null>(null);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBriefSubmit = async (data: ClientBriefInput) => {
    setIsGenerating(true);
    setError(null);

    const clientBrief: ClientBrief = {
      ...data,
      highlights: data.highlights.map((h) => ({
        ...h,
        id: h.id || uuidv4(),
      })),
    };

    try {
      const result = await generateScript(clientBrief);
      setBrief(clientBrief);
      setGeneration(result);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceedToVideo = () => setStep(3);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-white/40 hover:text-white">
              ← Series studio
            </a>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">Executive demo studio</h1>
              <p className="text-xs text-white/40">Canvas preview & WebM export</p>
            </div>
          </div>
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>
      </header>

      {step === 1 && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-6 py-16 text-center relative">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
              Turn client inputs into
              <span className="block bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                executive-ready demo videos
              </span>
            </h2>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {step === 1 && <BriefForm onSubmit={handleBriefSubmit} isLoading={isGenerating} />}

        {step === 2 && brief && generation && (
          <ScriptPreview
            brief={brief}
            generation={generation}
            onBack={handleBack}
            onProceed={handleProceedToVideo}
          />
        )}

        {step === 3 && brief && generation && (
          <VideoStudio
            brief={brief}
            script={generation.script}
            source={generation.source}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}
