// Global test setup — runs before every test file
import Phaser from './__mocks__/phaser.js';

// Make Phaser available globally (game code references bare `Phaser` from CDN)
globalThis.Phaser = Phaser;

// Mock fetch globally
globalThis.fetch = vi.fn();

// Mock AudioContext
const createMockAudioContext = () => ({
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => ({
        type: '',
        frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
    })),
    createGain: vi.fn(() => ({
        gain: {
            value: 1,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
    })),
    createBuffer: vi.fn((channels, length, sampleRate) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
    })),
    createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        disconnect: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
        type: '',
        frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
    })),
});

globalThis.AudioContext = vi.fn(createMockAudioContext);
globalThis.webkitAudioContext = undefined;

// AudioManager uses window.AudioContext, so provide window in Node
if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
}

// Mock localStorage for Node environment
const store = {};
globalThis.localStorage = {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
};

// Reset mocks between tests
beforeEach(() => {
    // Clear store before clearing mock history so localStorage.clear()
    // doesn't leave a phantom call in its mock.calls
    Object.keys(store).forEach(k => delete store[k]);
    vi.clearAllMocks();
    fetch.mockReset();
});
