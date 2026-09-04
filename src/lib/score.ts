/**
 * Subtle cinematic bed mixed into exported video.
 * Oscillator pad + pulse — no external assets.
 */
export function createCinematicScore(audioCtx: AudioContext): {
  destination: MediaStreamAudioDestinationNode;
  start: () => void;
  stop: () => void;
} {
  const destination = audioCtx.createMediaStreamDestination();
  const master = audioCtx.createGain();
  master.gain.value = 0.08;
  master.connect(destination);
  master.connect(audioCtx.destination);

  const pad = audioCtx.createOscillator();
  pad.type = "sine";
  pad.frequency.value = 110;

  const pad2 = audioCtx.createOscillator();
  pad2.type = "triangle";
  pad2.frequency.value = 165;

  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.45;
  pad.connect(padGain);
  pad2.connect(padGain);
  padGain.connect(master);

  const pulse = audioCtx.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 55;
  const pulseGain = audioCtx.createGain();
  pulseGain.gain.value = 0;
  pulse.connect(pulseGain);
  pulseGain.connect(master);

  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.25;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain);
  lfoGain.connect(padGain.gain);

  let pulseTimer: number | null = null;
  let started = false;

  return {
    destination,
    start() {
      if (started) return;
      started = true;
      const now = audioCtx.currentTime;
      pad.start(now);
      pad2.start(now);
      pulse.start(now);
      lfo.start(now);
      const beat = () => {
        const t = audioCtx.currentTime;
        pulseGain.gain.cancelScheduledValues(t);
        pulseGain.gain.setValueAtTime(0, t);
        pulseGain.gain.linearRampToValueAtTime(0.22, t + 0.04);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        pulseTimer = window.setTimeout(beat, 2000);
      };
      beat();
    },
    stop() {
      if (pulseTimer) window.clearTimeout(pulseTimer);
      try {
        pad.stop();
        pad2.stop();
        pulse.stop();
        lfo.stop();
      } catch {
        // already stopped
      }
      master.disconnect();
    },
  };
}
