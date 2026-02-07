import { CONFIG } from '../config.js';

export class Interceptor extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, targetX, targetY) {
        // Use missile texture if available, otherwise use generated
        const textureKey = scene.textures.exists('missile') ? 'missile' : 'interceptor_generated';
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.targetX = targetX;
        this.targetY = targetY;
        this.hasExploded = false;

        this.setDisplaySize(16, 32);

        // Calculate velocity toward target
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        this.setRotation(angle + Math.PI / 2);
        this.setVelocity(
            Math.cos(angle) * CONFIG.INTERCEPTOR.SPEED,
            Math.sin(angle) * CONFIG.INTERCEPTOR.SPEED
        );

        // Trail particles
        try {
            this.trail = scene.add.particles(0, 0, 'particle', {
                follow: this,
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.6, end: 0 },
                speed: 20,
                lifespan: 200,
                frequency: 30,
                tint: 0x00ff88,
            });
        } catch {
            this.trail = null;
        }
    }

    update() {
        if (this.hasExploded) return;

        // Check if reached target area
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
        if (dist < 10) {
            this.explode();
        }

        // Destroy if off screen
        if (this.y < -50 || this.x < -50 || this.x > CONFIG.WIDTH + 50) {
            this.cleanup();
        }
    }

    explode() {
        if (this.hasExploded) return;
        this.hasExploded = true;
        this.setVelocity(0, 0);
        this.setVisible(false);

        const ex = this.x;
        const ey = this.y;
        const scene = this.scene;

        // Use a proxy object to tween radius
        const state = { radius: 5, alpha: 0.8 };

        // Create explosion graphics
        const gfx = scene.add.graphics();
        this.explosionGfx = gfx;

        scene.tweens.add({
            targets: state,
            radius: CONFIG.INTERCEPTOR.EXPLOSION_RADIUS,
            alpha: 0,
            duration: CONFIG.INTERCEPTOR.EXPLOSION_DURATION,
            ease: 'Power2',
            onUpdate: () => {
                gfx.clear();
                gfx.fillStyle(CONFIG.COLORS.EXPLOSION, state.alpha);
                gfx.fillCircle(ex, ey, state.radius);
                scene.checkExplosionCollision(ex, ey, state.radius);
            },
            onComplete: () => {
                gfx.destroy();
                this.cleanup();
            },
        });

        scene.audio.playExplosion();
    }

    cleanup() {
        if (this.trail) {
            this.trail.destroy();
            this.trail = null;
        }
        if (this.explosionGfx) {
            this.explosionGfx.destroy();
            this.explosionGfx = null;
        }
        this.destroy();
    }
}
