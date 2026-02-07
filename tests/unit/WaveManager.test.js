import { WaveManager } from '../../src/systems/WaveManager.js';
import { CONFIG } from '../../src/config.js';

describe('WaveManager', () => {
    let wm;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            time: {
                delayedCall: vi.fn((delay, callback) => ({
                    destroy: vi.fn(),
                    callback,
                    delay,
                })),
            },
            spawnThreat: vi.fn(),
            onWaveComplete: vi.fn(),
        };
        wm = new WaveManager(mockScene);
    });

    describe('constructor', () => {
        it('should initialize wave to 0', () => {
            expect(wm.wave).toBe(0);
        });

        it('should store scene reference', () => {
            expect(wm.scene).toBe(mockScene);
        });

        it('should set waveActive and betweenWaves to false', () => {
            expect(wm.waveActive).toBe(false);
            expect(wm.betweenWaves).toBe(false);
        });

        it('should initialize threatsRemaining and threatsSpawned to 0', () => {
            expect(wm.threatsRemaining).toBe(0);
            expect(wm.threatsSpawned).toBe(0);
        });
    });

    describe('getSpawnDelay', () => {
        it('should return BASE_SPAWN_DELAY for wave 0', () => {
            wm.wave = 0;
            expect(wm.getSpawnDelay()).toBe(CONFIG.THREATS.BASE_SPAWN_DELAY);
        });

        it('should decrease by SPAWN_DELAY_DECREMENT per wave', () => {
            wm.wave = 5;
            const expected = CONFIG.THREATS.BASE_SPAWN_DELAY - 5 * CONFIG.THREATS.SPAWN_DELAY_DECREMENT;
            expect(wm.getSpawnDelay()).toBe(expected);
        });

        it('should clamp to MIN_SPAWN_DELAY for high waves', () => {
            wm.wave = 100;
            expect(wm.getSpawnDelay()).toBe(CONFIG.THREATS.MIN_SPAWN_DELAY);
        });

        it.each([
            [1, 2000 - 100],
            [5, 2000 - 500],
            [10, 2000 - 1000],
            [16, 400],
            [20, 400],
        ])('wave %i should have spawn delay %i', (wave, expected) => {
            wm.wave = wave;
            expect(wm.getSpawnDelay()).toBe(expected);
        });
    });

    describe('getThreatSpeed', () => {
        it('should return BASE_SPEED for wave 0', () => {
            wm.wave = 0;
            expect(wm.getThreatSpeed()).toBe(CONFIG.THREATS.BASE_SPEED);
        });

        it('should increase by SPEED_INCREMENT per wave', () => {
            wm.wave = 3;
            const expected = CONFIG.THREATS.BASE_SPEED + 3 * CONFIG.THREATS.SPEED_INCREMENT;
            expect(wm.getThreatSpeed()).toBe(expected);
        });

        it.each([
            [1, 80 + 25],
            [5, 80 + 125],
            [10, 80 + 250],
            [20, 80 + 500],
        ])('wave %i should have speed %i', (wave, expected) => {
            wm.wave = wave;
            expect(wm.getThreatSpeed()).toBe(expected);
        });
    });

    describe('getThreatCount', () => {
        it('should return BASE_PER_WAVE for wave 0', () => {
            wm.wave = 0;
            expect(wm.getThreatCount()).toBe(CONFIG.THREATS.BASE_PER_WAVE);
        });

        it('should increase by PER_WAVE_INCREMENT per wave', () => {
            wm.wave = 4;
            const expected = CONFIG.THREATS.BASE_PER_WAVE + 4 * CONFIG.THREATS.PER_WAVE_INCREMENT;
            expect(wm.getThreatCount()).toBe(expected);
        });

        it.each([
            [1, 5 + 2],
            [5, 5 + 10],
            [10, 5 + 20],
        ])('wave %i should have %i threats', (wave, expected) => {
            wm.wave = wave;
            expect(wm.getThreatCount()).toBe(expected);
        });
    });

    describe('startNextWave', () => {
        it('should increment wave number', () => {
            wm.startNextWave();
            expect(wm.wave).toBe(1);
        });

        it('should set threatsPerWave from getThreatCount', () => {
            wm.startNextWave();
            expect(wm.threatsPerWave).toBe(wm.getThreatCount());
        });

        it('should reset threatsSpawned to 0', () => {
            wm.threatsSpawned = 5;
            wm.startNextWave();
            expect(wm.threatsSpawned).toBe(0);
        });

        it('should set threatsRemaining to threatsPerWave', () => {
            wm.startNextWave();
            expect(wm.threatsRemaining).toBe(wm.threatsPerWave);
        });

        it('should set waveActive to true and betweenWaves to false', () => {
            wm.betweenWaves = true;
            wm.startNextWave();
            expect(wm.waveActive).toBe(true);
            expect(wm.betweenWaves).toBe(false);
        });

        it('should schedule spawn via scene.time.delayedCall', () => {
            wm.startNextWave();
            expect(mockScene.time.delayedCall).toHaveBeenCalled();
        });
    });

    describe('_scheduleSpawn', () => {
        it('should not schedule if all threats already spawned', () => {
            wm.threatsSpawned = 10;
            wm.threatsPerWave = 10;
            mockScene.time.delayedCall.mockClear();
            wm._scheduleSpawn();
            expect(mockScene.time.delayedCall).not.toHaveBeenCalled();
        });

        it('should call scene.spawnThreat when callback fires', () => {
            wm.startNextWave();
            const timerCall = mockScene.time.delayedCall.mock.calls[0];
            const callback = timerCall[1];
            callback();
            expect(mockScene.spawnThreat).toHaveBeenCalled();
        });

        it('should not spawn if waveActive is false', () => {
            wm.startNextWave();
            wm.waveActive = false;
            const timerCall = mockScene.time.delayedCall.mock.calls[0];
            const callback = timerCall[1];
            callback();
            expect(mockScene.spawnThreat).not.toHaveBeenCalled();
        });
    });

    describe('threatDestroyed', () => {
        beforeEach(() => {
            wm.startNextWave();
            // Simulate all threats spawned
            wm.threatsSpawned = wm.threatsPerWave;
        });

        it('should decrement threatsRemaining', () => {
            const before = wm.threatsRemaining;
            wm.threatDestroyed();
            expect(wm.threatsRemaining).toBe(before - 1);
        });

        it('should trigger wave complete when all threats done', () => {
            // Destroy all threats
            const total = wm.threatsRemaining;
            for (let i = 0; i < total; i++) {
                wm.threatDestroyed();
            }
            expect(wm.waveActive).toBe(false);
            expect(wm.betweenWaves).toBe(true);
            expect(mockScene.onWaveComplete).toHaveBeenCalledWith(wm.wave);
        });

        it('should not trigger wave complete if threats still remain', () => {
            wm.threatDestroyed();
            expect(wm.threatsRemaining).toBeGreaterThan(0);
            expect(mockScene.onWaveComplete).not.toHaveBeenCalled();
        });
    });

    describe('threatMissed', () => {
        beforeEach(() => {
            wm.startNextWave();
            wm.threatsSpawned = wm.threatsPerWave;
        });

        it('should decrement threatsRemaining', () => {
            const before = wm.threatsRemaining;
            wm.threatMissed();
            expect(wm.threatsRemaining).toBe(before - 1);
        });

        it('should trigger wave complete when all threats accounted for', () => {
            const total = wm.threatsRemaining;
            for (let i = 0; i < total; i++) {
                wm.threatMissed();
            }
            expect(mockScene.onWaveComplete).toHaveBeenCalledWith(wm.wave);
        });
    });

    describe('destroy', () => {
        it('should set waveActive to false', () => {
            wm.waveActive = true;
            wm.destroy();
            expect(wm.waveActive).toBe(false);
        });

        it('should destroy spawnTimer if it exists', () => {
            const mockTimer = { destroy: vi.fn() };
            wm.spawnTimer = mockTimer;
            wm.destroy();
            expect(mockTimer.destroy).toHaveBeenCalled();
        });

        it('should set spawnTimer to null', () => {
            wm.spawnTimer = { destroy: vi.fn() };
            wm.destroy();
            expect(wm.spawnTimer).toBeNull();
        });

        it('should handle being called when no timer exists', () => {
            wm.spawnTimer = null;
            expect(() => wm.destroy()).not.toThrow();
        });
    });
});
