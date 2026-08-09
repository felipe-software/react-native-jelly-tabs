import type { GelatinDragConfig } from "./utils/gelatin-animation";
import type { PillJellyFrameConfig } from "./utils/pill-jelly-animation";

export interface TabBarLayoutConfig {
    iconSize: number;
    itemHeight: number;
    maskOverscanX: number;
    maskOverscanY: number;
    trackHeight: number;
    trackInset: number;
}

export const TABBAR_LAYOUT = {
    iconSize: 28,
    itemHeight: 56,
    maskOverscanX: 48,
    maskOverscanY: 16,
    trackHeight: 64,
    trackInset: 4,
} as const satisfies TabBarLayoutConfig;

export interface TabBarColors {
    activeContent: string;
    inactiveContent: string;
    selectedSurface: string;
    surface: string;
}

export const DEFAULT_TAB_BAR_COLORS: TabBarColors = {
    activeContent: "#11100f",
    inactiveContent: "#b8b4ad",
    selectedSurface: "#f2eee7",
    surface: "#22211f",
};

export interface TabBarOpacity {
    activeContent: number;
    inactiveContent: number;
    selectedSurface: number;
    surface: number;
}

export const DEFAULT_TAB_BAR_OPACITY: TabBarOpacity = {
    activeContent: 1,
    inactiveContent: 1,
    selectedSurface: 1,
    surface: 1,
};

export interface PillJellyConfig {
    pressedScale: number;
    snapOnPointerDown: boolean;
    frameConfig: PillJellyFrameConfig;
}

export const PILL_JELLY = {
    pressedScale: 1.3,
    snapOnPointerDown: true,
    frameConfig: {
        // Keep the indicator inflated until it is within 2.5% of its snap point.
        releaseDistanceFraction: 0.025,
        springs: {
            panel: { stiffness: 300, dampingRatio: 1 },
            press: { stiffness: 1_000, dampingRatio: 1 },
            scaleX: { stiffness: 250, dampingRatio: 0.6 },
            scaleY: { stiffness: 250, dampingRatio: 0.7 },
            value: { stiffness: 1_000, dampingRatio: 1 },
            velocity: { stiffness: 300, dampingRatio: 0.5 },
        },
    },
} as const satisfies PillJellyConfig;

/** The radial highlight that fades in under the pointer. */
export interface TouchFeedbackConfig {
    /** Opacity at 45% of the radius, as a fraction of `opacity`. */
    middleOpacityRatio: number;
    /** Opacity at the very center of the gradient. */
    opacity: number;
    /** Gradient radius in px, before `scale`. */
    radius: number;
    /** Multiplier applied to `radius`. */
    scale: number;
}

export interface DistortionConfig {
    pressedScale: number;
    touchFeedback: TouchFeedbackConfig;
    spring: {
        damping: number;
        mass: number;
        stiffness: number;
    };
    verticalDrag: {
        distortion: number;
        distanceForMaxDistortion: number;
        follow: number;
        rubberBand: number;
    };
}

export const DISTORTION = {
    pressedScale: 1.025,
    touchFeedback: {
        middleOpacityRatio: 0.43,
        opacity: 0.15,
        radius: 150,
        scale: 2,
    },
    spring: {
        damping: 18,
        mass: 0.9,
        stiffness: 240,
    },
    verticalDrag: {
        distortion: 0.08,
        distanceForMaxDistortion: 700,

        // Movement only: these change how much the tabbar follows the finger,
        // without changing its width distortion.
        follow: 0.25,
        rubberBand: 0.28 / 2,
    },
} as const satisfies DistortionConfig;

/**
 * A duration-based spring, matching SwiftUI's `.smooth(duration:extraBounce:)`
 * that the original Gelatin package animates with. `dampingRatio: 1` settles
 * without overshoot; lower values add the bounce.
 */
export interface GelatinSpringConfig {
    dampingRatio: number;
    /** Milliseconds. */
    duration: number;
}

/**
 * Standalone elastic press/drag effect — used by `JellyPressable` and
 * `useGelatin`. Deliberately independent of `TabBarConfig`: the pressable and
 * the tab bar share hooks, not configuration.
 */
