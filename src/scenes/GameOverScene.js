import { CONFIG } from '../config.js';
import { ScoreManager } from '../systems/ScoreManager.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalWave = data.wave || 0;
        this.scoreManager = data.scoreManager || new ScoreManager();
    }

    create() {
        const cx = CONFIG.WIDTH / 2;

        // Game Over title
        this.add.text(cx, 80, "You didn't protect your users!", {
            fontSize: '30px',
            fontFamily: 'monospace',
            color: '#ff4444',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(cx, 120, "Your failure eroded user trust in Meta", {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ff8888',
        }).setOrigin(0.5);

        // Stats
        this.add.text(cx, 180, `FINAL SCORE: ${this.finalScore}`, {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffcc00',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(cx, 215, `Waves Survived: ${this.finalWave}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        // Fetch latest scores then show UI
        this._initScoreUI(cx);
    }

    async _initScoreUI(cx) {
        // Fetch latest scores from server before checking
        await this.scoreManager.fetchHighScores();

        // Guard against scene having been stopped during async fetch
        if (!this.scene.isActive()) return;

        if (this.scoreManager.isHighScore()) {
            this._showHighScoreEntry(cx);
        } else {
            this._showHighScores(cx, 280);
            this._showRestartButton(cx, 480);
        }
    }

    _showHighScoreEntry(cx) {
        this.add.text(cx, 270, 'NEW HIGH SCORE!', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#00ff88',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(cx, 300, 'Enter your initials:', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888',
        }).setOrigin(0.5);

        // Simple initial entry (3 characters)
        this.initials = '';
        this.initialsText = this.add.text(cx, 340, '___', {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
            letterSpacing: 8,
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown', (event) => {
            if (this.initials.length >= 3) return;

            const key = event.key.toUpperCase();
            if (/^[A-Z0-9]$/.test(key)) {
                this.initials += key;
                this.game.audio.playMenuSelect();
                this._updateInitialsDisplay();

                if (this.initials.length === 3) {
                    this.scoreManager.saveHighScore(this.initials).then(() => {
                        this.time.delayedCall(500, () => {
                            this._showHighScores(cx, 400);
                            this._showRestartButton(cx, 540);
                        });
                    });
                }
            }

            if (event.key === 'Backspace' && this.initials.length > 0) {
                this.initials = this.initials.slice(0, -1);
                this._updateInitialsDisplay();
            }
        });
    }

    _updateInitialsDisplay() {
        const display = this.initials.padEnd(3, '_');
        this.initialsText.setText(display.split('').join(' '));
    }

    _showHighScores(cx, startY) {
        const scores = this.scoreManager.getHighScores();
        if (scores.length === 0) return;

        this.add.text(cx, startY, '--- HIGH SCORES ---', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666666',
        }).setOrigin(0.5);

        scores.forEach((entry, i) => {
            const isCurrentScore = entry.score === this.finalScore;
            this.add.text(
                cx, startY + 25 + i * 22,
                `${i + 1}. ${entry.name.padEnd(5)} ${String(entry.score).padStart(8)}`,
                {
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    color: isCurrentScore ? '#00ff88' : (i === 0 ? '#ffcc00' : '#888888'),
                    fontStyle: isCurrentScore ? 'bold' : 'normal',
                }
            ).setOrigin(0.5);
        });
    }

    _showRestartButton(cx, y) {
        const restartBtn = this.add.text(cx, y, '[ PLAY AGAIN ]', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: restartBtn,
            alpha: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1,
        });

        restartBtn.on('pointerdown', () => {
            this.game.audio.playMenuSelect();
            this.scene.start('GameScene');
        });

        const menuBtn = this.add.text(cx, y + 40, '[ MAIN MENU ]', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#888888',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            this.game.audio.playMenuSelect();
            this.scene.start('MenuScene');
        });

        // Enter key to restart
        this.input.keyboard.on('keydown-ENTER', () => {
            this.game.audio.playMenuSelect();
            this.scene.start('GameScene');
        });
    }
}
