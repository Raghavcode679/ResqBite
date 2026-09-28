// Web Audio API chime sound generator - no external assets required
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playUrgentAlertChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Two-tone attention chime (A5 -> E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15);
    
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second echo tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.35);

    gain2.gain.setValueAtTime(0.08, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.debug('Audio chime suppressed by browser policy:', e);
  }
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    console.debug('Audio chime suppressed by browser policy:', e);
  }
}

/**
 * Classic telephone-style RING RING for critical notifications:
 * two rapid bursts of alternating dual-tone ringing, repeated once,
 * unmistakably louder and more insistent than the regular chime.
 */
export function playRingRingAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // One "ring" burst = 0.55s of fast 20Hz amplitude modulation over a
    // classic bell duo (1000 Hz + 1250 Hz), like an old telephone bell.
    const ring = (startAt: number) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      // 20 Hz trill envelope
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'square';
      lfo.frequency.value = 20;
      lfoGain.gain.value = 0.075;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      // baseline so the trill oscillates around it
      gain.gain.setValueAtTime(0.075, startAt);
      gain.gain.setValueAtTime(0, startAt + 0.55);

      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = 1000;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = 1250;

      o1.connect(gain);
      o2.connect(gain);
      gain.connect(ctx.destination);

      lfo.start(startAt);
      lfo.stop(startAt + 0.55);
      o1.start(startAt);
      o1.stop(startAt + 0.55);
      o2.start(startAt);
      o2.stop(startAt + 0.55);
    };

    // RING ... RING ... (two bursts, classic cadence)
    ring(now + 0.02);
    ring(now + 0.72);
  } catch (e) {
    console.debug('Ring alert suppressed by browser policy:', e);
  }
}
