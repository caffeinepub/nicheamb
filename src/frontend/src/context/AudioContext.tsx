import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type TrackName =
  | "rain"
  | "cafe"
  | "whitenoise"
  | "ambient"
  | "lofi"
  | "silence";
export type FocusMode = "deep" | "light" | "silence";

export interface AudioState {
  isPlaying: boolean;
  currentTrack: TrackName;
  volume: number;
  focusMode: FocusMode;
  masterMuted: boolean;
  intensity: number; // 0.5–1.5 gain multiplier
}

interface AudioContextValue {
  audioState: AudioState;
  playTrack: (track: TrackName) => void;
  stopAudio: () => void;
  setVolume: (v: number) => void;
  setFocusMode: (m: FocusMode) => void;
  toggleMute: () => void;
  setIntensity: (v: number) => void;
  isReady: boolean;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

// ── Noise buffer factory ─────────────────────────────────────────────────────
function createNoiseBuffer(ctx: BaseAudioContext, seconds = 2) {
  const sr = ctx.sampleRate;
  const len = sr * seconds;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function makeRain(ctx: BaseAudioContext, dest: AudioNode): () => void {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 3);
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.value = 0.25;

  // Amplitude modulation at ~0.3Hz
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.3;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start();

  return () => {
    try {
      noise.stop();
    } catch {}
    try {
      lfo.stop();
    } catch {}
  };
}

function makeCafe(ctx: BaseAudioContext, dest: AudioNode): () => void {
  const stops: (() => void)[] = [];
  const bands = [
    { freq: 300, q: 2, gain: 0.12 },
    { freq: 800, q: 3, gain: 0.08 },
    { freq: 1600, q: 4, gain: 0.05 },
  ];
  for (const b of bands) {
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 2);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = b.freq;
    filter.Q.value = b.q;
    const g = ctx.createGain();
    g.gain.value = b.gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start();
    stops.push(() => {
      try {
        src.stop();
      } catch {}
    });
  }
  return () => {
    for (const s of stops) s();
  };
}

function makeWhiteNoise(ctx: BaseAudioContext, dest: AudioNode): () => void {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, 3);
  src.loop = true;
  const g = ctx.createGain();
  g.gain.value = 0.04;
  src.connect(g);
  g.connect(dest);
  src.start();
  return () => {
    try {
      src.stop();
    } catch {}
  };
}

function makeAmbient(ctx: BaseAudioContext, dest: AudioNode): () => void {
  const freqs = [60, 80, 120];
  const oscs = freqs.map((f) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.03;
    // Slow detune drift
    const driftOsc = ctx.createOscillator();
    driftOsc.frequency.value = 0.05 + Math.random() * 0.05;
    const driftGain = ctx.createGain();
    driftGain.gain.value = 3;
    driftOsc.connect(driftGain);
    driftGain.connect(osc.detune);
    driftOsc.start();
    osc.connect(g);
    g.connect(dest);
    osc.start();
    return { osc, driftOsc };
  });
  return () => {
    for (const { osc, driftOsc } of oscs) {
      try {
        osc.stop();
      } catch {}
      try {
        driftOsc.stop();
      } catch {}
    }
  };
}

