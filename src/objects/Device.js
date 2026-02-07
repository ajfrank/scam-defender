import { CONFIG } from '../config.js';

const USER_TYPES = [
    { name: 'User', skinColor: 0xf0c8a0, shirtColor: 0x4488ff },
    { name: 'User', skinColor: 0xd4a373, shirtColor: 0x44bb66 },
    { name: 'User', skinColor: 0x8d6e4c, shirtColor: 0xcc5544 },
    { name: 'User', skinColor: 0xf5deb3, shirtColor: 0x9955cc },
];

export class Device extends Phaser.GameObjects.Container {
    constructor(scene, x, y, index) {
        super(scene, x, y);
        scene.add.existing(this);

        this.alive = true;
        this.userInfo = USER_TYPES[index % USER_TYPES.length];

        const w = CONFIG.DEVICES.WIDTH;
        const h = CONFIG.DEVICES.HEIGHT;

        // Draw user avatar using graphics
        this.avatar = scene.add.graphics();
        this._drawAvatar();
        this.add(this.avatar);

        // Name label below
        this.typeName = scene.add.text(0, h / 2 + 8, this.userInfo.name, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
        }).setOrigin(0.5);
        this.add(this.typeName);

        this.setSize(w, h);
    }

    _drawAvatar() {
        const g = this.avatar;
        const info = this.userInfo;

        // Body / shirt
        g.fillStyle(info.shirtColor);
        g.fillRoundedRect(-16, 8, 32, 20, 4);

        // Head
        g.fillStyle(info.skinColor);
        g.fillCircle(0, -4, 14);

        // Eyes
        g.fillStyle(0x222222);
        g.fillCircle(-5, -6, 2);
        g.fillCircle(5, -6, 2);

        // Smile
        g.lineStyle(1.5, 0x222222);
        g.beginPath();
        g.arc(0, -2, 6, 0.2, Math.PI - 0.2, false);
        g.strokePath();

        // Outline glow
        g.lineStyle(1, 0x00ff88, 0.5);
        g.strokeCircle(0, -4, 16);
    }

    hit() {
        if (!this.alive) return false;
        this.alive = false;

        // Flash red then fade
        let flashCount = 0;
        this.scene.time.addEvent({
            delay: 100,
            repeat: 5,
            callback: () => {
                flashCount++;
                this.avatar.clear();
                if (flashCount % 2 === 1) {
                    // Red flash — redraw with red tint
                    const info = { ...this.userInfo, skinColor: 0xff4444, shirtColor: 0xff0000 };
                    const saved = this.userInfo;
                    this.userInfo = info;
                    this._drawAvatar();
                    this.userInfo = saved;
                } else {
                    this._drawAvatar();
                }
            },
        });

        this.scene.time.delayedCall(700, () => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 300,
                ease: 'Power2',
            });
        });

        return true;
    }

    getBounds() {
        return new Phaser.Geom.Rectangle(
            this.x - CONFIG.DEVICES.WIDTH / 2,
            this.y - CONFIG.DEVICES.HEIGHT / 2,
            CONFIG.DEVICES.WIDTH,
            CONFIG.DEVICES.HEIGHT
        );
    }
}
