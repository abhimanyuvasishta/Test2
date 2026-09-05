"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aspectCss, exportEpisode, renderShot } from "@/lib/video-renderer";
import { cancelSpeech, speakLine, speechSupported } from "@/lib/tts";
import type { Production } from "@/types";

interface VideoStudioProps {
  production: Production;
  onBack: () => void;
}

export default function VideoStudio({ production, onBack }: VideoStudioProps) {
  const { bible, episode, source } = production;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0.4);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(speechSupported());
  const raf = useRef<number | null>(null);
  const playingRef = useRef(false);

  const paint = useCallback(
    (index: number, amount: number) => {
      const canvas = canvasRef.current;
      const shot = episode.shots[index];
      if (!canvas || !shot) return;
      renderShot(canvas, bible, shot, amount);
    },
    [bible, episode.shots]
  );

  useEffect(() => {
    paint(active, progress);
  }, [active, progress, paint]);

  useEffect(() => {
    return () => {
      cancelSpeech();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [downloadUrl]);

  const stop = () => {
    playingRef.current = false;
    setPlaying(false);
    cancelSpeech();
    if (raf.current) cancelAnimationFrame(raf.current);
  };

  const play = async () => {
    if (playing) {
      stop();
      return;
    }
    playingRef.current = true;
    setPlaying(true);
    setError(null);
    for (let index = 0; index < episode.shots.length; index++) {
      if (!playingRef.current) return;
      const shot = episode.shots[index];
      setActive(index);
      setProgress(0);
      paint(index, 0);
      const speaker = bible.characters.find((character) => character.id === shot.speakerId);
      const started = performance.now();
      if (voiceOn && shot.line) {
        const speaking = speakLine(shot.line, speaker);
        const animate = (now: number) => {
          if (!playingRef.current) return;
          const amount = Math.min((now - started) / shot.durationMs, 1);
          setProgress(amount);
          paint(index, amount);
          if (amount < 1) raf.current = requestAnimationFrame(animate);
        };
        raf.current = requestAnimationFrame(animate);
        await speaking;
        if (!playingRef.current) return;
      } else {
        await new Promise<void>((resolve) => {
          const animate = (now: number) => {
            if (!playingRef.current) {
              resolve();
              return;
            }
            const amount = Math.min((now - started) / shot.durationMs, 1);
            setProgress(amount);
            paint(index, amount);
            if (amount >= 1) resolve();
            else raf.current = requestAnimationFrame(animate);
          };
          raf.current = requestAnimationFrame(animate);
        });
      }
    }
    if (!playingRef.current) return;
    stop();
    setActive(0);
    setProgress(0.4);
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas || exporting) return;
    stop();
    setExporting(true);
    setExportProgress(0);
    setError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    try {
      const blob = await exportEpisode({
        canvas,
        bible,
        shots: episode.shots,
        onProgress: setExportProgress,
        onShotChange: setActive,
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${episode.title.replace(/\s+/g, "-").toLowerCase()}.webm`;
      link.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Studio</h2>
          <p className="text-sm text-white/50 mt-1">
            {episode.title} · {Math.round(episode.totalDurationMs / 1000)}s · {source === "ai" ? "AI" : "Template"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
          {speechSupported() && (
            <button onClick={() => setVoiceOn((value) => !value)} className="btn-secondary">
              Voice {voiceOn ? "on" : "off"}
            </button>
          )}
          <button onClick={play} disabled={exporting} className="btn-secondary">
            {playing ? "Stop" : "Play"}
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting ? `Exporting ${Math.round(exportProgress * 100)}%` : "Export WebM"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-4">
          <div className={`relative rounded-xl overflow-hidden bg-black ${aspectCss(bible.aspect)}`}>
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>
          {downloadUrl && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <p className="text-emerald-300 text-sm">Exported. Captions are burned in.</p>
              <a href={downloadUrl} download className="btn-secondary text-sm">
                Download again
              </a>
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </div>
        <div className="glass-panel p-5">
          <h3 className="font-display font-bold mb-3">Shots</h3>
          <div className="space-y-2 max-h-[560px] overflow-y-auto">
            {episode.shots.map((shot, index) => (
              <button
                key={shot.id}
                onClick={() => {
                  stop();
                  setActive(index);
                  setProgress(0.45);
                }}
                className={`w-full text-left p-3 rounded-xl border ${
                  active === index ? "border-brand-400/40 bg-brand-500/15" : "border-transparent bg-white/5"
                }`}
              >
                <p className="text-xs text-white/40 uppercase">
                  {index + 1} · {shot.type}
                </p>
                <p className="text-sm font-medium truncate">{shot.onScreen}</p>
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress * 100}
            className="w-full mt-4 accent-brand-500"
            onChange={(event) => {
              stop();
              setProgress(Number(event.target.value) / 100);
            }}
          />
        </div>
      </div>
    </div>
  );
}
