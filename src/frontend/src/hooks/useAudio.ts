// No-op stub
export type TrackName = "rain" | "cafe" | "lofi" | "white-noise";
export interface AudioState {
  isPlaying: boolean;
  currentTrack: TrackName | null;
  volume: number;
  isMuted: boolean;
}

export function useAudio() {
  const noop = () => {};
  return {
    audioState: {
      isPlaying: false,
      currentTrack: null as TrackName | null,
      volume: 0.4,
      isMuted: false,
    },
    playTrack: noop,
    stopAudio: noop,
    setMasterVolume: noop,
    toggleMute: noop,
    playClick: noop,
    playChime: noop,
    playTick: noop,
    playComplete: noop,
  };
}
