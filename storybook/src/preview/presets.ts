import type { TabBarColors } from "react-native-jelly-tabs";

// Same palettes the example app ships in its color customizer. Each preset is
// defined by its pill color; surfaces stay a neutral dark so the pill leads.
export const PALETTES = {
    Amber: {
        activeContent: "#451A03",
        inactiveContent: "#A8A29E",
        selectedSurface: "#F59E0B",
        surface: "#1C1917",
    },
    Blue: {
        activeContent: "#EFF6FF",
        inactiveContent: "#A1A1AA",
        selectedSurface: "#2563EB",
        surface: "#18181B",
    },
    Indigo: {
        activeContent: "#EEF2FF",
        inactiveContent: "#A5B4FC",
        selectedSurface: "#4F46E5",
        surface: "#1E1B4B",
    },
    Violet: {
        activeContent: "#F5F3FF",
        inactiveContent: "#A1A1AA",
        selectedSurface: "#7C3AED",
        surface: "#18181B",
    },
    Pink: {
        activeContent: "#FDF2F8",
        inactiveContent: "#A1A1AA",
        selectedSurface: "#EC4899",
        surface: "#18181B",
    },
    Emerald: {
        activeContent: "#ECFDF5",
        inactiveContent: "#A1A1AA",
        selectedSurface: "#10B981",
        surface: "#18181B",
    },
    Cyan: {
        activeContent: "#ECFEFF",
        inactiveContent: "#94A3B8",
        selectedSurface: "#06B6D4",
        surface: "#0F172A",
    },
    Mono: {
        activeContent: "#171717",
        inactiveContent: "#A3A3A3",
        selectedSurface: "#FAFAFA",
        surface: "#171717",
    },
} satisfies Record<string, TabBarColors>;

export type PaletteName = keyof typeof PALETTES;
