class SoundSys {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private bgmNode: AudioBufferSourceNode | null = null;
    private bgmGain: GainNode | null = null;
    private technoBuffer: AudioBuffer | null = null;
    private cachedNoiseBuffer: AudioBuffer | null = null;

    constructor() {
        // Initialize AudioContext
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5; // Main volume
        this.masterGain.connect(this.ctx.destination);

        // Pre-generate BGM
        this.technoBuffer = this.createTechnoBuffer();
    }

    // Generate White Noise Buffer (Cached)
    private getNoiseBuffer(): AudioBuffer {
        if (this.cachedNoiseBuffer) return this.cachedNoiseBuffer;

        const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.cachedNoiseBuffer = buffer;
        return buffer;
    }

    private createTechnoBuffer(): AudioBuffer {
        const sampleRate = this.ctx.sampleRate;
        const bpm = 135;
        const beatDur = 60 / bpm;
        const barDur = beatDur * 4;
        const length = Math.floor(sampleRate * barDur);
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Helper to add Sine Kick
        const addKick = (time: number) => {
            const start = Math.floor(time * sampleRate);
            const duration = 0.2;
            const len = Math.floor(duration * sampleRate);
            for (let i = 0; i < len; i++) {
                if (start + i >= length) break;
                const t = i / sampleRate;
                // Freq drop 150 -> 40
                const freq = 150 * Math.exp(-t * 20) + 40;
                const amp = Math.exp(-t * 10);
                data[start + i] += Math.sin(2 * Math.PI * freq * t) * amp * 0.8;
            }
        };

        // Helper to add HiHat (Noise)
        const addHat = (time: number) => {
            const start = Math.floor(time * sampleRate);
            const duration = 0.05;
            const len = Math.floor(duration * sampleRate);
            for (let i = 0; i < len; i++) {
                if (start + i >= length) break;
                const t = i / sampleRate;
                const noise = Math.random() * 2 - 1;
                const amp = Math.exp(-t * 50);
                // Simple Highpass via difference ?? No, just raw noise is fine for "click" or simple buffering
                // Let's just add raw noise with steep decay
                data[start + i] += noise * amp * 0.3;
            }
        };

        // Helper to add Bass (Tech Saw)
        const addBass = (time: number, freq: number) => {
            const start = Math.floor(time * sampleRate);
            const duration = 0.2;
            const len = Math.floor(duration * sampleRate);
            for (let i = 0; i < len; i++) {
                if (start + i >= length) break;
                const t = i / sampleRate;
                // Sawtooth approximation
                const saw = (t * freq) % 1.0 - 0.5;
                const amp = Math.min(t * 50, 1) * Math.exp(-t * 5); // Attack Release
                data[start + i] += saw * amp * 0.3;
            }
        };

        // 4/4 Beat
        for (let i = 0; i < 4; i++) {
            const beatTime = i * beatDur;
            addKick(beatTime);
            addHat(beatTime + beatDur / 2); // Off beat

            // Bass pattern: 16th notes fast sequence
            const sixteenth = beatDur / 4;
            addBass(beatTime + sixteenth * 2, 55); // F1ish
            addBass(beatTime + sixteenth * 3, 55);
        }

        // Clip / Limiter
        for (let i = 0; i < length; i++) {
            if (data[i] > 1) data[i] = 1;
            if (data[i] < -1) data[i] = -1;
        }

        return buffer;
    }

    playBGM() {
        if (this.bgmNode) return; // Already playing
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (!this.technoBuffer) {
            this.technoBuffer = this.createTechnoBuffer();
        }

        this.bgmNode = this.ctx.createBufferSource();
        this.bgmNode.buffer = this.technoBuffer;
        this.bgmNode.loop = true;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.4;

        // Lowpass filter for BGM to sit behind SE
        const biquad = this.ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        biquad.frequency.value = 2000;

        this.bgmNode.connect(biquad);
        biquad.connect(this.bgmGain);
        this.bgmGain.connect(this.masterGain);

        this.bgmNode.start();
    }

    setPaused(paused: boolean) {
        if (paused) {
            this.ctx.suspend().catch(() => { });
        } else {
            this.ctx.resume().catch(() => { });
        }
    }

    setBGMPlaybackRate(rate: number) {
        if (this.bgmNode) {
            // Allow 0 for pausing, otherwise clamp between 0.5 and 2.0
            const finalRate = rate === 0 ? 0 : Math.max(0.5, Math.min(rate, 2.0));
            this.bgmNode.playbackRate.setValueAtTime(finalRate, this.ctx.currentTime);
        }
    }

    stopBGM() {
        if (this.bgmNode) {
            try {
                this.bgmNode.stop();
            } catch (e) { } // prevent error if already stopped
            this.bgmNode.disconnect();
            this.bgmNode = null;
        }
        if (this.bgmGain) {
            this.bgmGain.disconnect();
            this.bgmGain = null;
        }
    }

    playGlassBreak(pitch: number = 1.0) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer();

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
        noise.buffer = this.getNoiseBuffer();

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
        noise.buffer = this.getNoiseBuffer();
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
