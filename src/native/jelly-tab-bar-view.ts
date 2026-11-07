import { requireNativeView } from "expo";
import type { ComponentType, PropsWithChildren, Ref } from "react";
import type { NativeSyntheticEvent, ViewProps } from "react-native";

export interface NativeIcon {
    fontFamily?: string;
    glyph?: string;
    kind: "glyph" | "path" | "react";
    path?: string;
    viewBox?: number;
}

export interface NativeLabelStyle {
    color: number | null;
    fontFamily: string | null;
    fontSize: number;
    fontWeight: number;
    italic: boolean;
    letterSpacing: number;
}

export interface NativeTab {
    activeIcon: NativeIcon;
    activeLabel: NativeLabelStyle;
    inactiveIcon: NativeIcon;
    inactiveLabel: NativeLabelStyle;
    label: string;
}

export interface NativePalette {
    activeContent: number;
    inactiveContent: number;
    selectedSurface: number;
    surface: number;
}

export interface NativeLayerOpacity {
    activeContent: number;
    inactiveContent: number;
    selectedSurface: number;
    surface: number;
}

export interface NativeMetrics {
    iconLabelGap: number;
    iconSize: number;
    itemHeight: number;
    labelPadding: number;
    pillOverhang: number;
    trackHeight: number;
    trackInset: number;
}

interface NativeSpring {
    dampingRatio: number;
    stiffness: number;
}

export interface NativeMotion {
    barPressedScale: number;
    barSpring: { damping: number; mass: number; stiffness: number };
    panelOffset: number;
    pillPressedScale: number;
    releaseDistanceFraction: number;
    snapOnPointerDown: boolean;
    springs: {
        panel: NativeSpring;
        press: NativeSpring;
        scaleX: NativeSpring;
        scaleY: NativeSpring;
        value: NativeSpring;
        velocity: NativeSpring;
    };
    verticalDistortion: number;
    verticalDistortionDistance: number;
    verticalFollow: number;
    verticalRubberBand: number;
}

export interface NativeTouchFeedback {
    centerOpacity: number;
    color: number;
    enabled: boolean;
    middleOpacity: number;
    radius: number;
}

export type NativeTabEvent = NativeSyntheticEvent<{ index: number }>;

export interface NativeJellyTabBarViewRef {
    activate(index: number): Promise<void>;
    restore(index: number): Promise<void>;
}

export interface NativeJellyTabBarViewProps extends PropsWithChildren<ViewProps> {
    layerOpacity: NativeLayerOpacity;
    longPressEnabled: boolean;
    metrics: NativeMetrics;
    motion: NativeMotion;
    onTabLongPress: (event: NativeTabEvent) => void;
    onTabPress: (event: NativeTabEvent) => void;
    palette: NativePalette;
    recording: boolean;
    ref?: Ref<NativeJellyTabBarViewRef>;
    selectedIndex: number;
    tabs: readonly NativeTab[];
    touchFeedback: NativeTouchFeedback;
}

let nativeView: ComponentType<NativeJellyTabBarViewProps> | undefined;

export const getNativeJellyTabBarView = () => {
    nativeView ??= requireNativeView<NativeJellyTabBarViewProps>(
        "ReactNativeJellyTabs",
    );
    return nativeView;
};
