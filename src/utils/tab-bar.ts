import type {
    TabBarGeometry,
    TouchFeedbackVisuals,
} from "../components/tab-bar-layers";
import type { TabBarConfig } from "../constants";

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export const getSelectedItemIndex = (
    selectedIndex: number | null,
    itemCount: number,
) => {
    if (
        selectedIndex === null ||
        !Number.isFinite(selectedIndex) ||
        selectedIndex < 0 ||
        itemCount === 0
    ) {
        return null;
    }

    return Math.min(selectedIndex, itemCount - 1);
};

export const getGeometry = (
    layout: TabBarConfig["layout"],
    displayScale: number,
): TabBarGeometry => ({
    itemHeight: layout.itemHeight * displayScale,
    maskOverscanX: layout.maskOverscanX * displayScale,
    maskOverscanY: layout.maskOverscanY * displayScale,
    trackHeight: layout.trackHeight * displayScale,
    trackInset: layout.trackInset * displayScale,
});

export const getTouchFeedbackVisuals = (
    config: TabBarConfig["distortion"]["touchFeedback"],
    displayScale: number,
    overrides: { color: string; opacity?: number; scale?: number },
): TouchFeedbackVisuals => {
    const centerOpacity = clamp01(overrides.opacity ?? config.opacity);
    const radius =
        config.radius *
        Math.max(overrides.scale ?? config.scale, 0) *
        displayScale;

    return {
        centerOpacity,
        color: overrides.color,
        diameter: radius * 2,
        middleOpacity: centerOpacity * config.middleOpacityRatio,
        radius,
    };
};
