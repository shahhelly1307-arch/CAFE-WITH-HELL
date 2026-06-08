/**
 * Procedural Nature Sound Synthesizer using Web Audio API
 * Generates wind, leaf rustles, bird chirping, and a realistic roaring waterfall.
 */

class NatureAudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.windNode = null;
        this.rustleNode = null;
        this.waterfallNode = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.birdInterval = null;
        
        // UI elements
        this.toggleBtn = document.getElementById('sound-toggle');
        this.statusText = document.getElementById('sound-status-text');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const startOnGesture = () => {
            if (!this.ctx) {
                this.initAudioContext();
            }
            document.removeEventListener('click', startOnGesture);
            document.removeEventListener('scroll', startOnGesture);
        };
        document.addEventListener('click', startOnGesture);
        document.addEventListener('scroll', startOnGesture);

        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.ctx) {
                this.initAudioContext();
            }
            this.toggleSound();
        });
    }

    initAudioContext() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // --- 1. WHITE NOISE BUFFER (For wind/rustle) ---
        const sampleRate = this.ctx.sampleRate;
        const bufferSize = 2 * sampleRate;
        const whiteNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const whiteOutput = whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            whiteOutput[i] = Math.random() * 2 - 1;
        }

        // --- 2. PINK NOISE BUFFER (For realistic waterfall roar) ---
        // Pink noise has a 1/f spectral density profile (softer and deeper than white noise)
        const pinkNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const pinkOutput = pinkNoiseBuffer.getChannelData(0);
        
        // Paul Kellet's refined 1/f approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            pinkOutput[i] = pink * 0.11; // Normalize scale
        }

        // --- 3. WIND SYNTHESIS ---
        const windSource = this.ctx.createBufferSource();
        windSource.buffer = whiteNoiseBuffer;
        windSource.loop = true;

        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
        windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        const windGain = this.ctx.createGain();
        windGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.masterGain);
        windSource.start(0);

        // Slow LFO for wind gust modulations
        const windLfo = this.ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.04, this.ctx.currentTime);
        
        const windLfoGain = this.ctx.createGain();
        windLfoGain.gain.setValueAtTime(150, this.ctx.currentTime);

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);
        windLfo.start(0);

        // --- 4. LEAF RUSTLE SYNTHESIS ---
        const rustleSource = this.ctx.createBufferSource();
        rustleSource.buffer = whiteNoiseBuffer;
        rustleSource.loop = true;

        const rustleFilter = this.ctx.createBiquadFilter();
        rustleFilter.type = 'highpass';
        rustleFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
        
        const rustleGain = this.ctx.createGain();
        rustleGain.gain.setValueAtTime(0.018, this.ctx.currentTime);

        rustleSource.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(this.masterGain);
        rustleSource.start(0);

        // Modulate leaves rustling in sync with wind gusts
        const rustleModulator = this.ctx.createGain();
        rustleModulator.gain.setValueAtTime(0.012, this.ctx.currentTime);
        windLfoGain.connect(rustleModulator.gain);

        // --- 5. WATERFALL SYNTHESIS (Dual-filter Pink Noise) ---
        const waterSource = this.ctx.createBufferSource();
        waterSource.buffer = pinkNoiseBuffer;
        waterSource.loop = true;

        // Branch A: Deep rumble (Lowpass)
        const waterRumbleFilter = this.ctx.createBiquadFilter();
        waterRumbleFilter.type = 'lowpass';
        waterRumbleFilter.frequency.setValueAtTime(750, this.ctx.currentTime); // Deep rumbling

        const waterRumbleGain = this.ctx.createGain();
        waterRumbleGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

        waterSource.connect(waterRumbleFilter);
        waterRumbleFilter.connect(waterRumbleGain);
        waterRumbleGain.connect(this.masterGain);

        // Branch B: High splash spray (Bandpass)
        const waterSplashFilter = this.ctx.createBiquadFilter();
        waterSplashFilter.type = 'bandpass';
        waterSplashFilter.frequency.setValueAtTime(2000, this.ctx.currentTime); // High-frequency splattering
        waterSplashFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

        const waterSplashGain = this.ctx.createGain();
        waterSplashGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        waterSource.connect(waterSplashFilter);
        waterSplashFilter.connect(waterSplashGain);
        waterSplashGain.connect(this.masterGain);

        waterSource.start(0);
    }

    // --- BIRD CHIRP SYNTHESIS ---
    playSingleBirdChirp(startTime, frequencyStart, frequencyEnd, duration) {
        if (!this.ctx || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequencyStart, startTime);
        osc.frequency.exponentialRampToValueAtTime(frequencyEnd, startTime + duration);

        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + duration * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playBirdCall() {
        if (!this.isPlaying) return;

        const now = this.ctx.currentTime;
        const callType = Math.random();
        
        if (callType < 0.33) {
            this.playSingleBirdChirp(now, 2200, 3200, 0.08);
            this.playSingleBirdChirp(now + 0.15, 2300, 3300, 0.08);
        } else if (callType < 0.66) {
            this.playSingleBirdChirp(now, 3800, 2800, 0.12);
            this.playSingleBirdChirp(now + 0.2, 3600, 2600, 0.12);
            this.playSingleBirdChirp(now + 0.4, 3400, 2400, 0.12);
        } else {
            this.playSingleBirdChirp(now, 3000, 3500, 0.04);
            this.playSingleBirdChirp(now + 0.06, 3100, 3600, 0.04);
            this.playSingleBirdChirp(now + 0.12, 3200, 3700, 0.04);
            this.playSingleBirdChirp(now + 0.3, 2200, 3800, 0.15);
        }
    }

    startBirdScheduling() {
        const scheduleNext = () => {
            if (!this.isPlaying) return;
            const delay = 3000 + Math.random() * 5000;
            this.birdInterval = setTimeout(() => {
                this.playBirdCall();
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }

    stopBirdScheduling() {
        if (this.birdInterval) {
            clearTimeout(this.birdInterval);
            this.birdInterval = null;
        }
    }

    toggleSound() {
        if (this.isPlaying) {
            this.masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
            setTimeout(() => {
                if (!this.isPlaying) this.ctx.suspend();
            }, 600);
            
            this.isPlaying = false;
            this.stopBirdScheduling();
            this.toggleBtn.classList.remove('playing');
            this.statusText.innerText = 'Sounds: Off';
        } else {
            this.ctx.resume();
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
            this.masterGain.gain.exponentialRampToValueAtTime(1.0, this.ctx.currentTime + 0.8);
            
            this.isPlaying = true;
            this.startBirdScheduling();
            this.toggleBtn.classList.add('playing');
            this.statusText.innerText = 'Sounds: On';
            
            setTimeout(() => this.playBirdCall(), 200);
        }
    }
}

const natureAudio = new NatureAudioSynthesizer();
window.natureAudio = natureAudio;