function makeLofi(ctx: BaseAudioContext, dest: AudioNode): () => void {
  // Root + major third + fifth drone
  const baseFreq = 110; // A2
  const ratios = [1, 1.26, 1.5];
  const oscs = ratios.map((r) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = baseFreq * r;
    const g = ctx.createGain();
    g.gain.value = 0.025;
    osc.connect(g);
    g.connect(dest);
    osc.start();
    return osc;
  });
  return () => {
    for (const o of oscs) {
      try {
        o.stop();
      } catch {}
    }
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AudioProvider({ children }: { children: ReactNode }) {
  const [audioState, setAudioState] = useState<AudioState>(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("nicheamb-audio")
        : null;
    const defaults: AudioState = {
      isPlaying: false,
      currentTrack: "rain",
      volume: 0.5,
      focusMode: "light",
      masterMuted: false,
      intensity: 1.0,
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved), isPlaying: false };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  const acRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackGainRef = useRef<GainNode | null>(null);
  const stopCurrentRef = useRef<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Persist non-playing settings
  useEffect(() => {
    localStorage.setItem(
      "nicheamb-audio",
      JSON.stringify({
        currentTrack: audioState.currentTrack,
        volume: audioState.volume,
        focusMode: audioState.focusMode,
        masterMuted: audioState.masterMuted,
        intensity: audioState.intensity,
      }),
    );
  }, [
    audioState.currentTrack,
    audioState.volume,
    audioState.focusMode,
    audioState.masterMuted,
    audioState.intensity,
  ]);

  const getAC = useCallback((): AudioContext => {
    if (!acRef.current || acRef.current.state === "closed") {
      acRef.current = new window.AudioContext();
      const master = acRef.current.createGain();
      master.connect(acRef.current.destination);
      masterGainRef.current = master;
      const trackGain = acRef.current.createGain();
      trackGain.connect(master);
      trackGainRef.current = trackGain;
      setIsReady(true);
    }
    return acRef.current;
  }, []);

  const applyVolume = useCallback(
    (vol: number, muted: boolean, intensity: number) => {
      if (!masterGainRef.current || !acRef.current) return;
      const effective = muted ? 0 : vol * intensity;
      masterGainRef.current.gain.setTargetAtTime(
        effective,
        acRef.current.currentTime,
        0.1,
      );
    },
    [],
  );

  const stopAudio = useCallback(() => {
    if (stopCurrentRef.current) {
      stopCurrentRef.current();
      stopCurrentRef.current = null;
    }
    if (trackGainRef.current && acRef.current) {
      const g = trackGainRef.current.gain;
      const t = acRef.current.currentTime;
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + 0.8);
    }
    setAudioState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const playTrack = useCallback(
    (track: TrackName) => {
      if (track === "silence") {
        stopAudio();
        setAudioState((s) => ({
          ...s,
          currentTrack: "silence",
          isPlaying: false,
        }));
        return;
      }

      const ctx = getAC();
      if (ctx.state === "suspended") ctx.resume();

      // Stop previous
      if (stopCurrentRef.current) {
        stopCurrentRef.current();
        stopCurrentRef.current = null;
      }

      // Create new track gain for fade
      const oldTrackGain = trackGainRef.current;
      const newTrackGain = ctx.createGain();
      newTrackGain.gain.setValueAtTime(0, ctx.currentTime);
      newTrackGain.connect(masterGainRef.current!);
      trackGainRef.current = newTrackGain;

      // Fade out old
      if (oldTrackGain) {
        oldTrackGain.gain.setValueAtTime(
          oldTrackGain.gain.value,
          ctx.currentTime,
        );
        oldTrackGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        setTimeout(() => {
          try {
            oldTrackGain.disconnect();
          } catch {}
        }, 900);
      }

      // Generate track
      let stopFn: () => void;
      if (track === "rain") stopFn = makeRain(ctx, newTrackGain);
      else if (track === "cafe") stopFn = makeCafe(ctx, newTrackGain);
      else if (track === "whitenoise")
        stopFn = makeWhiteNoise(ctx, newTrackGain);
      else if (track === "ambient") stopFn = makeAmbient(ctx, newTrackGain);
      else stopFn = makeLofi(ctx, newTrackGain); // lofi

      stopCurrentRef.current = stopFn;

      // Fade in
      newTrackGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);

      setAudioState((prev) => ({
        ...prev,
        isPlaying: true,
        currentTrack: track,
      }));

      applyVolume(
        audioState.volume,
        audioState.masterMuted,
        audioState.intensity,
      );
    },
    [
      getAC,
      stopAudio,
      applyVolume,
      audioState.volume,
      audioState.masterMuted,
      audioState.intensity,
    ],
  );

  const setVolume = useCallback(
    (v: number) => {
      setAudioState((s) => {
        applyVolume(v, s.masterMuted, s.intensity);
        return { ...s, volume: v };
      });
    },
    [applyVolume],
  );

  const toggleMute = useCallback(() => {
    setAudioState((s) => {
      applyVolume(s.volume, !s.masterMuted, s.intensity);
      return { ...s, masterMuted: !s.masterMuted };
    });
  }, [applyVolume]);

  const setFocusMode = useCallback((m: FocusMode) => {
    setAudioState((s) => ({ ...s, focusMode: m }));
  }, []);

  const setIntensity = useCallback(
    (v: number) => {
      setAudioState((s) => {
        applyVolume(s.volume, s.masterMuted, v);
        return { ...s, intensity: v };
      });
    },
    [applyVolume],
  );

  // Keep master gain in sync when volume/mute/intensity changes
  useEffect(() => {
    applyVolume(
      audioState.volume,
      audioState.masterMuted,
      audioState.intensity,
    );
  }, [
    audioState.volume,
    audioState.masterMuted,
    audioState.intensity,
    applyVolume,
  ]);

  return (
    <AudioCtx.Provider
      value={{
        audioState,
        playTrack,
        stopAudio,
        setVolume,
        setFocusMode,
        toggleMute,
        setIntensity,
        isReady,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudioContext(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudioContext must be inside AudioProvider");
  return ctx;
}
