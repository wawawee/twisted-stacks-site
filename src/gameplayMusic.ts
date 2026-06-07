import { clamp } from "./math";

export interface MusicTone {
  frequency: number;
  duration: number;
  gain: number;
  waveType: OscillatorType;
}

export interface MusicTickResult {
  tones: MusicTone[];
  nextTickAt: number;
  nextMusicStep: number;
}

export function computeMusicTick(
  timeNow: number,
  nextMusicTickAt: number,
  currentLevel: number,
  maxLevel: number,
  currentSpeed: number,
  baseSpeed: number,
  musicStep: number,
  harmonicScale: number[],
): MusicTickResult | null {
  if (timeNow < nextMusicTickAt) return null;

  const levelPressure = clamp((currentLevel - 1) / (maxLevel - 1), 0, 1);
  const speedPressure = clamp((currentSpeed - baseSpeed) / 1200, 0, 1);
  const interval = Math.max(92, 330 - levelPressure * 105 - speedPressure * 120);

  const scaleIndex = (musicStep + currentLevel) % harmonicScale.length;
  const note = harmonicScale[scaleIndex] * (musicStep % 8 === 0 ? 0.5 : 1);
  const gain = 0.006 + levelPressure * 0.006;
  const tones: MusicTone[] = [{
    frequency: note,
    duration: 0.035 + speedPressure * 0.025,
    gain,
    waveType: musicStep % 4 === 0 ? "triangle" : "sine",
  }];

  if (musicStep % 8 === 0) {
    tones.push({
      frequency: harmonicScale[(scaleIndex + 3) % harmonicScale.length] * 0.5,
      duration: 0.07,
      gain: gain * 0.8,
      waveType: "triangle",
    });
  }

  return {
    tones,
    nextTickAt: timeNow + interval,
    nextMusicStep: musicStep + 1,
  };
}
