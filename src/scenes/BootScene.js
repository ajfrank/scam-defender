import { CONFIG } from '../config.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Show loading text
        const loadingText = this.add.text(
            CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            'LOADING...',
            { fontSize: '24px', fontFamily: 'monospace', color: CONFIG.COLORS.HUD_TEXT }
        ).setOrigin(0.5);

        // Try to load user-provided SVGs
        this.load.on('loaderror', (file) => {
            console.warn(`Could not load: ${file.key} (${file.url}) - will use generated graphics`);
        });

        // Attempt to load SVG sprites
        this.load.svg('hero', 'assets/sprites/hero.svg', { width: CONFIG.HERO.SIZE, height: CONFIG.HERO.SIZE });
        this.load.svg('missile', 'assets/sprites/missile.svg', { width: 16, height: 32 });
    }

    create() {
        // Generate textures that are always needed
        this._generateParticleTexture();
        this._generateThreatTextures();
        this._generateInterceptorTexture();

        this.scene.start('MenuScene');
    }

    _generateParticleTexture() {
        const g = this.add.graphics();
        g.fillStyle(0xffffff);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);
        g.destroy();
    }

    _generateThreatTextures() {
        const types = {
            phishing: { color: CONFIG.COLORS.THREAT_PHISHING, symbol: '@' },
            pig_butchering: { color: CONFIG.COLORS.THREAT_PIG_BUTCHERING, symbol: '$' },
            fake_romance: { color: CONFIG.COLORS.THREAT_FAKE_ROMANCE, symbol: '\u2665' },
            celeb_bait: { color: CONFIG.COLORS.THREAT_CELEB_BAIT, symbol: '\u2605' },
        };

        const s = CONFIG.THREATS.SIZE;
        for (const [key, info] of Object.entries(types)) {
            const g = this.add.graphics();

            // Body
            g.fillStyle(info.color, 0.9);
            g.fillRoundedRect(0, 0, s, s, 6);

            // Border
            g.lineStyle(2, 0xffffff, 0.5);
            g.strokeRoundedRect(0, 0, s, s, 6);

            // Inner glow
            g.fillStyle(0xffffff, 0.15);
            g.fillRoundedRect(4, 4, s - 8, s / 2 - 4, 3);

            g.generateTexture(`threat_${key}`, s, s);
            g.destroy();

            // Add symbol text on top
            // We'll render it in the scene since textures don't support text easily
        }
    }

    _generateInterceptorTexture() {
        if (this.textures.exists('missile')) return;

        const g = this.add.graphics();
        g.fillStyle(0x00ff88);
        g.fillTriangle(8, 0, 2, 28, 14, 28);
        g.fillStyle(0x00cc66);
        g.fillRect(5, 20, 6, 12);
        g.generateTexture('interceptor_generated', 16, 32);
        g.destroy();
    }
}
