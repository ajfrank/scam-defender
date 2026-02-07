import { Device } from '../../src/objects/Device.js';
import { CONFIG } from '../../src/config.js';
import { createMockScene } from '../__mocks__/phaser.js';

describe('Device', () => {
    let device;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        device = new Device(mockScene, 100, 500, 0);
    });

    describe('constructor', () => {
        it('should set alive to true', () => {
            expect(device.alive).toBe(true);
        });

        it('should select user type based on index mod 4', () => {
            const d0 = new Device(mockScene, 0, 0, 0);
            const d1 = new Device(mockScene, 0, 0, 1);
            const d4 = new Device(mockScene, 0, 0, 4);
            // index 0 and 4 should pick the same type (mod 4)
            expect(d0.userInfo).toEqual(d4.userInfo);
            expect(d0.userInfo).not.toEqual(d1.userInfo);
        });

        it('should call scene.add.existing', () => {
            expect(mockScene.add.existing).toHaveBeenCalled();
        });

        it('should create avatar graphics', () => {
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should set position from arguments', () => {
            expect(device.x).toBe(100);
            expect(device.y).toBe(500);
        });
    });

    describe('hit', () => {
        it('should set alive to false', () => {
            device.hit();
            expect(device.alive).toBe(false);
        });

        it('should return true on first hit', () => {
            expect(device.hit()).toBe(true);
        });

        it('should return false if already dead', () => {
            device.hit();
            expect(device.hit()).toBe(false);
        });

        it('should start flash animation via scene.time.addEvent', () => {
            device.hit();
            expect(mockScene.time.addEvent).toHaveBeenCalled();
        });

        it('should start fade-out tween after delay', () => {
            device.hit();
            expect(mockScene.time.delayedCall).toHaveBeenCalled();
        });
    });

    describe('getBounds', () => {
        it('should return a Phaser.Geom.Rectangle', () => {
            const bounds = device.getBounds();
            expect(bounds).toBeInstanceOf(Phaser.Geom.Rectangle);
        });

        it('should center the rectangle on the device position', () => {
            const bounds = device.getBounds();
            expect(bounds.x).toBe(device.x - CONFIG.DEVICES.WIDTH / 2);
            expect(bounds.y).toBe(device.y - CONFIG.DEVICES.HEIGHT / 2);
        });

        it('should use CONFIG dimensions', () => {
            const bounds = device.getBounds();
            expect(bounds.width).toBe(CONFIG.DEVICES.WIDTH);
            expect(bounds.height).toBe(CONFIG.DEVICES.HEIGHT);
        });
    });
});
