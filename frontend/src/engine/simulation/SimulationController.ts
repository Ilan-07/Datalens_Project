/**
 * SimulationController
 * ====================
 * Orchestrates the Real-Time Interactive System Simulation.
 * Reuses existing NavEnergyController and DepthCompressionController APIs.
 * Broadcasts events via SimulationBus and reads/writes EngineStateStore.
 */

import { engineStateStore } from './EngineStateStore';
import { simulationBus } from './SimulationBus';
import { navEnergyController } from '../navEffects/NavEnergyController';
import { stateManager } from '../MultiverseStateManager';

class SimulationControllerImpl {
    private continuousInterval: ReturnType<typeof setInterval> | null = null;
    private isRunning = false;

    /** Trigger a single collapse event through the existing system */
    triggerCollapse() {
        // Reuse existing NavEnergyController — no duplication
        navEnergyController.triggerTransition();
        simulationBus.emit('COLLAPSE_TRIGGER');
    }

    /** Send an energy pulse at current intensity */
    triggerEnergyPulse() {
        const intensity = engineStateStore.get('energyIntensity');
        stateManager.triggerEnergyBuild('simulation');
        simulationBus.emit('ENERGY_PULSE', { intensity });

        // Auto-decay back to stable after pulse
        setTimeout(() => {
            stateManager.triggerStable('simulation_decay');
        }, 800 * intensity);
    }

    /** Spike shader intensity briefly */
    triggerShaderSpike() {
        const freq = engineStateStore.get('glitchFrequency');
        if (!engineStateStore.get('glitchEnabled')) return;
        stateManager.triggerTear('simulation_spike');
        simulationBus.emit('SHADER_SPIKE', { frequency: freq });
    }

    /** Trigger depth compression pulse */
    triggerDepthPulse() {
        const depth = engineStateStore.get('compressionDepth');
        simulationBus.emit('DEPTH_PULSE', { depth });
        // The existing DepthCompressionController is triggered via NavEnergyController
        navEnergyController.triggerTransition();
    }

    /** Start continuous simulation loop */
    startContinuous(intervalMs = 2000) {
        if (this.isRunning) return;
        this.isRunning = true;

        this.continuousInterval = setInterval(() => {
            const params = engineStateStore.getState();

            // Cycle through effects based on params
            if (params.energyIntensity > 0.3) {
                this.triggerEnergyPulse();
            }
            if (params.glitchFrequency > 0.5 && params.glitchEnabled) {
                setTimeout(() => this.triggerShaderSpike(), 300);
            }
            if (params.compressionDepth > 0.4) {
                setTimeout(() => this.triggerDepthPulse(), 600);
            }
        }, intervalMs);

        simulationBus.emit('PARAM_CHANGE', { running: true });
    }

    /** Stop continuous simulation */
    stopContinuous() {
        if (this.continuousInterval) {
            clearInterval(this.continuousInterval);
            this.continuousInterval = null;
        }
        this.isRunning = false;
        simulationBus.emit('PARAM_CHANGE', { running: false });
    }

    /** Reset everything to defaults */
    reset() {
        this.stopContinuous();
        engineStateStore.reset();
        stateManager.triggerStable('simulation_reset');
        simulationBus.emit('RESET');
    }

    getIsRunning(): boolean {
        return this.isRunning;
    }

    destroy() {
        this.stopContinuous();
    }
}

export const simulationController = new SimulationControllerImpl();
