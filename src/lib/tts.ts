import type { Character } from "@/types";
import { characterVoiceURI } from "./storage";

const RATE: Record<Character["voice"], number> = {
  narrator: 1,
  warm: 0.96,
  sharp: 1.08,
  deep: 0.9,
  bright: 1.12,
};

const PITCH: Record<Character["voice"], number> = {
  narrator: 1,
  warm: 1.05,
  sharp: 1.15,
  deep: 0.8,
  bright: 1.2,
};

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function cancelSpeech(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export async function speakLine(text: string, character?: Character): Promise<void> {
  if (!speechSupported() || !text.trim()) return;

  await new Promise<void>((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (character) {
      const uri = characterVoiceURI(character, voices);
      const match = voices.find((voice) => voice.voiceURI === uri);
      if (match) utter.voice = match;
      utter.rate = RATE[character.voice];
      utter.pitch = PITCH[character.voice];
    }
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}
