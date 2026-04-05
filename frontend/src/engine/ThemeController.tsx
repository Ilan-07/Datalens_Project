import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export const ThemeController = () => {
    const { theme } = useSettingsStore();

    useEffect(() => {
        const root = document.documentElement;

        const setColors = (primary: string, shadow: string) => {
            root.style.setProperty("--color-spider-red", primary);
            root.style.setProperty("--color-spider-shadow", shadow);
            root.style.setProperty("--color-accent", primary);
        };

        switch (theme) {
            case "cyan":
                setColors("#00F0FF", "#004852"); // Cyber Blue
                break;
            case "violet":
                setColors("#8B5CF6", "#4C1D95"); // Electric Purple
                break;
            case "amber":
                setColors("#F59E0B", "#78350F"); // Industrial Orange
                break;
            case "monochrome":
                setColors("#FFFFFF", "#333333"); // Stark White
                break;
            case "custom":
            default:
                setColors("#B11226", "#5A0E16"); // Original Spider Red
                break;
        }

    }, [theme]);

    return null; // Logic only, no UI
};
