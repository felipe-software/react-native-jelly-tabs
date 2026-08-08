import { describe, expect, test } from "bun:test";
import {
    DEFAULT_TAB_BAR_COLORS,
    DEFAULT_TAB_BAR_CONFIG,
    DEFAULT_TAB_BAR_OPACITY,
    DISTORTION,
    PILL_JELLY,
    resolveTabBarConfig,
    TABBAR_LAYOUT,
} from "../src/constants";

describe("PROPS.md defaults", () => {
    test("keeps the documented color, opacity and layout defaults", () => {
        expect(DEFAULT_TAB_BAR_COLORS).toEqual({
            activeContent: "#11100f",
            inactiveContent: "#b8b4ad",
            selectedSurface: "#f2eee7",
            surface: "#22211f",
        });
        expect(DEFAULT_TAB_BAR_OPACITY).toEqual({
            activeContent: 1,
            inactiveContent: 1,
            selectedSurface: 1,
            surface: 1,
        });
        expect(TABBAR_LAYOUT).toEqual({
            iconSize: 28,
            itemHeight: 56,
            maskOverscanX: 48,
            maskOverscanY: 16,
            trackHeight: 64,
            trackInset: 4,
        });
    });

    test("keeps the documented jelly and distortion defaults", () => {
        expect(PILL_JELLY).toEqual({
            pressedScale: 1.3,
            snapOnPointerDown: true,
            frameConfig: {
                releaseDistanceFraction: 0.025,
                springs: {
                    panel: { dampingRatio: 1, stiffness: 300 },
                    press: { dampingRatio: 1, stiffness: 1_000 },
                    scaleX: { dampingRatio: 0.6, stiffness: 250 },
                    scaleY: { dampingRatio: 0.7, stiffness: 250 },
                    value: { dampingRatio: 1, stiffness: 1_000 },
                    velocity: { dampingRatio: 0.5, stiffness: 300 },
                },
            },
        });
        expect(DISTORTION).toEqual({
            pressedScale: 1.025,
            spring: { damping: 18, mass: 0.9, stiffness: 240 },
            touchFeedback: {
                middleOpacityRatio: 0.43,
                opacity: 0.15,
                radius: 150,
                scale: 2,
            },
            verticalDrag: {
                distanceForMaxDistortion: 700,
                distortion: 0.08,
                follow: 0.25,
                rubberBand: 0.14,
            },
        });
        expect(DEFAULT_TAB_BAR_CONFIG).toEqual({
            distortion: DISTORTION,
            layout: TABBAR_LAYOUT,
            pillJelly: PILL_JELLY,
        });
    });
});

describe("resolveTabBarConfig", () => {
    test("deep-merges partial nested customization without losing defaults", () => {
        const resolved = resolveTabBarConfig({
            distortion: {
                spring: { mass: 1.4 },
                touchFeedback: { opacity: 0.6 },
                verticalDrag: { follow: 0.5 },
            },
            layout: { iconSize: 36 },
            pillJelly: {
                frameConfig: {
                    releaseDistanceFraction: 0.05,
                    springs: {
                        scaleX: { stiffness: 700 },
                    },
                },
            },
        });

        expect(resolved.layout).toEqual({
            ...TABBAR_LAYOUT,
            iconSize: 36,
        });
        expect(resolved.pillJelly.frameConfig).toEqual({
            ...PILL_JELLY.frameConfig,
            releaseDistanceFraction: 0.05,
            springs: {
                ...PILL_JELLY.frameConfig.springs,
                scaleX: {
                    dampingRatio: 0.6,
                    stiffness: 700,
                },
            },
        });
        expect(resolved.distortion).toEqual({
            ...DISTORTION,
            spring: { ...DISTORTION.spring, mass: 1.4 },
            touchFeedback: {
                ...DISTORTION.touchFeedback,
                opacity: 0.6,
            },
            verticalDrag: {
                ...DISTORTION.verticalDrag,
                follow: 0.5,
            },
        });
    });

    test("returns a mutable configuration without mutating the defaults", () => {
        const resolved = resolveTabBarConfig();

        resolved.layout.iconSize = 99;
        resolved.pillJelly.frameConfig.springs.panel.stiffness = 999;
        resolved.distortion.touchFeedback.radius = 10;

        expect(TABBAR_LAYOUT.iconSize).toBe(28);
        expect(PILL_JELLY.frameConfig.springs.panel.stiffness).toBe(300);
        expect(DISTORTION.touchFeedback.radius).toBe(150);
    });
});
