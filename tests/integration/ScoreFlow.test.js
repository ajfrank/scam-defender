import { ScoreManager } from '../../src/systems/ScoreManager.js';
import { CONFIG } from '../../src/config.js';

describe('Score Flow Integration', () => {
    let sm;

    beforeEach(() => {
        sm = new ScoreManager();
        fetch.mockResolvedValue({ ok: true });
    });

    it('should accumulate score across multiple threat kills', () => {
        sm.addScore('phishing', 1);    // 100
        sm.addScore('pig_butchering', 1); // 200
        sm.addScore('fake_romance', 1);   // 150
        sm.addScore('celeb_bait', 1);     // 125
        expect(sm.getScore()).toBe(575);
    });

    it('should handle multi-kill scoring correctly', () => {
        // Simulate an explosion hitting 3 phishing threats
        sm.addScore('phishing', 1); // 100
        sm.addScore('phishing', 2); // 100 + 50 = 150
        sm.addScore('phishing', 3); // 100 + 100 = 200
        expect(sm.getScore()).toBe(450);
    });

    it('should add wave bonus on wave completion', () => {
        sm.addScore('phishing');
        const bonus = sm.addWaveBonus();
        expect(bonus).toBe(CONFIG.SCORE.WAVE_BONUS);
        expect(sm.getScore()).toBe(100 + CONFIG.SCORE.WAVE_BONUS);
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
        sm.addScore('phishing');       // 100
        sm.addScore('pig_butchering'); // 200
        sm.addWaveBonus();             // 500
        sm.addScore('fake_romance');   // 150
        sm.addScore('celeb_bait');     // 125
        sm.addWaveBonus();             // 500

        const expectedTotal = 100 + 200 + 500 + 150 + 125 + 500;
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
