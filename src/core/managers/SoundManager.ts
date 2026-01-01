class SoundSys {
    private ctx: AudioContext;
    private masterGain: GainNode;

    constructor() {
        // Initialize AudioContext
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Main volume
        this.masterGain.connect(this.ctx.destination);
    }

    // Generate White Noise Buffer
    private createNoiseBuffer(): AudioBuffer {
        const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playGlassBreak(pitch: number = 1.0) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const gain = this.ctx.createGain();
        // Envelope: Sharp attack, fast decay
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        // Filter: High pass for "glassy" bright sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(2000, t);
        filter.Q.value = 10;

        // Pitch variation
        noise.playbackRate.value = 1.0 + (Math.random() * 0.5) + (pitch - 1) * 0.2;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(t + 0.5);
    }

    playIceBreak(pitch: number = 1.0) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const gain = this.ctx.createGain();
        // Envelope: Slower attack/decay than glass
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        // Filter: Low pass for "thud/crunch" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, t);

        noise.playbackRate.value = 0.8 + (Math.random() * 0.2) + (pitch - 1) * 0.2;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(t + 0.6);
    }

    playGameOver() {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        // 1. Low Thud (Sine)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(t + 0.8);

        // 2. Crash Noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const nGain = this.ctx.createGain();
        const nFilter = this.ctx.createBiquadFilter();

        nFilter.type = "lowpass";
        nFilter.frequency.setValueAtTime(1000, t);
        nFilter.frequency.exponentialRampToValueAtTime(100, t + 0.5);

        nGain.gain.setValueAtTime(0.5, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.masterGain);

        noise.start();
        noise.stop(t + 0.6);
    }
}

export const soundManager = new SoundSys();
