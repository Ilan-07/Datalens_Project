import { useEffect } from "react";
import { TextGlitchController } from "./TextGlitchController";

/**
 * Hook to manually register a text element with the Glitch Engine
 */
export function useGlitchHover<T extends HTMLElement>(ref: React.RefObject<T | null>, intensity: "low" | "medium" | "high" = "medium") {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Singleton instance (lazy init on client)
        const controller = TextGlitchController.getInstance();

        // Register immediately
        controller.register(element, { intensity });

        const onEnter = () => {
            controller.setHover(element, true);
        };

        const onLeave = () => {
            controller.setHover(element, false);
        };

        element.addEventListener("mouseenter", onEnter);
        element.addEventListener("mouseleave", onLeave);

        return () => {
            element.removeEventListener("mouseenter", onEnter);
            element.removeEventListener("mouseleave", onLeave);
            controller.unregister(element);
        };
    }, [ref]);
}
