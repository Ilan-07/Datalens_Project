import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { engineStateStore, type EngineParams } from '@/engine/simulation/EngineStateStore';
import { simulationController } from '@/engine/simulation/SimulationController';

interface SliderConfig {
    key: keyof EngineParams;
    label: string;
    min: number;
    max: number;
    step: number;
}

const SLIDERS: SliderConfig[] = [
    { key: 'energyIntensity', label: 'Energy Intensity', min: 0, max: 1, step: 0.01 },
    { key: 'glitchFrequency', label: 'Glitch Frequency', min: 0, max: 1, step: 0.01 },
    { key: 'compressionDepth', label: 'Compression Depth', min: 0, max: 1, step: 0.01 },
    { key: 'scrollAcceleration', label: 'Scroll Acceleration', min: 0, max: 1, step: 0.01 },
];

export const SimulationPanel = () => {
    const [params, setParams] = useState<EngineParams>(engineStateStore.getState());
    const [isRunning, setIsRunning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const unsub = engineStateStore.subscribe((newParams) => {
            setParams({ ...newParams });
        });
        return unsub;
    }, []);

    const handleSliderChange = useCallback((key: keyof EngineParams, value: number) => {
        engineStateStore.set({ [key]: value });
    }, []);

    const handleTriggerCollapse = useCallback(() => {
        simulationController.triggerCollapse();
    }, []);

    const handleToggleContinuous = useCallback(() => {
        if (isRunning) {
            simulationController.stopContinuous();
        } else {
            simulationController.startContinuous();
        }
        setIsRunning(!isRunning);
    }, [isRunning]);

    const handleReset = useCallback(() => {
        simulationController.reset();
        setIsRunning(false);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-6 z-[80] w-72"
        >
            {/* Header */}
            <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-full flex items-center justify-between px-4 py-3 bg-black/95 border border-spider-red/30 backdrop-blur-md cursor-pointer"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-spider-red">
                    System Simulation
                </span>
                <span className="text-dim text-xs">{isMinimized ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-black/95 border border-t-0 border-spider-red/20 backdrop-blur-md"
                    >
                        <div className="p-4 space-y-4">
                            {/* Sliders */}
                            {SLIDERS.map(({ key, label, min, max, step }) => (
                                <div key={key}>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono">
                                            {label}
                                        </label>
                                        <span className="text-[9px] text-spider-red font-mono">
                                            {(params[key] as number).toFixed(2)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={min}
                                        max={max}
                                        step={step}
                                        value={params[key] as number}
                                        onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-none appearance-none cursor-pointer
                                            [&::-webkit-slider-thumb]:appearance-none
                                            [&::-webkit-slider-thumb]:w-3
                                            [&::-webkit-slider-thumb]:h-3
                                            [&::-webkit-slider-thumb]:bg-spider-red
                                            [&::-webkit-slider-thumb]:border-0
                                            [&::-webkit-slider-thumb]:cursor-pointer"
                                    />
                                </div>
                            ))}

                            {/* Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                <button
                                    onClick={handleTriggerCollapse}
                                    className="px-3 py-2 border border-spider-red/40 text-[9px] text-spider-red font-black uppercase tracking-widest hover:bg-spider-red/10 transition-colors cursor-pointer"
                                >
                                    Collapse
                                </button>
                                <button
                                    onClick={handleToggleContinuous}
                                    className={`px-3 py-2 border text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer ${isRunning
                                            ? 'border-green-500/40 text-green-500 hover:bg-green-500/10'
                                            : 'border-cyan/40 text-cyan hover:bg-cyan/10'
                                        }`}
                                >
                                    {isRunning ? 'Stop' : 'Play'}
                                </button>
                            </div>
                            <button
                                onClick={handleReset}
                                className="w-full py-2 border border-white/10 text-[9px] text-dim font-black uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Reset System
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
