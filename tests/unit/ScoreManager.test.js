import { ScoreManager } from '../../src/systems/ScoreManager.js';
import { CONFIG } from '../../src/config.js';

describe('ScoreManager', () => {
    let sm;

    beforeEach(() => {
        sm = new ScoreManager();
    });

    describe('constructor and reset', () => {
        it('should initialize with score 0 and wave 0', () => {
            expect(sm.score).toBe(0);
            expect(sm.wave).toBe(0);
        });

        it('should reset score and wave to 0', () => {
            sm.score = 500;
            sm.wave = 3;
            sm.reset();
            expect(sm.score).toBe(0);
            expect(sm.wave).toBe(0);
        });
    });

    describe('addScore', () => {
        it('should add base points for phishing', () => {
            const points = sm.addScore('phishing');
            expect(points).toBe(CONFIG.SCORE.PHISHING);
            expect(sm.getScore()).toBe(CONFIG.SCORE.PHISHING);
        });

        it('should add base points for pig_butchering', () => {
            const points = sm.addScore('pig_butchering');
            expect(points).toBe(CONFIG.SCORE.PIG_BUTCHERING);
        });

        it('should add base points for fake_romance', () => {
            const points = sm.addScore('fake_romance');
            expect(points).toBe(CONFIG.SCORE.FAKE_ROMANCE);
        });

        it('should add base points for celeb_bait', () => {
            const points = sm.addScore('celeb_bait');
            expect(points).toBe(CONFIG.SCORE.CELEB_BAIT);
        });

        it('should default to 100 for unknown threat types', () => {
            const points = sm.addScore('unknown_type');
            expect(points).toBe(100);
        });

        it('should accumulate score across multiple calls', () => {
            sm.addScore('phishing');
            sm.addScore('pig_butchering');
            expect(sm.getScore()).toBe(CONFIG.SCORE.PHISHING + CONFIG.SCORE.PIG_BUTCHERING);
        });

        it('should add MULTI_KILL_BONUS for multiKillCount > 1', () => {
            const points = sm.addScore('phishing', 2);
            expect(points).toBe(CONFIG.SCORE.PHISHING + CONFIG.SCORE.MULTI_KILL_BONUS);
        });

        it('should add 2x MULTI_KILL_BONUS for multiKillCount = 3', () => {
            const points = sm.addScore('phishing', 3);
            expect(points).toBe(CONFIG.SCORE.PHISHING + 2 * CONFIG.SCORE.MULTI_KILL_BONUS);
        });

        it('should not add bonus for multiKillCount = 1', () => {
            const points = sm.addScore('phishing', 1);
            expect(points).toBe(CONFIG.SCORE.PHISHING);
        });
    });

    describe('addWaveBonus', () => {
        it('should add WAVE_BONUS to score', () => {
            sm.addWaveBonus();
            expect(sm.getScore()).toBe(CONFIG.SCORE.WAVE_BONUS);
        });

        it('should return WAVE_BONUS value', () => {
            const bonus = sm.addWaveBonus();
            expect(bonus).toBe(CONFIG.SCORE.WAVE_BONUS);
        });

        it('should accumulate with existing score', () => {
            sm.addScore('phishing');
            sm.addWaveBonus();
            expect(sm.getScore()).toBe(CONFIG.SCORE.PHISHING + CONFIG.SCORE.WAVE_BONUS);
        });
    });

    describe('getScore', () => {
        it('should return current score', () => {
            expect(sm.getScore()).toBe(0);
            sm.addScore('phishing');
            expect(sm.getScore()).toBe(CONFIG.SCORE.PHISHING);
        });
    });

    describe('fetchHighScores', () => {
        it('should call fetch with correct JSONBin URL and headers', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ record: { highscores: [] } }),
            });

            await sm.fetchHighScores();

            expect(fetch).toHaveBeenCalledTimes(1);
            const [url, options] = fetch.mock.calls[0];
            expect(url).toContain('api.jsonbin.io');
            expect(url).toContain('/latest');
            expect(options.headers['X-Master-Key']).toBeDefined();
        });

        it('should sort returned scores descending by score', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    record: {
                        highscores: [
                            { name: 'BBB', score: 100 },
                            { name: 'AAA', score: 500 },
                            { name: 'CCC', score: 300 },
                        ],
                    },
                }),
            });

            const scores = await sm.fetchHighScores();
            expect(scores[0].score).toBe(500);
            expect(scores[1].score).toBe(300);
            expect(scores[2].score).toBe(100);
        });

        it('should cache scores in cachedScores', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    record: { highscores: [{ name: 'AAA', score: 500 }] },
                }),
            });

            await sm.fetchHighScores();
            expect(sm.cachedScores).toHaveLength(1);
            expect(sm.cachedScores[0].name).toBe('AAA');
        });

        it('should sync scores to localStorage', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    record: { highscores: [{ name: 'AAA', score: 500 }] },
                }),
            });

            await sm.fetchHighScores();
            expect(localStorage.setItem).toHaveBeenCalledWith(
                CONFIG.HIGH_SCORES.STORAGE_KEY,
                expect.any(String)
            );
        });

        it('should fall back to localStorage when fetch fails', async () => {
            const storedScores = [{ name: 'BBB', score: 200 }];
            localStorage.getItem.mockReturnValue(JSON.stringify(storedScores));
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const scores = await sm.fetchHighScores();
            expect(scores).toEqual(storedScores);
        });

        it('should return empty array when both fetch and localStorage fail', async () => {
            localStorage.getItem.mockReturnValue(null);
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const scores = await sm.fetchHighScores();
            expect(scores).toEqual([]);
        });
    });

    describe('getHighScores', () => {
        it('should return cachedScores if available', () => {
            sm.cachedScores = [{ name: 'AAA', score: 500 }];
            expect(sm.getHighScores()).toEqual(sm.cachedScores);
        });

        it('should fall back to localStorage when no cached scores', () => {
            const storedScores = [{ name: 'BBB', score: 200 }];
            localStorage.getItem.mockReturnValue(JSON.stringify(storedScores));

            const scores = sm.getHighScores();
            expect(scores).toEqual(storedScores);
        });

        it('should return empty array when localStorage is empty', () => {
            localStorage.getItem.mockReturnValue(null);
            expect(sm.getHighScores()).toEqual([]);
        });
    });

    describe('isHighScore', () => {
        it('should return true when fewer than MAX_ENTRIES scores exist', () => {
            sm.cachedScores = [{ name: 'AAA', score: 500 }];
            sm.score = 1; // any score
            expect(sm.isHighScore()).toBe(true);
        });

        it('should return true when score list is empty', () => {
            sm.cachedScores = [];
            sm.score = 1;
            // Empty means < MAX_ENTRIES
            expect(sm.isHighScore()).toBe(true);
        });

        it('should return true when current score beats the lowest entry', () => {
            sm.cachedScores = Array.from({ length: CONFIG.HIGH_SCORES.MAX_ENTRIES }, (_, i) => ({
                name: 'TST',
                score: 1000 - i * 100,
            }));
            sm.score = sm.cachedScores[sm.cachedScores.length - 1].score + 1;
            expect(sm.isHighScore()).toBe(true);
        });

        it('should return false when current score does not beat lowest entry', () => {
            sm.cachedScores = Array.from({ length: CONFIG.HIGH_SCORES.MAX_ENTRIES }, (_, i) => ({
                name: 'TST',
                score: 1000 - i * 100,
            }));
            sm.score = 0;
            expect(sm.isHighScore()).toBe(false);
        });
    });

    describe('saveHighScore', () => {
        beforeEach(() => {
            sm.cachedScores = [{ name: 'OLD', score: 100, timestamp: 1 }];
            sm.score = 500;
            fetch.mockResolvedValue({ ok: true });
        });

        it('should add new score entry with uppercase name', async () => {
            const scores = await sm.saveHighScore('abc');
            const entry = scores.find(s => s.name === 'ABC');
            expect(entry).toBeDefined();
            expect(entry.score).toBe(500);
        });

        it('should include timestamp in new entry', async () => {
            const before = Date.now();
            const scores = await sm.saveHighScore('ABC');
            const entry = scores.find(s => s.name === 'ABC');
            expect(entry.timestamp).toBeGreaterThanOrEqual(before);
        });

        it('should sort scores descending after insertion', async () => {
            const scores = await sm.saveHighScore('ABC');
            expect(scores[0].score).toBe(500);
            expect(scores[1].score).toBe(100);
        });

        it('should trim to MAX_ENTRIES', async () => {
            sm.cachedScores = Array.from({ length: CONFIG.HIGH_SCORES.MAX_ENTRIES }, (_, i) => ({
                name: 'TST', score: 50 + i, timestamp: 1,
            }));
            const scores = await sm.saveHighScore('NEW');
            expect(scores.length).toBeLessThanOrEqual(CONFIG.HIGH_SCORES.MAX_ENTRIES);
        });

        it('should save to localStorage', async () => {
            await sm.saveHighScore('ABC');
            expect(localStorage.setItem).toHaveBeenCalledWith(
                CONFIG.HIGH_SCORES.STORAGE_KEY,
                expect.any(String)
            );
        });

        it('should PUT to JSONBin with correct headers', async () => {
            await sm.saveHighScore('ABC');
            const putCall = fetch.mock.calls.find(c => c[1]?.method === 'PUT');
            expect(putCall).toBeDefined();
            expect(putCall[1].headers['Content-Type']).toBe('application/json');
            expect(putCall[1].headers['X-Master-Key']).toBeDefined();
        });

        it('should update cachedScores', async () => {
            await sm.saveHighScore('ABC');
            expect(sm.cachedScores.find(s => s.name === 'ABC')).toBeDefined();
        });

        it('should handle JSONBin PUT failure gracefully', async () => {
            fetch.mockRejectedValue(new Error('Network error'));
            const scores = await sm.saveHighScore('ABC');
            expect(scores).toBeDefined();
            expect(scores.find(s => s.name === 'ABC')).toBeDefined();
        });
    });
});
