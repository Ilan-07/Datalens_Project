import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { engineStateStore, type EngineParams } from '@/engine/simulation/EngineStateStore';

const EASING_OPTIONS = ['cubic', 'spring', 'linear', 'elastic'] as const;

export const SandboxPanel = () => {
    const [params, setParams] = useState<EngineParams>(engineStateStore.getState());
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const unsub = engineStateStore.subscribe((newParams) => {
            setParams({ ...newParams });
        });
        return unsub;
    }, []);

    const handleChange = useCallback((key: keyof EngineParams, value: unknown) => {
        engineStateStore.set({ [key]: value } as Partial<EngineParams>);
    }, []);

    const handleColorChange = useCallback((hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        engineStateStore.set({ glowColor: [r, g, b] });
    }, []);

    const glowHex = `#${Math.round(params.glowColor[0] * 255).toString(16).padStart(2, '0')}${Math.round(params.glowColor[1] * 255).toString(16).padStart(2, '0')}${Math.round(params.glowColor[2] * 255).toString(16).padStart(2, '0')}`;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-6 right-6 z-[80] w-72"
        >
            {/* Header */}
            <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-full flex items-center justify-between px-4 py-3 bg-black/95 border border-[#A855F7]/30 backdrop-blur-md cursor-pointer"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A855F7]">
                    Engine Sandbox
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
                        className="overflow-hidden bg-black/95 border border-t-0 border-[#A855F7]/20 backdrop-blur-md"
                    >
                        <div className="p-4 space-y-4">
                            {/* Glow Color */}
                            <div>
                                <label className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono block mb-1">
                                    Glow Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={glowHex}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        className="w-8 h-8 bg-transparent border border-white/10 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-dim font-mono">{glowHex.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Light Intensity */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono">
                                        Light Intensity
                                    </label>
                                    <span className="text-[9px] text-[#A855F7] font-mono">
                                        {params.lightIntensity.toFixed(2)}
                                    </span>
                                </div>
                                <input
                                    type="range" min={0} max={1} step={0.01}
                                    value={params.lightIntensity}
                                    onChange={(e) => handleChange('lightIntensity', parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                        [&::-webkit-slider-thumb]:bg-[#A855F7] [&::-webkit-slider-thumb]:border-0
                                        [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                            </div>

                            {/* Wave Speed */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono">
                                        Wave Speed
                                    </label>
                                    <span className="text-[9px] text-[#A855F7] font-mono">
                                        {params.waveSpeed.toFixed(2)}
                                    </span>
                                </div>
                                <input
                                    type="range" min={0} max={1} step={0.01}
                                    value={params.waveSpeed}
                                    onChange={(e) => handleChange('waveSpeed', parseFloat(e.target.value))}
                                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                        [&::-webkit-slider-thumb]:bg-[#A855F7] [&::-webkit-slider-thumb]:border-0
                                        [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                            </div>

                            {/* Compression Timing */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono">
                                        Compression Timing
                                    </label>
                                    <span className="text-[9px] text-[#A855F7] font-mono">
                                        {params.compressionTiming}ms
                                    </span>
                                </div>
                                <input
                                    type="range" min={200} max={1200} step={50}
                                    value={params.compressionTiming}
                                    onChange={(e) => handleChange('compressionTiming', parseInt(e.target.value))}
                                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                        [&::-webkit-slider-thumb]:bg-[#A855F7] [&::-webkit-slider-thumb]:border-0
                                        [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                            </div>

                            {/* Animation Easing */}
                            <div>
                                <label className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono block mb-2">
                                    Animation Easing
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                    {EASING_OPTIONS.map((easing) => (
                                        <button
                                            key={easing}
                                            onClick={() => handleChange('animationEasing', easing)}
                                            className={`px-2 py-1.5 text-[8px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${params.animationEasing === easing
                                                    ? 'border-[#A855F7]/60 text-[#A855F7] bg-[#A855F7]/10'
                                                    : 'border-white/10 text-dim hover:border-white/20'
                                                }`}
                                        >
                                            {easing}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Glitch Toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-[9px] text-dim uppercase tracking-[0.2em] font-mono">
                                    Glitch Distortion
                                </span>
                                <button
                                    onClick={() => handleChange('glitchEnabled', !params.glitchEnabled)}
                                    className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border transition-colors cursor-pointer ${params.glitchEnabled
                                            ? 'border-green-500/40 text-green-500'
                                            : 'border-red-500/40 text-red-500'
                                        }`}
                                >
                                    {params.glitchEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
