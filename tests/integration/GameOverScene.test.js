import { GameOverScene } from '../../src/scenes/GameOverScene.js';
import { ScoreManager } from '../../src/systems/ScoreManager.js';

describe('GameOverScene', () => {
    let scene;
    let mockScoreManager;

    beforeEach(() => {
        scene = new GameOverScene();

        mockScoreManager = new ScoreManager();
        mockScoreManager.score = 500;
        mockScoreManager.cachedScores = [{ name: 'OLD', score: 100, timestamp: 1 }];
    });

    describe('init', () => {
        it('should store score and wave from data', () => {
            scene.init({ score: 1000, wave: 5, scoreManager: mockScoreManager });
            expect(scene.finalScore).toBe(1000);
            expect(scene.finalWave).toBe(5);
        });

        it('should default score and wave to 0 if not provided', () => {
            scene.init({});
            expect(scene.finalScore).toBe(0);
            expect(scene.finalWave).toBe(0);
        });

        it('should use provided scoreManager', () => {
            scene.init({ scoreManager: mockScoreManager });
            expect(scene.scoreManager).toBe(mockScoreManager);
        });

        it('should create a new ScoreManager if none provided', () => {
            scene.init({});
            expect(scene.scoreManager).toBeInstanceOf(ScoreManager);
        });
    });

    describe('_addInitialChar', () => {
        beforeEach(() => {
            scene.init({ score: 500, wave: 3, scoreManager: mockScoreManager });
            scene.create();
            // Set up the initials state as _showHighScoreEntry would
            scene.initials = '';
            scene.initialsText = { setText: vi.fn() };
            scene.letterButtons = null;
            scene.backspaceBtn = null;
        });

        it('should append character to initials string', () => {
            scene._addInitialChar('A', 500);
            expect(scene.initials).toBe('A');
        });

        it('should accumulate characters', () => {
            scene._addInitialChar('A', 500);
            scene._addInitialChar('B', 500);
            expect(scene.initials).toBe('AB');
        });

        it('should not exceed 3 characters', () => {
            // Need to mock saveHighScore to prevent it from running side effects
            mockScoreManager.saveHighScore = vi.fn().mockResolvedValue([]);

            scene._addInitialChar('A', 500);
            scene._addInitialChar('B', 500);
            scene._addInitialChar('C', 500);
            scene._addInitialChar('D', 500);
            expect(scene.initials).toBe('ABC');
        });

        it('should play menu select audio', () => {
            scene._addInitialChar('A', 500);
            expect(scene.game.audio.playMenuSelect).toHaveBeenCalled();
        });

        it('should save high score when 3rd character entered', () => {
            const saveSpy = vi.spyOn(mockScoreManager, 'saveHighScore').mockResolvedValue([]);
            scene._addInitialChar('A', 500);
            scene._addInitialChar('B', 500);
            scene._addInitialChar('C', 500);
            expect(saveSpy).toHaveBeenCalledWith('ABC');
        });
    });

    describe('_updateInitialsDisplay', () => {
        beforeEach(() => {
            scene.init({ score: 500, scoreManager: mockScoreManager });
            scene.initialsText = { setText: vi.fn() };
        });

        it('should pad initials to 3 characters with underscores', () => {
            scene.initials = 'A';
            scene._updateInitialsDisplay();
            expect(scene.initialsText.setText).toHaveBeenCalledWith('A _ _');
        });

        it('should show all 3 characters when complete', () => {
            scene.initials = 'ABC';
            scene._updateInitialsDisplay();
            expect(scene.initialsText.setText).toHaveBeenCalledWith('A B C');
        });
    });
});
