import { CONFIG } from '../config.js';

export class ScoreManager {
    constructor() {
        this.score = 0;
        this.wave = 0;
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

    getHighScores() {
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

    saveHighScore(name) {
        const scores = this.getHighScores();
        scores.push({ name: name.toUpperCase(), score: this.score });
        scores.sort((a, b) => b.score - a.score);
        scores.splice(CONFIG.HIGH_SCORES.MAX_ENTRIES);

        try {
            localStorage.setItem(CONFIG.HIGH_SCORES.STORAGE_KEY, JSON.stringify(scores));
        } catch {
            // localStorage unavailable
        }
        return scores;
    }
}
