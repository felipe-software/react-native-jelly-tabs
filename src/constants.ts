import type { PillJellyFrameConfig } from "./utils/pill-jelly-animation";
import { Platform } from "react-native";

export interface TabBarLayoutConfig {
    iconLabelGap: number;
    iconSize: number;
    itemHeight: number;
    maskOverscanX: number;
    maskOverscanY: number;
    pillOverhang: number;
    trackHeight: number;
    trackInset: number;
}

export const TABBAR_LAYOUT = {
    iconLabelGap: 0,
    iconSize: 28,
    itemHeight: 56,
    maskOverscanX: 48,
    maskOverscanY: 16,
    pillOverhang: 0,
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

export interface DistortionConfig {
    pressedScale: number;
    touchFeedback: {
        middleOpacityRatio: number;
        opacity: number;
        radius: number;
        scale: number;
    };
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

export const ANDROID_TAB_BAR_CONFIG = {
    distortion: { pressedScale: 1.1 },
    layout: { iconLabelGap: 1, pillOverhang: 8 },
    pillJelly: { pressedScale: 1.2 },
} as const satisfies DeepPartial<TabBarConfig>;

const mergeTabBarConfig = (
    base: TabBarConfig,
    config?: DeepPartial<TabBarConfig>,
): TabBarConfig => ({
    layout: {
        ...base.layout,
        ...config?.layout,
    },
    pillJelly: {
        ...base.pillJelly,
        ...config?.pillJelly,
        frameConfig: {
            ...base.pillJelly.frameConfig,
            ...config?.pillJelly?.frameConfig,
            springs: {
                panel: {
                    ...base.pillJelly.frameConfig.springs.panel,
                    ...config?.pillJelly?.frameConfig?.springs?.panel,
                },
                press: {
                    ...base.pillJelly.frameConfig.springs.press,
                    ...config?.pillJelly?.frameConfig?.springs?.press,
                },
                scaleX: {
                    ...base.pillJelly.frameConfig.springs.scaleX,
                    ...config?.pillJelly?.frameConfig?.springs?.scaleX,
                },
                scaleY: {
                    ...base.pillJelly.frameConfig.springs.scaleY,
                    ...config?.pillJelly?.frameConfig?.springs?.scaleY,
                },
                value: {
                    ...base.pillJelly.frameConfig.springs.value,
                    ...config?.pillJelly?.frameConfig?.springs?.value,
                },
                velocity: {
                    ...base.pillJelly.frameConfig.springs.velocity,
                    ...config?.pillJelly?.frameConfig?.springs?.velocity,
                },
            },
        },
    },
    distortion: {
        ...base.distortion,
        ...config?.distortion,
        touchFeedback: {
            ...base.distortion.touchFeedback,
            ...config?.distortion?.touchFeedback,
        },
        spring: {
            ...base.distortion.spring,
            ...config?.distortion?.spring,
        },
        verticalDrag: {
            ...base.distortion.verticalDrag,
            ...config?.distortion?.verticalDrag,
        },
    },
});

export const resolveTabBarConfig = (
    config?: DeepPartial<TabBarConfig>,
    platform: string = Platform.OS,
): TabBarConfig => {
    const base =
        platform === "android"
            ? mergeTabBarConfig(DEFAULT_TAB_BAR_CONFIG, ANDROID_TAB_BAR_CONFIG)
            : DEFAULT_TAB_BAR_CONFIG;
    return mergeTabBarConfig(base, config);
};
