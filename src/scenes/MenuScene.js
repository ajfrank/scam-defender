import { CONFIG } from '../config.js';
import { AudioManager } from '../systems/AudioManager.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Initialize audio on user interaction
        if (!this.game.audio) {
            this.game.audio = new AudioManager();
        }

        const cx = CONFIG.WIDTH / 2;

        // Title
        this.add.text(cx, 100, 'SCAM DEFENDER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, 155, "Protect Meta's users from scams!", {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        // Threat legend
        const legendY = 200;
        const threats = [
            { name: 'Phishing', color: '#ff4444', symbol: '@' },
            { name: 'Pig Butchering', color: '#ff8800', symbol: '$' },
            { name: 'Fake Romance', color: '#ff66aa', symbol: '\u2665' },
            { name: 'Celeb-Bait', color: '#ffcc00', symbol: '\u2605' },
        ];

        this.add.text(cx, legendY, '--- INCOMING THREATS ---', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#666666',
        }).setOrigin(0.5);

        threats.forEach((t, i) => {
            this.add.text(cx - 80, legendY + 25 + i * 20, `${t.symbol}  ${t.name}`, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: t.color,
            });
        });

        // Controls — detect mobile vs desktop
        const isMobile = !this.sys.game.device.os.desktop;
        const ctrlY = 330;
        this.add.text(cx, ctrlY, '--- CONTROLS ---', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#666666',
        }).setOrigin(0.5);

        const controls = isMobile
            ? [
                'Tap anywhere to fire!',
            ]
            : [
                'Arrow Keys / A,D - Move',
                'Mouse Aim - Target',
                'Left Click - Fire',
                'P / Esc - Pause',
            ];
        controls.forEach((c, i) => {
            this.add.text(cx, ctrlY + 25 + i * 20, c, {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#888888',
            }).setOrigin(0.5);
        });

        // Tagline
        const taglineY = ctrlY + 25 + controls.length * 20 + 15;
        this.add.text(cx, taglineY, 'Destroy scams before they reach your users!', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ff6644',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.text(cx, 460, '[ START GAME ]', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: startBtn,
            alpha: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1,
        });

        startBtn.on('pointerdown', () => {
            this.game.audio.init();
            this.game.audio.playMenuSelect();
            this.scene.start('GameScene');
        });

        // Also start with Enter
        this.input.keyboard.on('keydown-ENTER', () => {
            this.game.audio.init();
            this.game.audio.playMenuSelect();
            this.scene.start('GameScene');
        });

        // High scores
        this._showHighScores(cx);
    }

    _showHighScores(cx) {
        const scores = this._getHighScores();
        if (scores.length === 0) return;

        const startY = 510;
        this.add.text(cx, startY, '--- HIGH SCORES ---', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#666666',
        }).setOrigin(0.5);

        scores.forEach((entry, i) => {
            this.add.text(cx, startY + 20 + i * 18, `${i + 1}. ${entry.name.padEnd(5)} ${String(entry.score).padStart(8)}`, {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: i === 0 ? '#ffcc00' : '#888888',
            }).setOrigin(0.5);
        });
    }

    _getHighScores() {
        try {
            const data = localStorage.getItem(CONFIG.HIGH_SCORES.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }
}
