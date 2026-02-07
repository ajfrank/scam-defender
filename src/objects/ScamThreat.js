import { CONFIG } from '../config.js';

const THREAT_VISUALS = {
    phishing: {
        color: CONFIG.COLORS.THREAT_PHISHING,
        label: '@',
        name: 'Phishing',
    },
    pig_butchering: {
        color: CONFIG.COLORS.THREAT_PIG_BUTCHERING,
        label: '$',
        name: 'Pig Butchering',
    },
    fake_romance: {
        color: CONFIG.COLORS.THREAT_FAKE_ROMANCE,
        label: '\u2665',
        name: 'Fake Romance',
    },
    celeb_bait: {
        color: CONFIG.COLORS.THREAT_CELEB_BAIT,
        label: '\u2605',
        name: 'Celeb-Bait',
    },
};

export class ScamThreat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, speed) {
        const textureKey = `threat_${type}`;
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.threatType = type;
        this.speed = speed;
        this.alive = true;
        this.visual = THREAT_VISUALS[type];

        this.setDisplaySize(CONFIG.THREATS.SIZE, CONFIG.THREATS.SIZE);
        this.setVelocityY(speed);

        // Slight wobble
        scene.tweens.add({
            targets: this,
            x: this.x + Phaser.Math.Between(-15, 15),
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    update() {
        // Off-screen cleanup is handled by GameScene._checkThreatDeviceCollisions
        // so the wave manager is properly notified
    }

    hit() {
        if (!this.alive) return false;
        this.alive = false;

        // Flash and destroy
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 150,
            onComplete: () => {
                this.destroy();
            },
        });

        return true;
    }
}
