import { useEffect, useRef, useState } from "react";
import type { FocusMode, TrackName } from "../context/AudioContext";
import { useAudioContext } from "../context/AudioContext";

const TRACKS: { id: TrackName; label: string }[] = [
  { id: "rain", label: "Rain" },
  { id: "cafe", label: "Café" },
  { id: "whitenoise", label: "Noise" },
  { id: "ambient", label: "Ambient" },
  { id: "lofi", label: "Lo-Fi" },
];

const FOCUS_MODES: { id: FocusMode; label: string }[] = [
  { id: "deep", label: "Deep Focus" },
  { id: "light", label: "Light Focus" },
  { id: "silence", label: "Silence" },
];

export default function SoundPanel() {
  const {
    audioState,
    playTrack,
    stopAudio,
    setVolume,
    toggleMute,
    setFocusMode,
    setIntensity,
  } = useAudioContext();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleTrackClick = (track: TrackName) => {
    if (audioState.isPlaying && audioState.currentTrack === track) {
      stopAudio();
    } else {
      playTrack(track);
    }
  };

  const handleFocusMode = (mode: FocusMode) => {
    setFocusMode(mode);
    if (mode === "silence") stopAudio();
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-6 left-6 z-50"
      style={{ userSelect: "none" }}
    >
      {open && (
        <div
          className="mb-3 rounded-xl p-4 w-72"
          style={{
            background: "#0f1720",
            border: "1px solid #1f2937",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "#4b5563" }}
            >
              Soundscape
            </span>
            <button
              type="button"
              data-ocid="sound.mute.toggle"
              onClick={toggleMute}
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{
                background: audioState.masterMuted
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(37,99,235,0.1)",
                border: `1px solid ${
                  audioState.masterMuted ? "#ef444430" : "#2563eb30"
                }`,
                color: audioState.masterMuted ? "#ef4444" : "#3b82f6",
              }}
              title={audioState.masterMuted ? "Unmute" : "Mute"}
            >
              {audioState.masterMuted ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <title>Muted</title>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <title>Sound on</title>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          </div>

          {/* Track selector */}
          <div className="mb-4">
            <div className="text-xs mb-2" style={{ color: "#4b5563" }}>
              Track
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRACKS.map((t) => {
                const active =
                  audioState.isPlaying && audioState.currentTrack === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-ocid={`sound.track.${t.id}.button`}
                    onClick={() => handleTrackClick(t.id)}
                    className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: active
                        ? "rgba(37,99,235,0.2)"
                        : "rgba(31,41,55,0.8)",
                      border: active
                        ? "1px solid #2563eb"
                        : "1px solid #1f2937",
                      color: active ? "#3b82f6" : "#9ca3af",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume */}
          <div className="mb-4">
            <div
              className="flex justify-between text-xs mb-2"
              style={{ color: "#4b5563" }}
            >
              <span>Volume</span>
              <span>{Math.round(audioState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={audioState.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="w-full h-1 rounded-full"
              style={{ accentColor: "#2563eb" }}
            />
          </div>

          {/* Focus Mode */}
          <div className="mb-4">
            <div className="text-xs mb-2" style={{ color: "#4b5563" }}>
              Focus Mode
            </div>
            <div className="flex gap-1">
              {FOCUS_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-ocid={`sound.focus_mode.${m.id}.button`}
                  onClick={() => handleFocusMode(m.id)}
                  className="flex-1 py-1.5 rounded text-xs transition-all"
                  style={{
                    background:
                      audioState.focusMode === m.id
                        ? "rgba(37,99,235,0.15)"
                        : "transparent",
                    border:
                      audioState.focusMode === m.id
                        ? "1px solid #2563eb"
                        : "1px solid #1f2937",
                    color:
                      audioState.focusMode === m.id ? "#3b82f6" : "#4b5563",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings: Intensity */}
          <div className="pt-3" style={{ borderTop: "1px solid #1f2937" }}>
            <div
              className="flex justify-between text-xs mb-2"
              style={{ color: "#4b5563" }}
            >
              <span>Intensity</span>
              <span>{audioState.intensity.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={audioState.intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              aria-label="Sound intensity"
              className="w-full h-1 rounded-full"
              style={{ accentColor: "#2563eb" }}
            />
          </div>

          {/* Play/Pause */}
          <button
            type="button"
            data-ocid="sound.playpause.button"
            onClick={() => {
              if (audioState.isPlaying) stopAudio();
              else playTrack(audioState.currentTrack);
            }}
            className="mt-4 w-full py-2 rounded text-sm font-medium transition-colors"
            style={{
              background: audioState.isPlaying
                ? "rgba(239,68,68,0.12)"
                : "rgba(37,99,235,0.15)",
              border: `1px solid ${
                audioState.isPlaying ? "#ef444430" : "#2563eb30"
              }`,
              color: audioState.isPlaying ? "#ef4444" : "#3b82f6",
            }}
          >
            {audioState.isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        data-ocid="sound.panel.open_modal_button"
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: audioState.isPlaying ? "rgba(37,99,235,0.2)" : "#0f1720",
          border: `1px solid ${audioState.isPlaying ? "#2563eb" : "#1f2937"}`,
          boxShadow: audioState.isPlaying
            ? "0 0 16px rgba(37,99,235,0.35)"
            : "none",
          color: audioState.isPlaying ? "#3b82f6" : "#4b5563",
        }}
        title="Soundscape"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <title>Soundscape</title>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>
    </div>
  );
}
