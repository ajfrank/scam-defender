import { Hero } from '../../src/objects/Hero.js';
import { CONFIG } from '../../src/config.js';
import { createMockScene } from '../__mocks__/phaser.js';

describe('Hero', () => {
    let hero;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        hero = new Hero(mockScene, CONFIG.WIDTH / 2, CONFIG.HEIGHT - 50);
    });

    describe('constructor', () => {
        it('should set position from arguments', () => {
            expect(hero.x).toBe(CONFIG.WIDTH / 2);
            expect(hero.y).toBe(CONFIG.HEIGHT - 50);
        });

        it('should set lastFireTime to 0', () => {
            expect(hero.lastFireTime).toBe(0);
        });

        it('should set speed from CONFIG.HERO.SPEED', () => {
            expect(hero.speed).toBe(CONFIG.HERO.SPEED);
        });

        it('should detect desktop from scene.sys.game.device.os.desktop', () => {
            expect(hero.isMobile).toBe(false);
        });

        it('should detect mobile when os.desktop is false', () => {
            mockScene.sys.game.device.os.desktop = false;
            const mobileHero = new Hero(mockScene, 0, 0);
            expect(mobileHero.isMobile).toBe(true);
        });

        it('should call scene.add.existing', () => {
            expect(mockScene.add.existing).toHaveBeenCalled();
        });
    });

    describe('canFire', () => {
        it('should return true on first call (lastFireTime is 0)', () => {
            mockScene.time.now = CONFIG.HERO.FIRE_COOLDOWN;
            expect(hero.canFire()).toBe(true);
        });

        it('should return false when cooldown has not elapsed', () => {
            mockScene.time.now = 1000;
            hero.lastFireTime = 1000;
            mockScene.time.now = 1000 + CONFIG.HERO.FIRE_COOLDOWN - 1;
            expect(hero.canFire()).toBe(false);
        });

        it('should return true when enough time has passed', () => {
            mockScene.time.now = 1000;
            hero.lastFireTime = 1000;
            mockScene.time.now = 1000 + CONFIG.HERO.FIRE_COOLDOWN;
            expect(hero.canFire()).toBe(true);
        });
    });

    describe('fire', () => {
        it('should update lastFireTime to scene.time.now', () => {
            mockScene.time.now = 5000;
            hero.fire();
            expect(hero.lastFireTime).toBe(5000);
        });
    });

    describe('update', () => {
        it('should not move on desktop when no keys are down', () => {
            const startX = hero.x;
            const cursors = { left: { isDown: false }, right: { isDown: false } };
            hero.update(cursors, { worldX: 0, worldY: 0 });
            expect(hero.x).toBe(startX);
        });

        it('should move left when left cursor is down', () => {
            const startX = hero.x;
            const cursors = { left: { isDown: true }, right: { isDown: false } };
            mockScene.game.loop.delta = 1000; // 1 second for easy math
            hero.update(cursors, { worldX: 0, worldY: 0 });
            expect(hero.x).toBeLessThan(startX);
        });

        it('should move right when right cursor is down', () => {
            const startX = hero.x;
            const cursors = { left: { isDown: false }, right: { isDown: true } };
            mockScene.game.loop.delta = 1000;
            hero.update(cursors, { worldX: 0, worldY: 0 });
            expect(hero.x).toBeGreaterThan(startX);
        });

        it('should move left when A key is down', () => {
            const startX = hero.x;
            const cursors = { left: { isDown: false }, right: { isDown: false } };
            mockScene.keys.a.isDown = true;
            mockScene.game.loop.delta = 1000;
            hero.update(cursors, { worldX: 0, worldY: 0 });
            expect(hero.x).toBeLessThan(startX);
        });

        it('should clamp x position to screen bounds', () => {
            const cursors = { left: { isDown: true }, right: { isDown: false } };
            mockScene.game.loop.delta = 100000; // very large delta
            hero.update(cursors, { worldX: 0, worldY: 0 });
            expect(hero.x).toBeGreaterThanOrEqual(CONFIG.HERO.SIZE / 2);
        });

        it('should not move on mobile', () => {
            mockScene.sys.game.device.os.desktop = false;
            const mobileHero = new Hero(mockScene, CONFIG.WIDTH / 2, 0);
            const startX = mobileHero.x;
            const cursors = { left: { isDown: true }, right: { isDown: false } };
            mockScene.game.loop.delta = 1000;
            mobileHero.update(cursors, { worldX: 0, worldY: 0 });
            expect(mobileHero.x).toBe(startX);
        });
    });
});
