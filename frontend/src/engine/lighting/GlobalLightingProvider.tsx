import React, { createContext, useContext, useEffect, useState } from 'react';
import { globalLighting, type LightingState } from './GlobalLighting';

interface LightingContextValue {
    lighting: LightingState;
}

const LightingContext = createContext<LightingContextValue | null>(null);

export function useLighting(): LightingState {
    const ctx = useContext(LightingContext);
    if (!ctx) {
        // Safe fallback for SSR or outside provider
        return globalLighting.getState();
    }
    return ctx.lighting;
}

export const GlobalLightingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lighting, setLighting] = useState<LightingState>(globalLighting.getState());

    useEffect(() => {
        globalLighting.init();

        // Poll at 10Hz (not per frame — React can't keep up)
        const interval = setInterval(() => {
            setLighting({ ...globalLighting.getState() });
        }, 100);

        // Also subscribe for immediate event-driven updates
        const unsub = globalLighting.subscribe((state) => {
            setLighting({ ...state });
        });

        return () => {
            clearInterval(interval);
            unsub();
        };
    }, []);

    return (
        <LightingContext.Provider value={{ lighting }}>
            {children}
        </LightingContext.Provider>
    );
};
