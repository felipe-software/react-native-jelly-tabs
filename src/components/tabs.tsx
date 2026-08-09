import { TabItem } from "./tab-item";
import {
    DEFAULT_TAB_BAR_COLORS,
    DEFAULT_TAB_BAR_OPACITY,
    resolveTabBarConfig,
} from "../constants";
import type { JellyTabBarHeadlessProps } from "../types";
import { getTabWidth } from "../utils/animation";
import { usePillJelly } from "../hooks/use-pill-jelly";
import { PillMaskedView } from "./pill-masked-view";
import { TouchFeedback } from "./touch-feedback";
import {
    cloneElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const ACTIVATE_ACCESSIBILITY_ACTION = [{ name: "activate" }] as const;
const TAB_ACCESSIBILITY_ACTIONS = [
    { name: "activate" },
    { name: "longpress" },
] as const;

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
    const normalizeOpacity = (value: number) => Math.min(Math.max(value, 0), 1);
    const activeContentOpacity = normalizeOpacity(
        resolvedOpacity.activeContent,
    );
    const inactiveContentOpacity = normalizeOpacity(
        resolvedOpacity.inactiveContent,
    );
    const selectedSurfaceOpacity = normalizeOpacity(
        resolvedOpacity.selectedSurface,
    );
    const surfaceOpacity = normalizeOpacity(resolvedOpacity.surface);
    const resolvedTouchFeedbackOpacity =
        touchFeedbackOpacity ?? resolvedConfig.distortion.touchFeedback.opacity;
    const resolvedTouchFeedbackScale =
        touchFeedbackScale ?? resolvedConfig.distortion.touchFeedback.scale;
    const resolvedTouchFeedbackColor =
        touchFeedbackColor ?? resolvedColors.selectedSurface;
    const maskOverscanX = resolvedConfig.layout.maskOverscanX * displayScale;
    const maskOverscanY = resolvedConfig.layout.maskOverscanY * displayScale;
    const trackInset = resolvedConfig.layout.trackInset * displayScale;
    const trackHeight = resolvedConfig.layout.trackHeight * displayScale;
    const itemHeight = resolvedConfig.layout.itemHeight * displayScale;
    const iconSize = resolvedConfig.layout.iconSize * displayScale;
    const normalizedTouchFeedbackOpacity = Math.min(
        Math.max(resolvedTouchFeedbackOpacity, 0),
        1,
    );
    const normalizedTouchFeedbackScale = Math.max(
        resolvedTouchFeedbackScale,
        0,
    );
    const touchFeedbackRadius =
        resolvedConfig.distortion.touchFeedback.radius *
        normalizedTouchFeedbackScale *
        displayScale;
    const touchFeedbackDiameter = touchFeedbackRadius * 2;
    const touchFeedbackMiddleOpacity =
        normalizedTouchFeedbackOpacity *
        resolvedConfig.distortion.touchFeedback.middleOpacityRatio;

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
            activeOpacity={activeContentOpacity}
            activeIcon={item.activeIcon}
            badge={item.badge}
            badgeStyle={item.badgeStyle}
            colors={resolvedColors}
            displayScale={displayScale}
            iconSize={iconSize}
            inactiveIcon={item.inactiveIcon}
            inactiveColor={resolvedColors.inactiveContent}
            inactiveOpacity={inactiveContentOpacity}
            itemHeight={itemHeight}
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
    const hasSelectedItem = semanticSelectedIndex !== null;
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
        touchFeedbackRadius,
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
                    { height: trackHeight, maxWidth },
                    pressedStyle,
                ]}
            >
                <Animated.View
                    collapsable={false}
                    pointerEvents="box-only"
                    ref={trackRef}
                    testID="tabs-drag-surface"
                    style={[styles.track, { height: trackHeight }, tabbarStyle]}
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
                        style={[styles.panel, panelStyle]}
                    >
                        <View
                            style={[
                                styles.surfaceClip,
                                {
                                    borderRadius: trackHeight / 2,
                                },
                            ]}
                        >
                            {backdrop}
                            <View
                                style={[
                                    styles.surface,
                                    {
                                        backgroundColor: resolvedColors.surface,
                                        opacity: surfaceOpacity,
                                    },
                                ]}
                            />
                        </View>

                        {touchFeedbackEnabled && (
                            <View
                                style={[
                                    styles.touchFeedbackClip,
                                    { borderRadius: trackHeight / 2 },
                                ]}
                            >
                                <TouchFeedback
                                    animatedStyle={touchFeedbackStyle}
                                    centerOpacity={
                                        normalizedTouchFeedbackOpacity
                                    }
                                    color={resolvedTouchFeedbackColor}
                                    diameter={touchFeedbackDiameter}
                                    gradientId="tabbar-touch-feedback"
                                    middleOpacity={touchFeedbackMiddleOpacity}
                                    radius={touchFeedbackRadius}
                                />
                            </View>
                        )}

                        <View
                            style={[
                                styles.tabsRow,
                                { paddingHorizontal: trackInset },
                            ]}
                        >
                            {tabs.map((tab, index) =>
                                cloneElement(tab, {
                                    key: `inactive-${index}`,
                                }),
                            )}
                        </View>

                        <View
                            style={[
                                styles.maskOverscan,
                                {
                                    bottom: -maskOverscanY,
                                    left: -maskOverscanX,
                                    right: -maskOverscanX,
                                    top: -maskOverscanY,
                                },
                                !hasSelectedItem && styles.hidden,
                            ]}
                        >
                            <PillMaskedView
                                animatedStyle={pillMaskStyle}
                                clipStyle={pillClipStyle}
                                contentHeight={
                                    trackHeight + maskOverscanY * 2
                                }
                                contentStyle={pillContentStyle}
                                contentWidth={
                                    webTrackWidth + maskOverscanX * 2
                                }
                                height={itemHeight}
                                left={maskOverscanX + trackInset}
                                tabWidth={getTabWidth(
                                    webTrackWidth,
                                    trackInset,
                                    tabCount,
                                )}
                                top={maskOverscanY + trackInset}
                            >
                                <View style={styles.selectedSurface}>
                                    {selectedBackdrop}
                                    <View
                                        style={[
                                            StyleSheet.absoluteFill,
                                            {
                                                backgroundColor:
                                                    resolvedColors.selectedSurface,
                                                opacity: selectedSurfaceOpacity,
                                            },
                                        ]}
                                    />
                                </View>
                                {touchFeedbackEnabled && (
                                    <TouchFeedback
                                        animatedStyle={
                                            selectedTouchFeedbackStyle
                                        }
                                        centerOpacity={
                                            normalizedTouchFeedbackOpacity
                                        }
                                        color={resolvedTouchFeedbackColor}
                                        diameter={touchFeedbackDiameter}
                                        gradientId="selected-tab-touch-feedback"
                                        middleOpacity={
                                            touchFeedbackMiddleOpacity
                                        }
                                        offsetX={maskOverscanX}
                                        offsetY={maskOverscanY}
                                        radius={touchFeedbackRadius}
                                    />
                                )}
                                <View
                                    style={[
                                        styles.selectedTabsRow,
                                        {
                                            height: itemHeight,
                                            left: maskOverscanX + trackInset,
                                            right: maskOverscanX + trackInset,
                                            top: maskOverscanY + trackInset,
                                        },
                                    ]}
                                >
                                    {tabs.map((tab, index) =>
                                        cloneElement(tab, {
                                            animatedStyle: activeItemStyle,
                                            isActive: true,
                                            key: `active-${index}`,
                                        }),
                                    )}
                                </View>
                            </PillMaskedView>
                        </View>
                    </Animated.View>

                    <View
                        pointerEvents="box-none"
                        style={[
                            styles.accessibilityTabsRow,
                            { paddingHorizontal: trackInset },
                        ]}
                    >
                        {items.map((item, index) => (
                            <View
                                accessibilityActions={
                                    onTabLongPress
                                        ? TAB_ACCESSIBILITY_ACTIONS
                                        : ACTIVATE_ACCESSIBILITY_ACTION
                                }
                                accessibilityLabel={
                                    item.accessibilityLabel ?? item.label
                                }
                                accessibilityRole="tab"
                                accessibilityState={{
                                    selected: semanticSelectedIndex === index,
                                }}
                                accessible
                                key={`accessible-${item.key}`}
                                pointerEvents="none"
                                style={styles.accessibilityTab}
                                testID={item.testID}
                                onAccessibilityAction={(event) => {
                                    if (
                                        event.nativeEvent.actionName ===
                                        "activate"
                                    ) {
                                        activateTab(index);
                                    } else if (
                                        event.nativeEvent.actionName ===
                                        "longpress"
                                    ) {
                                        handleTabLongPress(index);
                                    }
                                }}
                            />
                        ))}
                    </View>
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
    panel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    },
    surface: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    surfaceClip: {
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
        overflow: "hidden",
    },
    touchFeedbackClip: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        overflow: "hidden",
    },
    tabsRow: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
    },
    accessibilityTabsRow: {
        bottom: 0,
        flexDirection: "row",
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 3,
    },
    accessibilityTab: {
        flex: 1,
    },
    maskOverscan: {
        position: "absolute",
        zIndex: 2,
    },
    hidden: {
        display: "none",
    },
    selectedSurface: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    },
    selectedTabsRow: {
        position: "absolute",
        flexDirection: "row",
        alignItems: "center",
        zIndex: 1,
    },
});
