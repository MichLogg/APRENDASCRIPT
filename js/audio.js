const Sfx = (() => {
  const TRACKS = {
    select: [{ freq: 420, time: 0.05, type: 'square', gain: 0.05 }],
    confirm: [{ freq: 620, time: 0.05, type: 'square', gain: 0.06 }],
    correct: [
      { freq: 523, time: 0.07, type: 'square', gain: 0.07 },
      { freq: 784, time: 0.1, type: 'square', gain: 0.07 }
    ],
    wrong: [
      { freq: 196, time: 0.09, type: 'sawtooth', gain: 0.06 },
      { freq: 130, time: 0.16, type: 'sawtooth', gain: 0.06 }
    ],
    start: [
      { freq: 392, time: 0.08, type: 'square', gain: 0.06 },
      { freq: 523, time: 0.08, type: 'square', gain: 0.06 },
      { freq: 784, time: 0.14, type: 'square', gain: 0.07 }
    ],
    win: [
      { freq: 523, time: 0.09, type: 'square', gain: 0.07 },
      { freq: 659, time: 0.09, type: 'square', gain: 0.07 },
      { freq: 784, time: 0.09, type: 'square', gain: 0.07 },
      { freq: 1046, time: 0.22, type: 'square', gain: 0.08 }
    ],
    lose: [
      { freq: 330, time: 0.12, type: 'triangle', gain: 0.07 },
      { freq: 247, time: 0.14, type: 'triangle', gain: 0.07 },
      { freq: 165, time: 0.3, type: 'triangle', gain: 0.07 }
    ],
    tick: [{ freq: 880, time: 0.03, type: 'square', gain: 0.03 }],
    clear: [
      { freq: 659, time: 0.05, type: 'square', gain: 0.06 },
      { freq: 880, time: 0.05, type: 'square', gain: 0.06 },
      { freq: 1174, time: 0.09, type: 'square', gain: 0.06 }
    ]
  };

  let context = null;
  let enabled = true;
  let broken = false;

  function ensureContext() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      broken = true;
      return null;
    }
    if (!context) {
      context = new Ctor();
    }
    if (context.state === 'suspended') {
      context.resume();
    }
    return context;
  }

  function play(name) {
    if (!enabled || broken) {
      return;
    }
    const track = TRACKS[name];
    if (!track) {
      return;
    }
    try {
      const audio = ensureContext();
      if (!audio) {
        return;
      }
      let cursor = audio.currentTime;
      track.forEach((note) => {
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.freq, cursor);
        volume.gain.setValueAtTime(note.gain, cursor);
        volume.gain.exponentialRampToValueAtTime(0.0001, cursor + note.time);
        oscillator.connect(volume);
        volume.connect(audio.destination);
        oscillator.start(cursor);
        oscillator.stop(cursor + note.time);
        cursor += note.time;
      });
    } catch (error) {
      broken = true;
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
  }

  function isEnabled() {
    return enabled;
  }

  return { play, setEnabled, isEnabled };
})();
