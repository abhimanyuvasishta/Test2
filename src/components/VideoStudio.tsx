"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientBrief, VideoScript } from "@/types";
import { exportVideo, previewScene } from "@/lib/video-renderer";
import { formatDuration } from "@/lib/director";

interface VideoStudioProps {
  brief: ClientBrief;
  script: VideoScript;
  source: "ai" | "template";
  onBack: () => void;
}

export default function VideoStudio({ brief, script, source, onBack }: VideoStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0.45);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  const filmProgressFor = useCallback(
    (sceneIndex: number, localProgress: number) => {
      const elapsed =
        script.scenes.slice(0, sceneIndex).reduce((sum, s) => sum + s.durationMs, 0) +
        script.scenes[sceneIndex].durationMs * localProgress;
      return elapsed / script.totalDurationMs;
    },
    [script.scenes, script.totalDurationMs]
  );

  const renderPreview = useCallback(
    (sceneIndex: number, progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !script.scenes[sceneIndex]) return;
      previewScene(
        canvas,
        brief,
        script.scenes[sceneIndex],
        progress,
        sceneIndex,
        script.scenes.length,
        filmProgressFor(sceneIndex, progress)
      );
    },
    [brief, filmProgressFor, script.scenes]
  );

  useEffect(() => {
    if (!isPlaying) {
      renderPreview(activeScene, previewProgress);
    }
  }, [activeScene, previewProgress, renderPreview, isPlaying]);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [downloadUrl]);

  const stopPlayback = () => {
    playingRef.current = false;
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const playPreview = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);
    let sceneIdx = 0;
    let startTime = performance.now();

    const animate = (now: number) => {
      if (!playingRef.current) return;
      const duration = script.scenes[sceneIdx].durationMs;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setActiveScene(sceneIdx);
      setPreviewProgress(progress);
      renderPreview(sceneIdx, progress);

      if (progress >= 1) {
        sceneIdx += 1;
        if (sceneIdx >= script.scenes.length) {
          stopPlayback();
          setActiveScene(0);
          setPreviewProgress(0);
          renderPreview(0, 0);
          return;
        }
        startTime = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;

    stopPlayback();
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const blob = await exportVideo({
        canvas,
        brief,
        scenes: script.scenes,
        withScore: true,
        onProgress: setExportProgress,
        onSceneChange: setActiveScene,
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${brief.productName.replace(/\s+/g, "-").toLowerCase()}-executive-film.webm`;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      setExportError(
        err instanceof Error
          ? err.message
          : "Video export failed. Use Chrome or Edge, then play the film once before exporting."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Film studio</h2>
          <p className="text-white/50 text-sm mt-1">
            {script.title} · {formatDuration(script.totalDurationMs)} ·{" "}
            {source === "ai" ? "GPT-directed" : "Director engine"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onBack} className="btn-secondary">
            Back to script
          </button>
          <button onClick={playPreview} disabled={isExporting} className="btn-secondary">
            {isPlaying ? "Stop" : "Play film"}
          </button>
          <button onClick={handleExport} disabled={isExporting} className="btn-primary">
            {isExporting ? (
              <>
                <Spinner />
                Recording {Math.round(exportProgress * 100)}%
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export WebM
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-panel p-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-2xl shadow-black/40">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: "auto" }}
              />
              {isExporting && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                        style={{ width: `${exportProgress * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-white/70">
                      Recording scene {activeScene + 1} of {script.scenes.length}...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {downloadUrl && !isExporting && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <p className="text-emerald-300 text-sm">Film recorded. WebM is ready for the briefing room.</p>
              <a href={downloadUrl} download className="btn-secondary text-sm">
                Download again
              </a>
            </div>
          )}
          {exportError && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {exportError}
            </div>
          )}
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-display font-bold mb-4">Scenes</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {script.scenes.map((scene, index) => (
              <button
                key={scene.id}
                onClick={() => {
                  stopPlayback();
                  setActiveScene(index);
                  setPreviewProgress(0.45);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  activeScene === index
                    ? "bg-brand-500/20 border border-brand-500/40"
                    : "bg-surface-700/20 border border-transparent hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-white/30 capitalize">{scene.type}</span>
                  <span className="text-xs text-white/20 ml-auto">
                    {(scene.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{scene.headline}</p>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className="text-xs text-white/40 mb-2 block">Scene progress</label>
            <input
              type="range"
              min="0"
              max="100"
              value={previewProgress * 100}
              onChange={(e) => {
                stopPlayback();
                setPreviewProgress(Number(e.target.value) / 100);
              }}
              className="w-full accent-brand-500"
            />
          </div>
        </div>
      </div>
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
