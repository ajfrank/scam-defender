import { GameScene } from '../../src/scenes/GameScene.js';
import { CONFIG } from '../../src/config.js';

describe('GameScene', () => {
    let scene;

    beforeEach(() => {
        scene = new GameScene();
        // Manually run create to set up the scene
        scene.create();
    });

    describe('create', () => {
        it('should initialize scoreManager and waveManager', () => {
            expect(scene.scoreManager).toBeDefined();
            expect(scene.waveManager).toBeDefined();
        });

        it('should set gameOver and paused to false', () => {
            expect(scene.gameOver).toBe(false);
            expect(scene.paused).toBe(false);
        });

        it('should create 4 devices', () => {
            expect(scene.devices).toHaveLength(CONFIG.DEVICES.COUNT);
        });

        it('should set aliveDeviceCount to CONFIG.DEVICES.COUNT', () => {
            expect(scene.aliveDeviceCount).toBe(CONFIG.DEVICES.COUNT);
        });

        it('should create hero', () => {
            expect(scene.hero).toBeDefined();
        });

        it('should initialize empty interceptors and threats arrays', () => {
            expect(scene.interceptors).toEqual([]);
            expect(scene.threats).toEqual([]);
        });

        it('should set crosshair cursor', () => {
            expect(scene.input.setDefaultCursor).toHaveBeenCalledWith('crosshair');
        });
    });

    describe('spawnThreat', () => {
        it('should add threat to threats array', () => {
            scene.spawnThreat(100);
            expect(scene.threats).toHaveLength(1);
        });

        it('should create threat with given speed', () => {
            scene.spawnThreat(150);
            expect(scene.threats[0].speed).toBe(150);
        });
    });

    describe('checkExplosionCollision', () => {
        beforeEach(() => {
            // Spawn a threat at a known position
            scene.spawnThreat(100);
            scene.threats[0].x = 200;
            scene.threats[0].y = 300;
            scene.threats[0].alive = true;
            scene.threats[0].active = true;
        });

        it('should destroy threats within explosion radius', () => {
            scene.checkExplosionCollision(200, 300, CONFIG.INTERCEPTOR.EXPLOSION_RADIUS);
            expect(scene.threats[0].alive).toBe(false);
        });

        it('should not destroy threats outside radius', () => {
            scene.checkExplosionCollision(800, 800, CONFIG.INTERCEPTOR.EXPLOSION_RADIUS);
            expect(scene.threats[0].alive).toBe(true);
        });

        it('should not destroy already-dead threats', () => {
            scene.threats[0].alive = false;
            const addScoreSpy = vi.spyOn(scene.scoreManager, 'addScore');
            scene.checkExplosionCollision(200, 300, CONFIG.INTERCEPTOR.EXPLOSION_RADIUS);
            expect(addScoreSpy).not.toHaveBeenCalled();
        });

        it('should track multi-kill count', () => {
            // Add a second threat nearby
            scene.spawnThreat(100);
            scene.threats[1].x = 210;
            scene.threats[1].y = 300;
            scene.threats[1].alive = true;
            scene.threats[1].active = true;

            const addScoreSpy = vi.spyOn(scene.scoreManager, 'addScore');
            scene.checkExplosionCollision(205, 300, CONFIG.INTERCEPTOR.EXPLOSION_RADIUS);

            // Should be called twice with increasing killCount
            expect(addScoreSpy).toHaveBeenCalledTimes(2);
        });

        it('should notify waveManager for each kill', () => {
            const destroySpy = vi.spyOn(scene.waveManager, 'threatDestroyed');
            scene.checkExplosionCollision(200, 300, CONFIG.INTERCEPTOR.EXPLOSION_RADIUS);
            expect(destroySpy).toHaveBeenCalled();
        });

        it('should play audio for each kill', () => {
            scene.checkExplosionCollision(200, 300, CONFIG.INTERCEPTOR.EXPLOSION_RADIUS);
            expect(scene.audio.playThreatDestroyed).toHaveBeenCalled();
        });
    });

    describe('_checkGameOver', () => {
        it('should not trigger when devices remain alive', () => {
            scene.aliveDeviceCount = 2;
            scene._checkGameOver();
            expect(scene.gameOver).toBe(false);
        });

        it('should trigger when aliveDeviceCount reaches 0', () => {
            scene.aliveDeviceCount = 0;
            scene._checkGameOver();
            expect(scene.gameOver).toBe(true);
        });

        it('should play gameOver audio', () => {
            scene.aliveDeviceCount = 0;
            scene._checkGameOver();
            expect(scene.audio.playGameOver).toHaveBeenCalled();
        });

        it('should destroy waveManager', () => {
            const destroySpy = vi.spyOn(scene.waveManager, 'destroy');
            scene.aliveDeviceCount = 0;
            scene._checkGameOver();
            expect(destroySpy).toHaveBeenCalled();
        });

        it('should not trigger twice', () => {
            scene.aliveDeviceCount = 0;
            scene._checkGameOver();
            scene.audio.playGameOver.mockClear();
            scene._checkGameOver();
            expect(scene.audio.playGameOver).not.toHaveBeenCalled();
        });

        it('should schedule transition to GameOverScene', () => {
            scene.aliveDeviceCount = 0;
            scene._checkGameOver();
            expect(scene.time.delayedCall).toHaveBeenCalled();
        });
    });

    describe('onWaveComplete', () => {
        it('should add wave bonus', () => {
            const addBonusSpy = vi.spyOn(scene.scoreManager, 'addWaveBonus');
            scene.onWaveComplete(1);
            expect(addBonusSpy).toHaveBeenCalled();
        });

        it('should play waveComplete audio', () => {
            scene.onWaveComplete(1);
            expect(scene.audio.playWaveComplete).toHaveBeenCalled();
        });

        it('should schedule next wave after delay', () => {
            scene.time.delayedCall.mockClear();
            scene.onWaveComplete(1);
            expect(scene.time.delayedCall).toHaveBeenCalled();
            const [delay] = scene.time.delayedCall.mock.calls[0];
            expect(delay).toBe(3000);
        });

        it('should store waveDelayTimer reference', () => {
            scene.onWaveComplete(1);
            expect(scene.waveDelayTimer).toBeDefined();
        });
    });

    describe('togglePause', () => {
        it('should toggle paused state', () => {
            scene.togglePause();
            expect(scene.paused).toBe(true);
            scene.togglePause();
            expect(scene.paused).toBe(false);
        });

        it('should pause physics when pausing', () => {
            scene.togglePause();
            expect(scene.physics.pause).toHaveBeenCalled();
        });

        it('should resume physics when unpausing', () => {
            scene.togglePause(); // pause
            scene.togglePause(); // unpause
            expect(scene.physics.resume).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should do nothing when paused', () => {
            scene.paused = true;
            const heroSpy = vi.spyOn(scene.hero, 'update');
            scene.update();
            expect(heroSpy).not.toHaveBeenCalled();
        });

        it('should do nothing when gameOver', () => {
            scene.gameOver = true;
            const heroSpy = vi.spyOn(scene.hero, 'update');
            scene.update();
            expect(heroSpy).not.toHaveBeenCalled();
        });

        it('should clear explodedThreats set each frame', () => {
            scene.explodedThreats.add('test');
            scene.update();
            expect(scene.explodedThreats.size).toBe(0);
        });

        it('should remove inactive interceptors from array', () => {
            scene.interceptors.push({ active: false, update: vi.fn() });
            scene.interceptors.push({ active: true, update: vi.fn() });
            scene.update();
            expect(scene.interceptors).toHaveLength(1);
        });

        it('should remove inactive threats from array', () => {
            scene.threats.push({ active: false, update: vi.fn() });
            scene.threats.push({ active: true, update: vi.fn() });
            scene.update();
            expect(scene.threats).toHaveLength(1);
        });
    });

    describe('shutdown', () => {
        it('should destroy waveManager', () => {
            const destroySpy = vi.spyOn(scene.waveManager, 'destroy');
            scene.shutdown();
            expect(destroySpy).toHaveBeenCalled();
        });

        it('should destroy wave delay timer if active', () => {
            const mockTimer = { destroy: vi.fn() };
            scene.waveDelayTimer = mockTimer;
            scene.shutdown();
            expect(mockTimer.destroy).toHaveBeenCalled();
        });

        it('should reset cursor to default', () => {
            scene.shutdown();
            expect(scene.input.setDefaultCursor).toHaveBeenCalledWith('default');
        });
    });
});