export interface GelatinConfig {
    /** Scale applied to the whole view while it is pressed. */
    pressedScale: number;
    drag: GelatinDragConfig;
    springs: {
        /** Follows the finger during the drag. */
        drag: GelatinSpringConfig;
        /** Drives the press inflation and the glow fade. */
        press: GelatinSpringConfig;
        /** Bounces everything back once the finger lifts. */
        release: GelatinSpringConfig;
    };
    touchFeedback: TouchFeedbackConfig;
}

export const GELATIN = {
    pressedScale: 1.1,
    drag: {
        // Gelatin's own 80 is tuned for a full-screen card; a button is much
        // smaller, so the same drag has to deform it a lot harder to read.
        distanceForMaxStretch: 32,
        easingExponent: 1 / 3,
        follow: 2,
        maxStretch: 0.9,
        stretchAnchor: 1,
        stretchAmplification: 3,
    },
    springs: {
        drag: { dampingRatio: 1, duration: 390 },
        press: { dampingRatio: 0.5, duration: 300 },
        release: { dampingRatio: 0.5, duration: 500 },
    },
    touchFeedback: {
        middleOpacityRatio: 0.43,
        opacity: 0.35,
        radius: 90,
        scale: 1,
    },
} as const satisfies GelatinConfig;

export const DEFAULT_GELATIN_CONFIG: GelatinConfig = GELATIN;

export const resolveGelatinConfig = (
    config?: DeepPartial<GelatinConfig>,
): GelatinConfig => ({
    pressedScale: config?.pressedScale ?? GELATIN.pressedScale,
    drag: {
        ...GELATIN.drag,
        ...config?.drag,
    },
    springs: {
        drag: {
            ...GELATIN.springs.drag,
            ...config?.springs?.drag,
        },
        press: {
            ...GELATIN.springs.press,
            ...config?.springs?.press,
        },
        release: {
            ...GELATIN.springs.release,
            ...config?.springs?.release,
        },
    },
    touchFeedback: {
        ...GELATIN.touchFeedback,
        ...config?.touchFeedback,
    },
});

export interface TabBarConfig {
    distortion: DistortionConfig;
    layout: TabBarLayoutConfig;
    pillJelly: PillJellyConfig;
}

export type DeepPartial<T> = {
    [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

export const DEFAULT_TAB_BAR_CONFIG: TabBarConfig = {
    distortion: DISTORTION,
    layout: TABBAR_LAYOUT,
    pillJelly: PILL_JELLY,
};

export const resolveTabBarConfig = (
    config?: DeepPartial<TabBarConfig>,
): TabBarConfig => ({
    layout: {
        ...TABBAR_LAYOUT,
        ...config?.layout,
    },
    pillJelly: {
        ...PILL_JELLY,
        ...config?.pillJelly,
        frameConfig: {
            ...PILL_JELLY.frameConfig,
            ...config?.pillJelly?.frameConfig,
            springs: {
                panel: {
                    ...PILL_JELLY.frameConfig.springs.panel,
                    ...config?.pillJelly?.frameConfig?.springs?.panel,
                },
                press: {
                    ...PILL_JELLY.frameConfig.springs.press,
                    ...config?.pillJelly?.frameConfig?.springs?.press,
                },
                scaleX: {
                    ...PILL_JELLY.frameConfig.springs.scaleX,
                    ...config?.pillJelly?.frameConfig?.springs?.scaleX,
                },
                scaleY: {
                    ...PILL_JELLY.frameConfig.springs.scaleY,
                    ...config?.pillJelly?.frameConfig?.springs?.scaleY,
                },
                value: {
                    ...PILL_JELLY.frameConfig.springs.value,
                    ...config?.pillJelly?.frameConfig?.springs?.value,
                },
                velocity: {
                    ...PILL_JELLY.frameConfig.springs.velocity,
                    ...config?.pillJelly?.frameConfig?.springs?.velocity,
                },
            },
        },
    },
    distortion: {
        ...DISTORTION,
        ...config?.distortion,
        touchFeedback: {
            ...DISTORTION.touchFeedback,
            ...config?.distortion?.touchFeedback,
        },
        spring: {
            ...DISTORTION.spring,
            ...config?.distortion?.spring,
        },
        verticalDrag: {
            ...DISTORTION.verticalDrag,
            ...config?.distortion?.verticalDrag,
        },
    },
});
