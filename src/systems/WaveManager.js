import { CONFIG } from '../config.js';

export class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.wave = 0;
        this.threatsRemaining = 0;
        this.threatsSpawned = 0;
        this.threatsPerWave = 0;
        this.spawnTimer = null;
        this.waveActive = false;
        this.betweenWaves = false;
    }

    getSpawnDelay() {
        const delay = CONFIG.THREATS.BASE_SPAWN_DELAY - (this.wave * CONFIG.THREATS.SPAWN_DELAY_DECREMENT);
        return Math.max(delay, CONFIG.THREATS.MIN_SPAWN_DELAY);
    }

    getThreatSpeed() {
        return CONFIG.THREATS.BASE_SPEED + (this.wave * CONFIG.THREATS.SPEED_INCREMENT);
    }

    getThreatCount() {
        return CONFIG.THREATS.BASE_PER_WAVE + (this.wave * CONFIG.THREATS.PER_WAVE_INCREMENT);
    }

    startNextWave() {
        this.wave++;
        this.threatsPerWave = this.getThreatCount();
        this.threatsSpawned = 0;
        this.threatsRemaining = this.threatsPerWave;
        this.waveActive = true;
        this.betweenWaves = false;

        this._scheduleSpawn();
    }

    _scheduleSpawn() {
        if (this.threatsSpawned >= this.threatsPerWave) return;

        this.spawnTimer = this.scene.time.delayedCall(this.getSpawnDelay(), () => {
            if (!this.waveActive) return;
            this.scene.spawnThreat(this.getThreatSpeed());
            this.threatsSpawned++;

            if (this.threatsSpawned < this.threatsPerWave) {
                this._scheduleSpawn();
            }
        });
    }

    threatDestroyed() {
        this.threatsRemaining--;
        if (this.threatsRemaining <= 0 && this.threatsSpawned >= this.threatsPerWave) {
            this.waveActive = false;
            this.betweenWaves = true;
            this.scene.onWaveComplete(this.wave);
        }
    }

    // Called when a threat goes off-screen without hitting a device
    threatMissed() {
        this.threatsRemaining--;
        if (this.threatsRemaining <= 0 && this.threatsSpawned >= this.threatsPerWave) {
            this.waveActive = false;
            this.betweenWaves = true;
            this.scene.onWaveComplete(this.wave);
        }
    }

    destroy() {
        this.waveActive = false;
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
    }
}
