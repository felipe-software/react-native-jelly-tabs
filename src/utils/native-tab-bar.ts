import type { TabBarConfig } from "../constants";
import { getIconSources } from "../icons";
import type {
    NativeIcon,
    NativeLabelStyle,
    NativeMotion,
    NativeTab,
} from "../native/jelly-tab-bar-view";
import type { TabsItem } from "../types";
import { processColor, StyleSheet, type TextStyle } from "react-native";

const LABEL_FONT_SIZE = 11;
const ACTIVE_LABEL_WEIGHT = 600;
const INACTIVE_LABEL_WEIGHT = 500;
const PANEL_OFFSET = 4;
const NAMED_FONT_WEIGHTS: Readonly<Record<string, number>> = {
    black: 900,
    bold: 700,
    heavy: 800,
    light: 300,
    medium: 500,
    normal: 400,
    regular: 400,
    semibold: 600,
    thin: 100,
    ultralight: 100,
};

export const toNativeColor = (color: unknown, fallback: number) => {
    if (typeof color !== "string" && typeof color !== "number") {
        return fallback;
    }
    const processed = processColor(color);
    return typeof processed === "number" ? processed : fallback;
};

export const resolveFontWeight = (
    weight: TextStyle["fontWeight"] | undefined,
    fallback: number,
) => {
    if (typeof weight === "number") {
        return weight;
    }
    if (typeof weight !== "string") {
        return fallback;
    }
    const numeric = Number(weight);
    return Number.isFinite(numeric)
        ? numeric
        : (NAMED_FONT_WEIGHTS[weight] ?? fallback);
};

const transformLabel = (
    label: string,
    transform: TextStyle["textTransform"] | undefined,
) => {
    if (transform === "uppercase") {
        return label.toUpperCase();
    }
    if (transform === "lowercase") {
        return label.toLowerCase();
    }
    if (transform === "capitalize") {
        return label.replace(/(^|\s)\S/g, (match) => match.toUpperCase());
    }
    return label;
};

const resolveLabelStyle = (
    flatStyle: TextStyle,
    isActive: boolean,
    displayScale: number,
): NativeLabelStyle => ({
    color:
        flatStyle.color === undefined
            ? null
            : toNativeColor(flatStyle.color, 0),
    fontFamily: flatStyle.fontFamily ?? null,
    fontSize:
        typeof flatStyle.fontSize === "number"
            ? flatStyle.fontSize
            : LABEL_FONT_SIZE * displayScale,
    fontWeight: resolveFontWeight(
        flatStyle.fontWeight,
        isActive ? ACTIVE_LABEL_WEIGHT : INACTIVE_LABEL_WEIGHT,
    ),
    italic: flatStyle.fontStyle === "italic",
    letterSpacing:
        typeof flatStyle.letterSpacing === "number"
            ? flatStyle.letterSpacing
            : 0,
});

export const getNativeIcon = (
    icon: unknown,
    slot: "active" | "inactive",
): NativeIcon => {
    const source = getIconSources(icon)?.[slot];
    if (!source) {
        return { kind: "react" };
    }
    return source.kind === "path"
        ? { kind: "path", path: source.path, viewBox: source.viewBox }
        : { fontFamily: source.fontFamily, glyph: source.glyph, kind: "glyph" };
};

export const isNativeIcon = (icon: unknown, slot: "active" | "inactive") =>
    getNativeIcon(icon, slot).kind !== "react";

export const getNativeTabs = (
    items: readonly TabsItem[],
    displayScale: number,
): NativeTab[] =>
    items.map((item) => {
        const flatStyle: TextStyle = StyleSheet.flatten(item.labelStyle) ?? {};
        return {
            activeIcon: getNativeIcon(item.activeIcon, "active"),
            activeLabel: resolveLabelStyle(flatStyle, true, displayScale),
            inactiveIcon: getNativeIcon(item.inactiveIcon, "inactive"),
            inactiveLabel: resolveLabelStyle(flatStyle, false, displayScale),
            label: transformLabel(item.label, flatStyle.textTransform),
        };
    });

export const getNativeMotion = (
    { distortion, pillJelly }: TabBarConfig,
    geometryScale: number,
): NativeMotion => ({
    barPressedScale: distortion.pressedScale,
    barSpring: { ...distortion.spring },
    panelOffset: PANEL_OFFSET * geometryScale,
    pillPressedScale: pillJelly.pressedScale,
    releaseDistanceFraction: pillJelly.frameConfig.releaseDistanceFraction,
    snapOnPointerDown: pillJelly.snapOnPointerDown,
    springs: {
        panel: { ...pillJelly.frameConfig.springs.panel },
        press: { ...pillJelly.frameConfig.springs.press },
        scaleX: { ...pillJelly.frameConfig.springs.scaleX },
        scaleY: { ...pillJelly.frameConfig.springs.scaleY },
        value: { ...pillJelly.frameConfig.springs.value },
        velocity: { ...pillJelly.frameConfig.springs.velocity },
    },
    verticalDistortion: distortion.verticalDrag.distortion,
    verticalDistortionDistance:
        distortion.verticalDrag.distanceForMaxDistortion * geometryScale,
    verticalFollow: distortion.verticalDrag.follow,
    verticalRubberBand: distortion.verticalDrag.rubberBand,
});
