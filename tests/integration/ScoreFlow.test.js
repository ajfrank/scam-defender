import { ScoreManager } from '../../src/systems/ScoreManager.js';
import { CONFIG } from '../../src/config.js';

describe('Score Flow Integration', () => {
    let sm;

    beforeEach(() => {
        sm = new ScoreManager();
        fetch.mockResolvedValue({ ok: true });
    });

    it('should accumulate score across multiple threat kills', () => {
        sm.addScore('phishing', 1);
        sm.addScore('pig_butchering', 1);
        sm.addScore('fake_romance', 1);
        sm.addScore('celeb_bait', 1);
        const expected = CONFIG.SCORE.PHISHING + CONFIG.SCORE.PIG_BUTCHERING
            + CONFIG.SCORE.FAKE_ROMANCE + CONFIG.SCORE.CELEB_BAIT;
        expect(sm.getScore()).toBe(expected);
    });

    it('should handle multi-kill scoring correctly', () => {
        // Simulate an explosion hitting 3 phishing threats
        const base = CONFIG.SCORE.PHISHING;
        const bonus = CONFIG.SCORE.MULTI_KILL_BONUS;
        sm.addScore('phishing', 1); // base
        sm.addScore('phishing', 2); // base + bonus
        sm.addScore('phishing', 3); // base + 2*bonus
        expect(sm.getScore()).toBe(3 * base + 3 * bonus);
    });

    it('should add wave bonus on wave completion', () => {
        sm.addScore('phishing');
        const bonus = sm.addWaveBonus();
        expect(bonus).toBe(CONFIG.SCORE.WAVE_BONUS);
        expect(sm.getScore()).toBe(CONFIG.SCORE.PHISHING + CONFIG.SCORE.WAVE_BONUS);
    });

    it('should correctly determine high score eligibility with empty list', () => {
        sm.cachedScores = [];
        sm.score = 1;
        expect(sm.isHighScore()).toBe(true);
    });

    it('should correctly determine high score eligibility with full list', () => {
        sm.cachedScores = Array.from({ length: CONFIG.HIGH_SCORES.MAX_ENTRIES }, (_, i) => ({
            name: 'TST', score: 1000 - i * 100,
        }));
        // Score lower than the lowest entry
        sm.score = 0;
        expect(sm.isHighScore()).toBe(false);

        // Score higher than the lowest entry
        sm.score = sm.cachedScores[sm.cachedScores.length - 1].score + 1;
        expect(sm.isHighScore()).toBe(true);
    });

    it('should persist score to localStorage via saveHighScore', async () => {
        sm.score = 999;
        sm.cachedScores = [];

        await sm.saveHighScore('TST');

        expect(localStorage.setItem).toHaveBeenCalledWith(
            CONFIG.HIGH_SCORES.STORAGE_KEY,
            expect.any(String)
        );

        const stored = JSON.parse(localStorage.setItem.mock.calls[0][1]);
        expect(stored[0].name).toBe('TST');
        expect(stored[0].score).toBe(999);
    });

    it('should handle the full lifecycle: reset -> score -> save -> verify', async () => {
        // Start fresh
        sm.reset();
        expect(sm.getScore()).toBe(0);

        // Play a game
        sm.addScore('phishing');
        sm.addScore('pig_butchering');
        sm.addWaveBonus();
        sm.addScore('fake_romance');
        sm.addScore('celeb_bait');
        sm.addWaveBonus();

        const expectedTotal = CONFIG.SCORE.PHISHING + CONFIG.SCORE.PIG_BUTCHERING
            + CONFIG.SCORE.WAVE_BONUS + CONFIG.SCORE.FAKE_ROMANCE
            + CONFIG.SCORE.CELEB_BAIT + CONFIG.SCORE.WAVE_BONUS;
        expect(sm.getScore()).toBe(expectedTotal);

        // Save high score
        sm.cachedScores = [];
        const scores = await sm.saveHighScore('ACE');
        expect(scores[0].name).toBe('ACE');
        expect(scores[0].score).toBe(expectedTotal);

        // Verify it shows in getHighScores
        expect(sm.getHighScores()[0].score).toBe(expectedTotal);
    });
});
