// Savoré — Dynamic Synthesized Web Audio Sound Controller

class SoundController {
  constructor() {
    this.isEnabled = false; // default mute to respect Apple UX guidelines
    this.ctx = null;
    this.cooldowns = {};
  }

  toggle(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('chef_sounds', enabled ? 'true' : 'false');
  }

  initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  canPlay(soundName, cooldownMs = 200) {
    const lastPlayed = this.cooldowns[soundName] || 0;
    const now = Date.now();
    if (now - lastPlayed < cooldownMs) {
      return false;
    }
    this.cooldowns[soundName] = now;
    return true;
  }

  playClick() {
    if (!this.isEnabled || !this.canPlay('click', 120)) return;
    try {
      this.initContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime); // Crisp Apple tap frequency
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("AudioContext failed to initialize:", e);
    }
  }

  playAddSuccess() {
    if (!this.isEnabled || !this.canPlay('add_success', 200)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.50, now); // C6 (Warm root)
      gain1.gain.setValueAtTime(0.035, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.04); // E6 (Bright major third)
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.025, now + 0.04 + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.04 + 0.18);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.04 + 0.18);
    } catch (e) {
      console.warn("Add success sound failed:", e);
    }
  }

  playPop() {
    if (!this.isEnabled || !this.canPlay('pop', 200)) return;
    try {
      this.initContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("AudioContext failed to initialize:", e);
    }
  }

  playChime() {
    if (!this.isEnabled || !this.canPlay('chime', 1000)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Premium Major Chord)
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch (e) {
      console.warn("AudioContext failed to initialize:", e);
    }
  }

  playHover() {
    if (!this.isEnabled || !this.canPlay('hover', 150)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.04);

      gain.gain.setValueAtTime(0.008, now); // soft, organic micro-tick
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn("Hover sound failed:", e);
    }
  }

  playUtensilTap() {
    if (!this.isEnabled || !this.canPlay('utensil', 1000)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2200, now); // high metallic component 1

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2850, now); // high metallic component 2

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.006, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);
    } catch (e) {
      console.warn("Utensil tap sound failed:", e);
    }
  }

  playPlate() {
    if (!this.isEnabled || !this.canPlay('plate', 2000)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(320, now); // ceramic bottom resonance

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(740, now); // harmonic ring

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.012, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Plate sound failed:", e);
    }
  }

  playSizzle() {
    if (!this.isEnabled || !this.canPlay('sizzle', 4000)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const duration = 1.0;

      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, now);

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(8000, now);
      bandpass.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.008, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noiseNode.connect(filter);
      filter.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);
    } catch (e) {
      console.warn("Sizzle sound failed:", e);
    }
  }

  playWhoosh() {
    if (!this.isEnabled || !this.canPlay('whoosh', 800)) return;
    try {
      this.initContext();
      const now = this.ctx.currentTime;
      const duration = 0.3;

      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(150, now + duration);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + duration * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + duration);
    } catch (e) {
      console.warn("Whoosh sound failed:", e);
    }
  }
}

export const soundController = new SoundController();
