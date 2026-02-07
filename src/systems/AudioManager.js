// Procedural audio using Web Audio API
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not available:', e);
        }
    }

    _ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.initialized;
    }

    // Short rising tone
    playShoot() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;
        const end = now + 0.15;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(end);
    }

    // White noise burst with decay
    playExplosion() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;
        const duration = 0.3;
        const end = now + duration;
        const sampleRate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }

        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(200, end);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    // Satisfying pop
    playThreatDestroyed() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;
        const end = now + 0.15;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(end);
    }

    // Low thud + alarm
    playDeviceHit() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;

        // Thud
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        const end1 = now + 0.3;
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(80, now);
        osc1.frequency.exponentialRampToValueAtTime(40, end1);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, end1);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(end1);

        // Alarm beep
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        const end2 = now + 0.4;
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(880, now + 0.1);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.1, now + 0.1);
        gain2.gain.setValueAtTime(0, now + 0.2);
        gain2.gain.setValueAtTime(0.1, now + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.001, end2);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(end2);
    }

    // Descending tone sequence
    playGameOver() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;
        const notes = [523, 440, 349, 262];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.25;
            const end = t + 0.3;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(end);
        });
    }

    // Rising arpeggio
    playWaveComplete() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;
        const notes = [262, 330, 392, 523];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.1;
            const end = t + 0.25;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(end);
        });
    }

    // Click/beep for menu
    playMenuSelect() {
        if (!this._ensureContext()) return;
        const now = this.ctx.currentTime;
        const end = now + 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(end);
    }
}
