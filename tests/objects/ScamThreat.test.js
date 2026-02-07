import { ScamThreat } from '../../src/objects/ScamThreat.js';
import { CONFIG } from '../../src/config.js';
import { createMockScene } from '../__mocks__/phaser.js';

describe('ScamThreat', () => {
    let threat;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        threat = new ScamThreat(mockScene, 200, -40, 'phishing', 100);
    });

    describe('constructor', () => {
        it('should set threatType from type argument', () => {
            expect(threat.threatType).toBe('phishing');
        });

        it('should set speed and alive=true', () => {
            expect(threat.speed).toBe(100);
            expect(threat.alive).toBe(true);
        });

        it('should set display size from CONFIG.THREATS.SIZE', () => {
            expect(threat.displayWidth).toBe(CONFIG.THREATS.SIZE);
            expect(threat.displayHeight).toBe(CONFIG.THREATS.SIZE);
        });

        it('should look up visual info from THREAT_VISUALS', () => {
            expect(threat.visual).toBeDefined();
            expect(threat.visual.name).toBe('Phishing');
        });

        it('should start wobble tween', () => {
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should store wobble tween reference', () => {
            expect(threat.wobbleTween).toBeDefined();
        });

        it('should set velocity Y to speed', () => {
            expect(threat.body.velocity.y).toBe(100);
        });

        it('should handle all 4 threat types', () => {
            CONFIG.THREATS.TYPES.forEach(type => {
                const t = new ScamThreat(mockScene, 0, 0, type, 50);
                expect(t.visual).toBeDefined();
                expect(t.visual.name).toBeTruthy();
            });
        });
    });

    describe('hit', () => {
        it('should set alive to false', () => {
            threat.hit();
            expect(threat.alive).toBe(false);
        });

        it('should return true on first hit', () => {
            expect(threat.hit()).toBe(true);
        });

        it('should return false on subsequent hits', () => {
            threat.hit();
            expect(threat.hit()).toBe(false);
        });

        it('should stop wobble tween', () => {
            const stopSpy = threat.wobbleTween.stop;
            threat.hit();
            expect(stopSpy).toHaveBeenCalled();
            expect(threat.wobbleTween).toBeNull();
        });

        it('should start fade-out tween', () => {
            // Clear tween calls from constructor
            mockScene.tweens.add.mockClear();
            threat.hit();
            expect(mockScene.tweens.add).toHaveBeenCalled();
            const tweenConfig = mockScene.tweens.add.mock.calls[0][0];
            expect(tweenConfig.alpha).toBe(0);
        });
    });

    describe('preDestroy', () => {
        it('should stop wobble tween if active', () => {
            const stopSpy = threat.wobbleTween.stop;
            threat.preDestroy();
            expect(stopSpy).toHaveBeenCalled();
            expect(threat.wobbleTween).toBeNull();
        });

        it('should handle null wobbleTween gracefully', () => {
            threat.wobbleTween = null;
            expect(() => threat.preDestroy()).not.toThrow();
        });
    });
});
