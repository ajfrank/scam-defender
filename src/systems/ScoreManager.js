import { CONFIG } from '../config.js';

const JSONBIN_BIN_ID = '698759a4d0ea881f40a82336';
const JSONBIN_API_KEY = '$2a$10$uKD37Vev2HYuVZsiaRnTa.S56tqMOuO1jukKyLNq0bCDHmMAQqsXG';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

export class ScoreManager {
    constructor() {
        this.score = 0;
        this.wave = 0;
        this.cachedScores = null;
    }

    reset() {
        this.score = 0;
        this.wave = 0;
    }

    addScore(threatType, multiKillCount = 1) {
        const typeKey = threatType.toUpperCase();
        const base = CONFIG.SCORE[typeKey] || 100;
        let points = base;

        if (multiKillCount > 1) {
            points += CONFIG.SCORE.MULTI_KILL_BONUS * (multiKillCount - 1);
        }

        this.score += points;
        return points;
    }

    addWaveBonus() {
        this.score += CONFIG.SCORE.WAVE_BONUS;
        return CONFIG.SCORE.WAVE_BONUS;
    }

    getScore() {
        return this.score;
    }

    // Fetch high scores from JSONBin (async)
    async fetchHighScores() {
        try {
            const res = await fetch(`${JSONBIN_URL}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_API_KEY },
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const scores = data.record.highscores || [];
            scores.sort((a, b) => b.score - a.score);
            this.cachedScores = scores;
            // Sync to localStorage as fallback
            try {
                localStorage.setItem(CONFIG.HIGH_SCORES.STORAGE_KEY, JSON.stringify(scores));
            } catch {}
            return scores;
        } catch {
            // Fall back to localStorage
            return this._getLocalScores();
        }
    }

    // Synchronous getter using cached/local data
    getHighScores() {
        if (this.cachedScores) return this.cachedScores;
        return this._getLocalScores();
    }

    _getLocalScores() {
        try {
            const data = localStorage.getItem(CONFIG.HIGH_SCORES.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    isHighScore() {
        const scores = this.getHighScores();
        if (scores.length < CONFIG.HIGH_SCORES.MAX_ENTRIES) return true;
        return this.score > scores[scores.length - 1].score;
    }

    // Save high score to JSONBin and localStorage
    async saveHighScore(name) {
        const scores = this.getHighScores();
        scores.push({
            name: name.toUpperCase(),
            score: this.score,
            timestamp: Date.now(),
        });
        scores.sort((a, b) => b.score - a.score);
        scores.splice(CONFIG.HIGH_SCORES.MAX_ENTRIES);

        this.cachedScores = scores;

        // Save to localStorage
        try {
            localStorage.setItem(CONFIG.HIGH_SCORES.STORAGE_KEY, JSON.stringify(scores));
        } catch {}

        // Save to JSONBin
        try {
            await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY,
                },
                body: JSON.stringify({ highscores: scores }),
            });
        } catch {
            // Silent fail — localStorage still has it
        }

        return scores;
    }
}
