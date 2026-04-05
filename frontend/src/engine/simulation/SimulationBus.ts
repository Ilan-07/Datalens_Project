/**
 * SimulationBus
 * =============
 * Typed event bus for cross-system communication.
 * Bridges new simulation subsystem to existing controllers
 * (NavEnergyController, DepthCompressionController, stateManager).
 */

export type SimulationEvent =
    | 'COLLAPSE_TRIGGER'
    | 'ENERGY_PULSE'
    | 'SHADER_SPIKE'
    | 'DEPTH_PULSE'
    | 'SCROLL_ACCEL'
    | 'PARAM_CHANGE'
    | 'RESET'
    | 'LIGHTING_UPDATE';

type EventPayload = Record<string, unknown>;
type Handler = (event: SimulationEvent, payload?: EventPayload) => void;

class SimulationBusImpl {
    private handlers: Map<SimulationEvent, Set<Handler>> = new Map();
    private globalHandlers: Set<Handler> = new Set();

    on(event: SimulationEvent, handler: Handler): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);
        return () => { this.handlers.get(event)?.delete(handler); };
    }

    onAny(handler: Handler): () => void {
        this.globalHandlers.add(handler);
        return () => { this.globalHandlers.delete(handler); };
    }

    emit(event: SimulationEvent, payload?: EventPayload) {
        this.handlers.get(event)?.forEach(fn => fn(event, payload));
        this.globalHandlers.forEach(fn => fn(event, payload));
    }

    off(event: SimulationEvent, handler: Handler) {
        this.handlers.get(event)?.delete(handler);
    }

    clear() {
        this.handlers.clear();
        this.globalHandlers.clear();
    }
}

export const simulationBus = new SimulationBusImpl();
