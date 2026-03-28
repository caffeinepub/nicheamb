// Micro sound effects using Web Audio API — all extremely low volume
let _ac: AudioContext | null = null;

function getAC(): AudioContext | null {
  try {
    if (!_ac || _ac.state === "closed") {
      _ac = new window.AudioContext();
    }
    if (_ac.state === "suspended") _ac.resume();
    return _ac;
  } catch {
    return null;
  }
}

function playSine(
  freq: number,
  gainVal: number,
  duration: number,
  type: OscillatorType = "sine",
) {
  const ac = getAC();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gainVal, ac.currentTime + 0.005);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration + 0.01);
}

export function playClick() {
  playSine(800, 0.05, 0.05);
}

export function playTick() {
  playSine(1200, 0.06, 0.08);
}

export function playChime() {
  playSine(880, 0.08, 0.5);
  setTimeout(() => playSine(1100, 0.06, 0.4), 80);
}

export function playTone() {
  playSine(660, 0.06, 0.8);
}
