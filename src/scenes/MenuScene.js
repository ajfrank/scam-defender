import { CONFIG } from '../config.js';
import { AudioManager } from '../systems/AudioManager.js';
import { ScoreManager } from '../systems/ScoreManager.js';

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
        this.add.text(cx, 55, 'SCAM DEFENDER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, 100, "Protect Meta's users from scams!", {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        // Threat legend
        const legendY = 140;
        const threats = [
            { name: 'Phishing', color: '#ff4444', symbol: '@' },
            { name: 'Pig Butchering', color: '#ff8800', symbol: '$' },
            { name: 'Fake Romance', color: '#ff66aa', symbol: '\u2665' },
            { name: 'Celeb-Bait', color: '#ffcc00', symbol: '\u2605' },
        ];

        this.add.text(cx, legendY, '--- INCOMING THREATS ---', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666666',
        }).setOrigin(0.5);

        threats.forEach((t, i) => {
            this.add.text(cx - 100, legendY + 28 + i * 24, `${t.symbol}  ${t.name}`, {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: t.color,
            });
        });

        // Controls — detect mobile vs desktop
        const isMobile = !this.sys.game.device.os.desktop;
        const ctrlY = 295;
        this.add.text(cx, ctrlY, '--- CONTROLS ---', {
            fontSize: '14px',
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
            this.add.text(cx, ctrlY + 32 + i * 26, c, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#888888',
            }).setOrigin(0.5);
        });

        // Tagline
        const taglineY = ctrlY + 32 + controls.length * 26 + 20;
        this.add.text(cx, taglineY, 'Destroy scams before they reach your users!', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ff6644',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Start button
        const startBtnY = taglineY + 45;
        const startBtn = this.add.text(cx, startBtnY, '[ START GAME ]', {
            fontSize: '32px',
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

        // High scores — fetch from server then display
        this._loadAndShowHighScores(cx, startBtnY + 30);
    }

    async _loadAndShowHighScores(cx, startY) {
        const sm = new ScoreManager();
        const scores = await sm.fetchHighScores();
        if (scores.length === 0) return;

        this.add.text(cx, startY, '--- HIGH SCORES ---', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666666',
        }).setOrigin(0.5);

        scores.slice(0, 6).forEach((entry, i) => {
            this.add.text(cx, startY + 24 + i * 22, `${i + 1}. ${entry.name.padEnd(5)} ${String(entry.score).padStart(8)}`, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: i === 0 ? '#ffcc00' : '#888888',
            }).setOrigin(0.5);
        });
    }
}
