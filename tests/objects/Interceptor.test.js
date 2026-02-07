import { Interceptor } from '../../src/objects/Interceptor.js';
import { CONFIG } from '../../src/config.js';
import { createMockScene } from '../__mocks__/phaser.js';

describe('Interceptor', () => {
    let interceptor;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        // GameScene.create() sets this.audio = this.game.audio;
        // Interceptor.explode() references scene.audio directly
        mockScene.audio = mockScene.game.audio;
        interceptor = new Interceptor(mockScene, 500, 700, 500, 300);
    });

    describe('constructor', () => {
        it('should set position from arguments', () => {
            expect(interceptor.x).toBe(500);
            expect(interceptor.y).toBe(700);
        });

        it('should store targetX and targetY', () => {
            expect(interceptor.targetX).toBe(500);
            expect(interceptor.targetY).toBe(300);
        });

        it('should set hasExploded to false', () => {
            expect(interceptor.hasExploded).toBe(false);
        });

        it('should calculate velocity toward target', () => {
            // Target is directly above (500, 300) from (500, 700)
            // Angle should be -PI/2 (straight up)
            // Velocity Y should be negative (moving up)
            expect(interceptor.body.velocity.y).toBeLessThan(0);
        });

        it('should set velocity with CONFIG.INTERCEPTOR.SPEED magnitude', () => {
            const vx = interceptor.body.velocity.x;
            const vy = interceptor.body.velocity.y;
            const speed = Math.sqrt(vx * vx + vy * vy);
            expect(speed).toBeCloseTo(CONFIG.INTERCEPTOR.SPEED, 0);
        });
    });

    describe('update', () => {
        it('should do nothing if hasExploded is true', () => {
            interceptor.hasExploded = true;
            const explodeSpy = vi.spyOn(interceptor, 'explode');
            interceptor.update();
            expect(explodeSpy).not.toHaveBeenCalled();
        });

        it('should call explode() when within 10px of target', () => {
            const explodeSpy = vi.spyOn(interceptor, 'explode');
            interceptor.x = interceptor.targetX;
            interceptor.y = interceptor.targetY + 5; // within 10px
            interceptor.update();
            expect(explodeSpy).toHaveBeenCalled();
        });

        it('should not explode when far from target', () => {
            const explodeSpy = vi.spyOn(interceptor, 'explode');
            interceptor.x = 100;
            interceptor.y = 100;
            interceptor.update();
            expect(explodeSpy).not.toHaveBeenCalled();
        });

        it('should call cleanup() when off screen top', () => {
            const cleanupSpy = vi.spyOn(interceptor, 'cleanup');
            interceptor.y = -60;
            interceptor.update();
            expect(cleanupSpy).toHaveBeenCalled();
        });

        it('should call cleanup() when off screen left', () => {
            const cleanupSpy = vi.spyOn(interceptor, 'cleanup');
            interceptor.x = -60;
            interceptor.y = 300; // not at target
            interceptor.update();
            expect(cleanupSpy).toHaveBeenCalled();
        });

        it('should call cleanup() when off screen right', () => {
            const cleanupSpy = vi.spyOn(interceptor, 'cleanup');
            interceptor.x = CONFIG.WIDTH + 60;
            interceptor.y = 300;
            interceptor.update();
            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    describe('explode', () => {
        it('should set hasExploded to true', () => {
            interceptor.explode();
            expect(interceptor.hasExploded).toBe(true);
        });

        it('should set velocity to 0', () => {
            interceptor.explode();
            expect(interceptor.body.velocity.x).toBe(0);
            expect(interceptor.body.velocity.y).toBe(0);
        });

        it('should set visible to false', () => {
            interceptor.explode();
            expect(interceptor.visible).toBe(false);
        });

        it('should create explosion graphics', () => {
            mockScene.add.graphics.mockClear();
            interceptor.explode();
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should start explosion tween', () => {
            mockScene.tweens.add.mockClear();
            interceptor.explode();
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should play explosion audio', () => {
            interceptor.explode();
            expect(mockScene.game.audio.playExplosion).toHaveBeenCalled();
        });

        it('should not explode twice', () => {
            interceptor.explode();
            mockScene.tweens.add.mockClear();
            interceptor.explode();
            expect(mockScene.tweens.add).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should destroy trail particles if they exist', () => {
            interceptor.trail = { destroy: vi.fn() };
            interceptor.cleanup();
            expect(interceptor.trail).toBeNull();
        });

        it('should destroy explosion graphics if they exist', () => {
            interceptor.explosionGfx = { destroy: vi.fn() };
            const destroySpy = interceptor.explosionGfx.destroy;
            interceptor.cleanup();
            expect(destroySpy).toHaveBeenCalled();
        });

        it('should handle missing trail gracefully', () => {
            interceptor.trail = null;
            expect(() => interceptor.cleanup()).not.toThrow();
        });
    });
});
