import { AudioManager } from '../../src/systems/AudioManager.js';

describe('AudioManager', () => {
    let audio;

    beforeEach(() => {
        audio = new AudioManager();
    });

    describe('constructor', () => {
        it('should initialize with null context', () => {
            expect(audio.ctx).toBeNull();
        });

        it('should initialize as not initialized', () => {
            expect(audio.initialized).toBe(false);
        });
    });

    describe('init', () => {
        it('should create an AudioContext', () => {
            audio.init();
            expect(audio.ctx).toBeDefined();
            expect(audio.ctx).not.toBeNull();
            expect(AudioContext).toHaveBeenCalled();
        });

        it('should set initialized to true', () => {
            audio.init();
            expect(audio.initialized).toBe(true);
        });

        it('should not create a second context if already initialized', () => {
            audio.init();
            const firstCtx = audio.ctx;
            audio.init();
            expect(audio.ctx).toBe(firstCtx);
            expect(AudioContext).toHaveBeenCalledTimes(1);
        });

        it('should handle AudioContext constructor failure gracefully', () => {
            AudioContext.mockImplementationOnce(() => {
                throw new Error('Not supported');
            });
            audio.init();
            expect(audio.initialized).toBe(false);
        });
    });

    describe('_ensureContext', () => {
        it('should call init() if not initialized', () => {
            const initSpy = vi.spyOn(audio, 'init');
            audio._ensureContext();
            expect(initSpy).toHaveBeenCalled();
        });

        it('should resume context if state is suspended', () => {
            audio.init();
            audio.ctx.state = 'suspended';
            audio._ensureContext();
            expect(audio.ctx.resume).toHaveBeenCalled();
        });

        it('should return true when context is available', () => {
            audio.init();
            expect(audio._ensureContext()).toBe(true);
        });

        it('should return false when context creation failed', () => {
            AudioContext.mockImplementationOnce(() => {
                throw new Error('Not supported');
            });
            expect(audio._ensureContext()).toBe(false);
        });
    });

    describe('sound methods', () => {
        beforeEach(() => {
            audio.init();
        });

        it('playShoot should create oscillator and gain node', () => {
            audio.playShoot();
            expect(audio.ctx.createOscillator).toHaveBeenCalled();
            expect(audio.ctx.createGain).toHaveBeenCalled();
        });

        it('playExplosion should create buffer source', () => {
            audio.playExplosion();
            expect(audio.ctx.createBufferSource).toHaveBeenCalled();
            expect(audio.ctx.createBuffer).toHaveBeenCalled();
            expect(audio.ctx.createBiquadFilter).toHaveBeenCalled();
        });

        it('playThreatDestroyed should create oscillator', () => {
            audio.playThreatDestroyed();
            expect(audio.ctx.createOscillator).toHaveBeenCalled();
        });

        it('playDeviceHit should create two oscillators', () => {
            audio.playDeviceHit();
            expect(audio.ctx.createOscillator).toHaveBeenCalledTimes(2);
            expect(audio.ctx.createGain).toHaveBeenCalledTimes(2);
        });

        it('playGameOver should create 4 oscillators', () => {
            audio.playGameOver();
            expect(audio.ctx.createOscillator).toHaveBeenCalledTimes(4);
        });

        it('playWaveComplete should create 4 oscillators', () => {
            audio.playWaveComplete();
            expect(audio.ctx.createOscillator).toHaveBeenCalledTimes(4);
        });

        it('playMenuSelect should create oscillator', () => {
            audio.playMenuSelect();
            expect(audio.ctx.createOscillator).toHaveBeenCalled();
        });
    });

    describe('guard clauses', () => {
        it.each([
            ['playShoot'],
            ['playExplosion'],
            ['playGameOver'],
        ])('%s should be a no-op when context unavailable', (method) => {
            AudioContext.mockImplementationOnce(() => {
                throw new Error('Not supported');
            });
            expect(() => audio[method]()).not.toThrow();
        });
    });
});
