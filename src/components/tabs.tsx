import {
    AccessibilityTabsRow,
    InactiveTabsRow,
    PillLayer,
    SurfaceLayer,
    type TabBarGeometry,
    TouchFeedbackLayer,
    type TouchFeedbackVisuals,
} from "./tab-bar-layers";
import { TabItem } from "./tab-item";
import {
    DEFAULT_TAB_BAR_COLORS,
    DEFAULT_TAB_BAR_OPACITY,
    resolveTabBarConfig,
    type TabBarConfig,
} from "../constants";
import type { JellyTabBarHeadlessProps } from "../types";
import { usePillJelly } from "../hooks/use-pill-jelly";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const getSelectedItemIndex = (
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

const getGeometry = (
    layout: TabBarConfig["layout"],
    displayScale: number,
): TabBarGeometry => ({
    itemHeight: layout.itemHeight * displayScale,
    maskOverscanX: layout.maskOverscanX * displayScale,
    maskOverscanY: layout.maskOverscanY * displayScale,
    trackHeight: layout.trackHeight * displayScale,
    trackInset: layout.trackInset * displayScale,
});

const getTouchFeedbackVisuals = (
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

export const JellyTabBarHeadless = ({
    backdrop,
    colors,
    config,
    displayScale = 1,
    items,
    maxWidth = 400,
    onTabChange,
    onTabLongPress,
    onTabPress,
    opacity,
    recording = false,
    selectedIndex,
    selectedBackdrop,
    touchFeedbackColor,
    touchFeedbackEnabled = true,
    touchFeedbackOpacity,
    touchFeedbackScale,
}: JellyTabBarHeadlessProps) => {
    const trackRef = useRef<View>(null);
    const [uncontrolledSelectedIndex, setUncontrolledSelectedIndex] =
        useState(0);
    // Web only: the pill clip box is statically sized from the measured track
    // width so its animation stays transform-only. Unused on native.
    const [webTrackWidth, setWebTrackWidth] = useState(0);
    const resolvedConfig = useMemo(() => resolveTabBarConfig(config), [config]);
    const resolvedColors = {
        ...DEFAULT_TAB_BAR_COLORS,
        ...colors,
    };
    const resolvedOpacity = {
        ...DEFAULT_TAB_BAR_OPACITY,
        ...opacity,
    };
    const geometry = getGeometry(resolvedConfig.layout, displayScale);
    const iconSize = resolvedConfig.layout.iconSize * displayScale;
    const touchFeedback = getTouchFeedbackVisuals(
        resolvedConfig.distortion.touchFeedback,
        displayScale,
        {
            color: touchFeedbackColor ?? resolvedColors.selectedSurface,
            opacity: touchFeedbackOpacity,
            scale: touchFeedbackScale,
        },
    );

    const handleTabChange = useCallback(
        (index: number) => {
            const item = items[index];
            if (item) {
                setUncontrolledSelectedIndex(index);
                onTabChange?.({ index, item });
            }
        },
        [items, onTabChange],
    );
    const handleTabLongPress = useCallback(
        (index: number) => {
            const item = items[index];
            if (item) {
                onTabLongPress?.({ index, item });
            }
        },
        [items, onTabLongPress],
    );
    const handleTabPress = useCallback(
        (index: number) => {
            const item = items[index];
            if (item) {
                return onTabPress?.({ index, item });
            }

            return false;
        },
        [items, onTabPress],
    );

    const tabs = items.map((item) => (
        <TabItem
            activeBadgeStyle={item.activeBadgeStyle}
            activeColor={resolvedColors.activeContent}
            activeOpacity={clamp01(resolvedOpacity.activeContent)}
            activeIcon={item.activeIcon}
            badge={item.badge}
            badgeStyle={item.badgeStyle}
            colors={resolvedColors}
            displayScale={displayScale}
            iconSize={iconSize}
            inactiveIcon={item.inactiveIcon}
            inactiveColor={resolvedColors.inactiveContent}
            inactiveOpacity={clamp01(resolvedOpacity.inactiveContent)}
            itemHeight={geometry.itemHeight}
            key={item.key}
            labelStyle={item.labelStyle}
            text={item.label}
        />
    ));
    const tabCount = tabs.length;
    const semanticSelectedIndex = getSelectedItemIndex(
        selectedIndex === undefined ? uncontrolledSelectedIndex : selectedIndex,
        tabCount,
    );
    const {
        activateTab,
        activeItemStyle,
        gesture,
        panelStyle,
        pillClipStyle,
        pillContentStyle,
        pillMaskStyle,
        pressedStyle,
        selectedTouchFeedbackStyle,
        setTrackWidth,
        setWebTrackPageX,
        tabbarStyle,
        touchFeedbackStyle,
    } = usePillJelly(
        tabCount,
        resolvedConfig,
        recording,
        displayScale,
        touchFeedback.radius,
        selectedIndex,
        handleTabChange,
        onTabPress ? handleTabPress : undefined,
        onTabLongPress ? handleTabLongPress : undefined,
    );
    const measureWebTrackPageX = useCallback(() => {
        trackRef.current?.measureInWindow((x) => setWebTrackPageX(x));
    }, [setWebTrackPageX]);

    useEffect(() => {
        if (Platform.OS !== "web") {
            return;
        }

        // A centered track can move when the viewport is resized without
        // changing its own width, so onLayout alone will not run again.
        const subscription = Dimensions.addEventListener(
            "change",
            measureWebTrackPageX,
        );

        return () => subscription.remove();
    }, [measureWebTrackPageX]);

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                collapsable={false}
                style={[
                    styles.pressWrapper,
                    { height: geometry.trackHeight, maxWidth },
                    pressedStyle,
                ]}
            >
                <Animated.View
                    collapsable={false}
                    pointerEvents="box-only"
                    ref={trackRef}
                    testID="tabs-drag-surface"
                    style={[
                        styles.track,
                        { height: geometry.trackHeight },
                        tabbarStyle,
                    ]}
                    onLayout={(event) => {
                        setTrackWidth(event.nativeEvent.layout.width);
                        if (Platform.OS === "web") {
                            setWebTrackWidth(event.nativeEvent.layout.width);
                            measureWebTrackPageX();
                        }
                    }}
                >
                    <Animated.View
                        accessibilityElementsHidden
                        aria-hidden
                        importantForAccessibility="no-hide-descendants"
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFill, panelStyle]}
                    >
                        <SurfaceLayer
                            backdrop={backdrop}
                            color={resolvedColors.surface}
                            opacity={clamp01(resolvedOpacity.surface)}
                            radius={geometry.trackHeight / 2}
                        />

                        {touchFeedbackEnabled && (
                            <TouchFeedbackLayer
                                animatedStyle={touchFeedbackStyle}
                                radius={geometry.trackHeight / 2}
                                visuals={touchFeedback}
                            />
                        )}

                        <InactiveTabsRow
                            tabs={tabs}
                            trackInset={geometry.trackInset}
                        />

                        <PillLayer
                            activeItemStyle={activeItemStyle}
                            clipStyle={pillClipStyle}
                            contentStyle={pillContentStyle}
                            geometry={geometry}
                            maskStyle={pillMaskStyle}
                            selectedBackdrop={selectedBackdrop}
                            selectedSurfaceColor={resolvedColors.selectedSurface}
                            selectedSurfaceOpacity={clamp01(
                                resolvedOpacity.selectedSurface,
                            )}
                            tabCount={tabCount}
                            tabs={tabs}
                            touchFeedback={
                                touchFeedbackEnabled ? touchFeedback : undefined
                            }
                            touchFeedbackStyle={selectedTouchFeedbackStyle}
                            visible={semanticSelectedIndex !== null}
                            webTrackWidth={webTrackWidth}
                        />
                    </Animated.View>

                    <AccessibilityTabsRow
                        items={items}
                        onActivate={activateTab}
                        onLongPress={
                            onTabLongPress ? handleTabLongPress : undefined
                        }
                        selectedIndex={semanticSelectedIndex}
                        trackInset={geometry.trackInset}
                    />
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
};

/** @deprecated Use JellyTabBarHeadless instead. */
export const JellyTabs = JellyTabBarHeadless;

const styles = StyleSheet.create({
    pressWrapper: {
        alignSelf: "center",
        width: "100%",
        // Stop the label/icon glyphs from being text-selected on web; harmless on native.
        userSelect: "none",
    },
    track: {
        position: "relative",
        width: "100%",
        overflow: "visible",
    },
});
