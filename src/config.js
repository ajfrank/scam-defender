// Game configuration constants
export const CONFIG = {
    // Canvas
    WIDTH: 1012,
    HEIGHT: 759,

    // Hero
    HERO: {
        SPEED: 300,
        FIRE_COOLDOWN: 400, // ms between shots
        Y_OFFSET: 50, // pixels from bottom
        SIZE: 64,
    },

    // Interceptor (hero's projectile)
    INTERCEPTOR: {
        SPEED: 500,
        EXPLOSION_RADIUS: 50,
        EXPLOSION_DURATION: 400, // ms
        SIZE: 32,
    },

    // Users (what you defend)
    DEVICES: {
        COUNT: 4,
        Y_OFFSET: 20, // pixels from bottom
        WIDTH: 48,
        HEIGHT: 48,
        SPACING: 185, // pixels between device centers
    },

    // Scam threats
    THREATS: {
        BASE_SPEED: 80,
        SPEED_INCREMENT: 25, // per wave
        BASE_SPAWN_DELAY: 2000, // ms between spawns
        SPAWN_DELAY_DECREMENT: 100, // ms faster per wave
        MIN_SPAWN_DELAY: 400,
        BASE_PER_WAVE: 5,
        PER_WAVE_INCREMENT: 2,
        TYPES: ['phishing', 'pig_butchering', 'fake_romance', 'celeb_bait'],
        SIZE: 40,
    },

    // Scoring
    SCORE: {
        PHISHING: 100,
        PIG_BUTCHERING: 200,
        FAKE_ROMANCE: 150,
        CELEB_BAIT: 125,
        MULTI_KILL_BONUS: 50, // per extra kill in one explosion
        WAVE_BONUS: 500,
    },

    // High scores
    HIGH_SCORES: {
        MAX_ENTRIES: 5,
        STORAGE_KEY: 'scamDefender_highScores',
    },

    // Colors
    COLORS: {
        BACKGROUND: 0x1a1a2e,
        HUD_TEXT: '#00ff88',
        TITLE_TEXT: '#00ff88',
        EXPLOSION: 0xff6600,
        DEVICE_PHONE: 0x4488ff,
        DEVICE_LAPTOP: 0x66aaff,
        DEVICE_DESKTOP: 0x88ccff,
        THREAT_PHISHING: 0xff4444,
        THREAT_PIG_BUTCHERING: 0xff8800,
        THREAT_FAKE_ROMANCE: 0xff66aa,
        THREAT_CELEB_BAIT: 0xffcc00,
    },
};
