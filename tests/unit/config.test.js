import { CONFIG } from '../../src/config.js';

describe('CONFIG', () => {
    it('should export a CONFIG object', () => {
        expect(CONFIG).toBeDefined();
        expect(typeof CONFIG).toBe('object');
    });

    it('should define canvas dimensions as positive numbers', () => {
        expect(CONFIG.WIDTH).toBeGreaterThan(0);
        expect(CONFIG.HEIGHT).toBeGreaterThan(0);
    });

    it('should define exactly 4 threat types', () => {
        expect(CONFIG.THREATS.TYPES).toHaveLength(4);
        expect(CONFIG.THREATS.TYPES).toContain('phishing');
        expect(CONFIG.THREATS.TYPES).toContain('pig_butchering');
        expect(CONFIG.THREATS.TYPES).toContain('fake_romance');
        expect(CONFIG.THREATS.TYPES).toContain('celeb_bait');
    });

    it('should define score values for every threat type', () => {
        CONFIG.THREATS.TYPES.forEach(type => {
            const key = type.toUpperCase();
            expect(CONFIG.SCORE[key]).toBeDefined();
            expect(CONFIG.SCORE[key]).toBeGreaterThan(0);
        });
    });

    it('should have MULTI_KILL_BONUS and WAVE_BONUS as positive numbers', () => {
        expect(CONFIG.SCORE.MULTI_KILL_BONUS).toBeGreaterThan(0);
        expect(CONFIG.SCORE.WAVE_BONUS).toBeGreaterThan(0);
    });

    it('should have DEVICES.COUNT equal to 4', () => {
        expect(CONFIG.DEVICES.COUNT).toBe(4);
    });

    it('should have MIN_SPAWN_DELAY less than BASE_SPAWN_DELAY', () => {
        expect(CONFIG.THREATS.MIN_SPAWN_DELAY).toBeLessThan(CONFIG.THREATS.BASE_SPAWN_DELAY);
    });

    it('should have HIGH_SCORES.MAX_ENTRIES as a positive integer', () => {
        expect(CONFIG.HIGH_SCORES.MAX_ENTRIES).toBeGreaterThan(0);
        expect(Number.isInteger(CONFIG.HIGH_SCORES.MAX_ENTRIES)).toBe(true);
    });

    it('should define hero properties', () => {
        expect(CONFIG.HERO.SPEED).toBeGreaterThan(0);
        expect(CONFIG.HERO.FIRE_COOLDOWN).toBeGreaterThan(0);
        expect(CONFIG.HERO.SIZE).toBeGreaterThan(0);
    });

    it('should define interceptor properties', () => {
        expect(CONFIG.INTERCEPTOR.SPEED).toBeGreaterThan(0);
        expect(CONFIG.INTERCEPTOR.EXPLOSION_RADIUS).toBeGreaterThan(0);
        expect(CONFIG.INTERCEPTOR.EXPLOSION_DURATION).toBeGreaterThan(0);
    });

    it('should define threat scaling properties', () => {
        expect(CONFIG.THREATS.BASE_SPEED).toBeGreaterThan(0);
        expect(CONFIG.THREATS.SPEED_INCREMENT).toBeGreaterThan(0);
        expect(CONFIG.THREATS.BASE_PER_WAVE).toBeGreaterThan(0);
        expect(CONFIG.THREATS.PER_WAVE_INCREMENT).toBeGreaterThan(0);
    });
});
