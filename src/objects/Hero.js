import { CONFIG } from '../config.js';

export class Hero extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);

        this.lastFireTime = 0;
        this.speed = CONFIG.HERO.SPEED;
        this.targetX = x; // for mobile touch tracking

        // Try to use SVG texture, fall back to generated graphic
        if (scene.textures.exists('hero')) {
            this.sprite = scene.add.image(0, 0, 'hero');
            this.sprite.setDisplaySize(CONFIG.HERO.SIZE, CONFIG.HERO.SIZE);
        } else {
            this.sprite = this._createPlaceholder(scene);
        }
        this.add(this.sprite);

        // Barrel/turret indicator
        this.barrel = scene.add.rectangle(0, -CONFIG.HERO.SIZE / 2 - 8, 6, 20, 0x00ff88);
        this.add(this.barrel);

        this.setSize(CONFIG.HERO.SIZE, CONFIG.HERO.SIZE);
    }

    _createPlaceholder(scene) {
        const g = scene.add.graphics();
        const s = CONFIG.HERO.SIZE;

        // Shield base
        g.fillStyle(0x00aa66);
        g.fillRoundedRect(-s / 2, -s / 2, s, s, 8);

        // Shield emblem
        g.fillStyle(0x00ff88);
        g.fillTriangle(0, -s / 4, -s / 4, s / 4, s / 4, s / 4);

        // Border
        g.lineStyle(2, 0x00ff88);
        g.strokeRoundedRect(-s / 2, -s / 2, s, s, 8);

        g.generateTexture('hero_generated', s, s);
        g.destroy();

        const sprite = scene.add.image(0, 0, 'hero_generated');
        return sprite;
    }

    update(cursors, pointer) {
        // Keyboard movement
        if (cursors.left.isDown || this.scene.keys.a.isDown) {
            this.x -= this.speed * this.scene.game.loop.delta / 1000;
            this.targetX = this.x;
        } else if (cursors.right.isDown || this.scene.keys.d.isDown) {
            this.x += this.speed * this.scene.game.loop.delta / 1000;
            this.targetX = this.x;
        } else {
            // Mobile: slide toward last tap X position
            const diff = this.targetX - this.x;
            if (Math.abs(diff) > 2) {
                this.x += Math.sign(diff) * Math.min(this.speed * this.scene.game.loop.delta / 1000, Math.abs(diff));
            }
        }

        // Clamp to screen bounds
        this.x = Phaser.Math.Clamp(this.x, CONFIG.HERO.SIZE / 2, CONFIG.WIDTH - CONFIG.HERO.SIZE / 2);

        // Rotate barrel toward mouse
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        this.barrel.setRotation(angle + Math.PI / 2);
    }

    canFire() {
        return this.scene.time.now - this.lastFireTime >= CONFIG.HERO.FIRE_COOLDOWN;
    }

    fire() {
        this.lastFireTime = this.scene.time.now;
    }
}
