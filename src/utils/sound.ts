let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', volume = 0.06, delaySec = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.02);
  } catch {
    // Audio playback ignored if blocked by browser policy
  }
}

export function playTickSound(enabled: boolean) {
  if (!enabled) return;
  playTone(880, 0.07, 'triangle', 0.045);
}

export function playSelectSound(enabled: boolean) {
  if (!enabled) return;
  playTone(520, 0.06, 'sine', 0.04);
}

export function playAutoAdvanceSound(enabled: boolean) {
  if (!enabled) return;
  playTone(440, 0.09, 'sine', 0.05, 0);
  playTone(620, 0.12, 'sine', 0.05, 0.08);
}

export function playTimeoutSound(enabled: boolean) {
  if (!enabled) return;
  playTone(330, 0.12, 'triangle', 0.06, 0);
  playTone(260, 0.16, 'triangle', 0.05, 0.11);
}

export function playCompleteSound(enabled: boolean) {
  if (!enabled) return;
  playTone(523.25, 0.12, 'sine', 0.05, 0);
  playTone(659.25, 0.12, 'sine', 0.05, 0.1);
  playTone(783.99, 0.22, 'sine', 0.06, 0.2);
}
