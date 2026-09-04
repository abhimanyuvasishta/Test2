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

export default function HomePage() {
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
      {/* Header */}
      <header className="border-b border-white/5 bg-surface-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">Client Video Studio</h1>
              <p className="text-xs text-white/40">AI-powered executive demos</p>
            </div>
          </div>
          <StepIndicator steps={STEPS} currentStep={step} />
        </div>
      </header>

      {/* Hero (step 1 only) */}
      {step === 1 && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-6 py-16 text-center relative">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
              Turn Client Inputs Into
              <span className="block bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                Executive-Ready Demo Videos
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto animate-slide-up">
              Collect product highlights from your clients, let AI craft a cinematic script,
              and export professional videos tailored for CEOs, CTOs, and marketing leaders.
            </p>
          </div>
        </section>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 pb-20">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <BriefForm onSubmit={handleBriefSubmit} isLoading={isGenerating} />
        )}

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
