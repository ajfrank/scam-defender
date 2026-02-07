import { CONFIG } from '../config.js';
import { Hero } from '../objects/Hero.js';
import { Interceptor } from '../objects/Interceptor.js';
import { ScamThreat } from '../objects/ScamThreat.js';
import { Device } from '../objects/Device.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { WaveManager } from '../systems/WaveManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.audio = this.game.audio;
        this.scoreManager = new ScoreManager();
        this.waveManager = new WaveManager(this);
        this.paused = false;

        // Groups
        this.interceptors = [];
        this.threats = [];
        this.devices = [];
        this.explodedThreats = new Set(); // track already-hit threats per explosion

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            a: this.input.keyboard.addKey('A'),
            d: this.input.keyboard.addKey('D'),
            p: this.input.keyboard.addKey('P'),
        };

        // Pause handling
        this.input.keyboard.on('keydown-P', () => this.togglePause());
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());

        // Create devices
        this._createDevices();

        // Create hero
        this.hero = new Hero(
            this,
            CONFIG.WIDTH / 2,
            CONFIG.HEIGHT - CONFIG.HERO.Y_OFFSET
        );

        // Fire on click/tap
        this.input.on('pointerdown', (pointer) => {
            if (this.paused) return;
            // Move hero toward tap X on mobile
            this.hero.targetX = pointer.worldX;
            if (this.hero.canFire()) {
                this.fireInterceptor(pointer.worldX, pointer.worldY);
            }
        });

        // HUD
        this._createHUD();

        // Start first wave after brief delay
        this.time.delayedCall(1500, () => {
            this.waveManager.startNextWave();
            this._showWaveText(1);
        });

        // Crosshair cursor
        this.input.setDefaultCursor('crosshair');
    }

    _createDevices() {
        const count = CONFIG.DEVICES.COUNT;
        const totalWidth = (count - 1) * CONFIG.DEVICES.SPACING;
        const startX = (CONFIG.WIDTH - totalWidth) / 2;
        const y = CONFIG.HEIGHT - CONFIG.DEVICES.Y_OFFSET;

        for (let i = 0; i < count; i++) {
            const device = new Device(this, startX + i * CONFIG.DEVICES.SPACING, y, i);
            this.devices.push(device);
        }
    }

    _createHUD() {
        this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.HUD_TEXT,
        }).setDepth(100);

        this.waveText = this.add.text(CONFIG.WIDTH / 2, 10, 'WAVE: 1', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.HUD_TEXT,
        }).setOrigin(0.5, 0).setDepth(100);

        const aliveCount = this.devices.filter(d => d.alive).length;
        this.devicesText = this.add.text(CONFIG.WIDTH - 10, 10, `USERS: ${aliveCount}/${CONFIG.DEVICES.COUNT}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.HUD_TEXT,
        }).setOrigin(1, 0).setDepth(100);

        // Pause overlay (hidden initially)
        this.pauseOverlay = this.add.rectangle(
            CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
            CONFIG.WIDTH, CONFIG.HEIGHT,
            0x000000, 0.7
        ).setDepth(200).setVisible(false);

        this.pauseText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'PAUSED', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(201).setVisible(false);
    }

    togglePause() {
        this.paused = !this.paused;
        this.pauseOverlay.setVisible(this.paused);
        this.pauseText.setVisible(this.paused);

        if (this.paused) {
            this.physics.pause();
            this.tweens.pauseAll();
        } else {
            this.physics.resume();
            this.tweens.resumeAll();
        }
    }

    fireInterceptor(targetX, targetY) {
        this.hero.fire();
        this.audio.playShoot();

        const interceptor = new Interceptor(
            this,
            this.hero.x,
            this.hero.y - CONFIG.HERO.SIZE / 2,
            targetX,
            targetY
        );
        this.interceptors.push(interceptor);
    }

    spawnThreat(speed) {
        const type = Phaser.Utils.Array.GetRandom(CONFIG.THREATS.TYPES);
        const margin = 40;
        const x = Phaser.Math.Between(margin, CONFIG.WIDTH - margin);

        const threat = new ScamThreat(this, x, -CONFIG.THREATS.SIZE, type, speed);
        this.threats.push(threat);
    }

    checkExplosionCollision(ex, ey, radius) {
        let killCount = 0;

        for (let i = this.threats.length - 1; i >= 0; i--) {
            const threat = this.threats[i];
            if (!threat.alive || !threat.active) continue;
            if (this.explodedThreats.has(threat)) continue;

            const dist = Phaser.Math.Distance.Between(ex, ey, threat.x, threat.y);
            if (dist <= radius + CONFIG.THREATS.SIZE / 2) {
                this.explodedThreats.add(threat);
                killCount++;
                const points = this.scoreManager.addScore(threat.threatType, killCount);
                threat.hit();
                this.audio.playThreatDestroyed();

                // Show floating score
                this._showFloatingScore(threat.x, threat.y, points);

                // Notify wave manager
                this.waveManager.threatDestroyed();
            }
        }
    }

    _showFloatingScore(x, y, points) {
        const text = this.add.text(x, y, `+${points}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffcc00',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => text.destroy(),
        });
    }

    _showWaveText(waveNum) {
        const text = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 50, `WAVE ${waveNum}`, {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: CONFIG.COLORS.TITLE_TEXT,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: text,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => text.destroy(),
        });
    }

    onWaveComplete(waveNum) {
        const bonus = this.scoreManager.addWaveBonus();
        this.audio.playWaveComplete();

        // Show wave complete text
        const text = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, `WAVE ${waveNum} COMPLETE!\n+${bonus} BONUS`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffcc00',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: CONFIG.HEIGHT / 2 - 40,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => text.destroy(),
        });

        // Start next wave after delay
        this.time.delayedCall(3000, () => {
            this.waveManager.startNextWave();
            this._showWaveText(this.waveManager.wave);
        });
    }

    _checkThreatDeviceCollisions() {
        for (let i = this.threats.length - 1; i >= 0; i--) {
            const threat = this.threats[i];
            if (!threat.alive || !threat.active) continue;

            // Check if threat has reached device level
            if (threat.y >= CONFIG.HEIGHT - CONFIG.DEVICES.Y_OFFSET - CONFIG.DEVICES.HEIGHT / 2) {
                // Find nearest alive device within direct hit range
                let hitDevice = null;
                let minDist = Infinity;

                for (const device of this.devices) {
                    if (!device.alive) continue;
                    const dist = Math.abs(threat.x - device.x);
                    if (dist < CONFIG.DEVICES.WIDTH / 2 + CONFIG.THREATS.SIZE / 2 && dist < minDist) {
                        minDist = dist;
                        hitDevice = device;
                    }
                }

                if (hitDevice) {
                    // Direct hit on a device
                    threat.alive = false;
                    threat.destroy();
                    hitDevice.hit();
                    this.audio.playDeviceHit();
                    this.cameras.main.shake(200, 0.01);
                    this.waveManager.threatDestroyed();
                } else if (threat.y > CONFIG.HEIGHT + 20) {
                    // Got past defender — destroy nearest alive device
                    threat.alive = false;
                    threat.destroy();

                    let closestDevice = null;
                    let closestDist = Infinity;
                    for (const device of this.devices) {
                        if (!device.alive) continue;
                        const dist = Math.abs(threat.x - device.x);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestDevice = device;
                        }
                    }

                    if (closestDevice) {
                        closestDevice.hit();
                        this.audio.playDeviceHit();
                        this.cameras.main.shake(200, 0.01);
                    }

                    this.waveManager.threatMissed();
                }
            }
        }
    }

    _checkGameOver() {
        const aliveDevices = this.devices.filter(d => d.alive);
        if (aliveDevices.length === 0) {
            this.audio.playGameOver();
            this.waveManager.destroy();

            // Brief delay then game over
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', {
                    score: this.scoreManager.getScore(),
                    wave: this.waveManager.wave,
                    scoreManager: this.scoreManager,
                });
            });

            // Prevent further updates
            this.paused = true;
        }
    }

    update() {
        if (this.paused) return;

        // Clear explosion tracking each frame
        this.explodedThreats.clear();

        // Update hero
        this.hero.update(this.cursors, this.input.activePointer);

        // Update interceptors
        for (let i = this.interceptors.length - 1; i >= 0; i--) {
            const interceptor = this.interceptors[i];
            if (!interceptor.active) {
                this.interceptors.splice(i, 1);
                continue;
            }
            interceptor.update();
        }

        // Update threats
        for (let i = this.threats.length - 1; i >= 0; i--) {
            const threat = this.threats[i];
            if (!threat.active) {
                this.threats.splice(i, 1);
                continue;
            }
            threat.update();
        }

        // Check collisions
        this._checkThreatDeviceCollisions();

        // Update HUD
        this.scoreText.setText(`SCORE: ${this.scoreManager.getScore()}`);
        this.waveText.setText(`WAVE: ${this.waveManager.wave}`);
        const aliveCount = this.devices.filter(d => d.alive).length;
        this.devicesText.setText(`USERS: ${aliveCount}/${CONFIG.DEVICES.COUNT}`);

        // Color the devices count based on remaining
        if (aliveCount <= 1) {
            this.devicesText.setColor('#ff4444');
        } else if (aliveCount <= 2) {
            this.devicesText.setColor('#ff8800');
        }

        // Check game over
        this._checkGameOver();
    }
}
