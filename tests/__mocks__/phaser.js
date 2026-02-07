// Lightweight Phaser mock for testing game logic without real Canvas/WebGL
// Provides stub classes matching the Phaser APIs used across all source files

class MockGameObject {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.active = true;
        this.alpha = 1;
        this.scaleX = 1;
        this.scaleY = 1;
        this.visible = true;
        this.depth = 0;
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.width = 0;
        this.height = 0;
        this.rotation = 0;
    }
    setVisible(v) { this.visible = v; return this; }
    setDepth(d) { this.depth = d; return this; }
    setOrigin() { return this; }
    setDisplaySize(w, h) { this.displayWidth = w; this.displayHeight = h; return this; }
    setSize(w, h) { this.width = w; this.height = h; return this; }
    setRotation(r) { this.rotation = r; return this; }
    setInteractive() { return this; }
    destroy() { this.active = false; }
}

class Container extends MockGameObject {
    constructor(scene, x, y) {
        super();
        this.scene = scene;
        this.x = x || 0;
        this.y = y || 0;
        this.children = [];
    }
    add(child) { this.children.push(child); return this; }
}

class ArcadeSprite extends MockGameObject {
    constructor(scene, x, y, texture) {
        super();
        this.scene = scene;
        this.x = x || 0;
        this.y = y || 0;
        this.texture = texture;
        this.body = { velocity: { x: 0, y: 0 } };
    }
    setVelocity(vx, vy) {
        this.body.velocity.x = vx;
        this.body.velocity.y = vy;
        return this;
    }
    setVelocityY(vy) {
        this.body.velocity.y = vy;
        return this;
    }
}

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

function createMockGraphics() {
    return {
        fillStyle: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        fillTriangle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        strokePath: vi.fn().mockReturnThis(),
        beginPath: vi.fn().mockReturnThis(),
        arc: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        generateTexture: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        alpha: 1,
    };
}

function createMockText() {
    const textObj = {
        setText: vi.fn().mockReturnThis(),
        setColor: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        x: 0,
        y: 0,
        text: '',
    };
    return textObj;
}

function createMockAdd() {
    return {
        existing: vi.fn(),
        text: vi.fn(() => createMockText()),
        image: vi.fn((x, y, key) => {
            const img = new MockGameObject();
            img.x = x;
            img.y = y;
            return img;
        }),
        rectangle: vi.fn((x, y, w, h, color) => {
            const rect = new MockGameObject();
            rect.x = x;
            rect.y = y;
            rect.setRotation = vi.fn().mockReturnThis();
            return rect;
        }),
        graphics: vi.fn(() => createMockGraphics()),
        particles: vi.fn(() => ({ destroy: vi.fn() })),
    };
}

function createMockScene() {
    return {
        scene: { start: vi.fn(), isActive: vi.fn(() => true) },
        add: createMockAdd(),
        physics: {
            add: { existing: vi.fn() },
            pause: vi.fn(),
            resume: vi.fn(),
        },
        input: {
            keyboard: {
                createCursorKeys: vi.fn(() => ({
                    left: { isDown: false },
                    right: { isDown: false },
                    up: { isDown: false },
                    down: { isDown: false },
                })),
                addKey: vi.fn(() => ({ isDown: false })),
                on: vi.fn(),
            },
            on: vi.fn(),
            activePointer: { worldX: 0, worldY: 0 },
            setDefaultCursor: vi.fn(),
        },
        tweens: {
            add: vi.fn((config) => {
                const tween = { stop: vi.fn(), destroy: vi.fn() };
                // Call onComplete synchronously for test determinism
                if (config && config.onComplete) {
                    config.onComplete();
                }
                return tween;
            }),
            pauseAll: vi.fn(),
            resumeAll: vi.fn(),
        },
        time: {
            now: 0,
            delayedCall: vi.fn((delay, callback) => {
                return { destroy: vi.fn(), callback, delay };
            }),
            addEvent: vi.fn((config) => {
                return { destroy: vi.fn(), ...config };
            }),
        },
        cameras: { main: { shake: vi.fn() } },
        textures: { exists: vi.fn(() => false) },
        sys: { game: { device: { os: { desktop: true } } } },
        game: {
            audio: {
                init: vi.fn(),
                playShoot: vi.fn(),
                playExplosion: vi.fn(),
                playThreatDestroyed: vi.fn(),
                playDeviceHit: vi.fn(),
                playGameOver: vi.fn(),
                playWaveComplete: vi.fn(),
                playMenuSelect: vi.fn(),
            },
            loop: { delta: 16.67 },
        },
        load: { on: vi.fn(), svg: vi.fn() },
        keys: {
            a: { isDown: false },
            d: { isDown: false },
            p: { isDown: false },
        },
    };
}

class Scene {
    constructor(config) {
        this.key = config?.key || '';
        const mock = createMockScene();
        Object.assign(this, mock);
    }
}

const Phaser = {
    GameObjects: { Container },
    Physics: { Arcade: { Sprite: ArcadeSprite } },
    Scene,
    Geom: { Rectangle },
    Math: {
        Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
        Angle: {
            Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
        },
        Distance: {
            Between: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        },
        Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    },
    Utils: {
        Array: {
            GetRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
        },
    },
    Scale: { FIT: 1, CENTER_BOTH: 2 },
    AUTO: 0,
    Game: vi.fn(),
};

// Export for module use and attach factory helper
Phaser._createMockScene = createMockScene;

export default Phaser;
export { createMockScene, createMockGraphics, createMockText };
