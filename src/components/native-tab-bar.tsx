import { NativeTabSlot } from "./native-tab-slot";
import { AccessibilityTabsRow } from "./tab-bar-layers";
import { ABSOLUTE_FILL } from "./tab-bar-layers/shared";
import {
    DEFAULT_TAB_BAR_COLORS,
    DEFAULT_TAB_BAR_OPACITY,
    resolveTabBarConfig,
} from "../constants";
import {
    getNativeJellyTabBarView,
    type NativeJellyTabBarViewRef,
    type NativeTabEvent,
} from "../native/jelly-tab-bar-view";
import type { JellyTabBarHeadlessProps } from "../types";
import {
    getNativeMotion,
    getNativeTabs,
    toNativeColor,
} from "../utils/native-tab-bar";
import {
    clamp01,
    getGeometry,
    getSelectedItemIndex,
    getTouchFeedbackVisuals,
} from "../utils/tab-bar";
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { StyleSheet, View } from "react-native";

const LABEL_PADDING = 4;

const nativeColor = (color: string, fallback: string) =>
    toNativeColor(color, toNativeColor(fallback, 0));

export const NativeTabBar = ({
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
    const NativeJellyTabBarView = getNativeJellyTabBarView();
    const nativeRef = useRef<NativeJellyTabBarViewRef>(null);
    const [uncontrolledSelectedIndex, setUncontrolledSelectedIndex] =
        useState(0);
    const resolvedConfig = useMemo(() => resolveTabBarConfig(config), [config]);
    const resolvedColors = {
        ...DEFAULT_TAB_BAR_COLORS,
        ...colors,
    };
    const resolvedOpacity = {
        ...DEFAULT_TAB_BAR_OPACITY,
        ...opacity,
    };
    const geometryScale = displayScale > 0 ? displayScale : 1;
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
    const tabCount = items.length;
    const isControlled = selectedIndex !== undefined;
    const semanticSelectedIndex = getSelectedItemIndex(
        isControlled ? selectedIndex : uncontrolledSelectedIndex,
        tabCount,
    );
    const controlledIndex = isControlled
        ? (getSelectedItemIndex(selectedIndex, tabCount) ?? -1)
        : undefined;
    const initialIndex = tabCount > 0 ? 0 : -1;
    const nativeSelectedIndex = controlledIndex ?? initialIndex;
    const confirmedIndex = useRef(nativeSelectedIndex);

    useEffect(() => {
        if (controlledIndex !== undefined) {
            confirmedIndex.current = controlledIndex;
        }
    }, [controlledIndex]);

    const confirmTabPress = useCallback(
        (index: number) => {
            const item = items[index];
            if (!item) {
                return;
            }

            const accepted = onTabPress?.({ index, item });
            if (accepted === false) {
                const fallbackIndex = controlledIndex ?? confirmedIndex.current;
                void nativeRef.current?.restore(fallbackIndex);
                return;
            }

            if (index !== confirmedIndex.current) {
                confirmedIndex.current = index;
                setUncontrolledSelectedIndex(index);
                onTabChange?.({ index, item });
            }
        },
        [controlledIndex, items, onTabChange, onTabPress],
    );

    const handleLongPress = useCallback(
        (index: number) => {
            const item = items[index];
            if (item) {
                onTabLongPress?.({ index, item });
            }
        },
        [items, onTabLongPress],
    );

    const activateTab = useCallback(
        (index: number) => {
            if (tabCount === 0) {
                return;
            }

            const nextIndex = Math.min(Math.max(index, 0), tabCount - 1);
            void nativeRef.current?.activate(nextIndex);
            confirmTabPress(nextIndex);
        },
        [confirmTabPress, tabCount],
    );

    const tabs = useMemo(
        () => getNativeTabs(items, displayScale),
        [displayScale, items],
    );
    const motion = useMemo(
        () => getNativeMotion(resolvedConfig, geometryScale),
        [geometryScale, resolvedConfig],
    );
    const palette = {
        activeContent: nativeColor(
            resolvedColors.activeContent,
            DEFAULT_TAB_BAR_COLORS.activeContent,
        ),
        inactiveContent: nativeColor(
            resolvedColors.inactiveContent,
            DEFAULT_TAB_BAR_COLORS.inactiveContent,
        ),
        selectedSurface: nativeColor(
            resolvedColors.selectedSurface,
            DEFAULT_TAB_BAR_COLORS.selectedSurface,
        ),
        surface: nativeColor(
            resolvedColors.surface,
            DEFAULT_TAB_BAR_COLORS.surface,
        ),
    };
    const layerOpacity = {
        activeContent: clamp01(resolvedOpacity.activeContent),
        inactiveContent: clamp01(resolvedOpacity.inactiveContent),
        selectedSurface: clamp01(resolvedOpacity.selectedSurface),
        surface: clamp01(resolvedOpacity.surface),
    };
    const pillOverhang = resolvedConfig.layout.pillOverhang * displayScale;
    const metrics = {
        iconLabelGap: resolvedConfig.layout.iconLabelGap * displayScale,
        iconSize,
        itemHeight: geometry.itemHeight,
        labelPadding: LABEL_PADDING * displayScale,
        pillOverhang,
        trackHeight: geometry.trackHeight,
        trackInset: geometry.trackInset,
    };
    const nativeTouchFeedback = {
        centerOpacity: touchFeedback.centerOpacity,
        color: nativeColor(
            touchFeedback.color,
            DEFAULT_TAB_BAR_COLORS.selectedSurface,
        ),
        enabled: touchFeedbackEnabled,
        middleOpacity: touchFeedback.middleOpacity,
        radius: touchFeedback.radius,
    };
    const selectedBackdropFrame = {
        bottom: -geometry.maskOverscanY,
        left: -geometry.maskOverscanX,
        right: -geometry.maskOverscanX,
        top: -geometry.maskOverscanY,
    };

    return (
        <View
            style={[styles.wrapper, { height: geometry.trackHeight, maxWidth }]}
        >
            <NativeJellyTabBarView
                layerOpacity={layerOpacity}
                longPressEnabled={Boolean(onTabLongPress) && tabCount > 0}
                metrics={metrics}
                motion={motion}
                onTabLongPress={(event: NativeTabEvent) =>
                    handleLongPress(event.nativeEvent.index)
                }
                onTabPress={(event: NativeTabEvent) =>
                    confirmTabPress(event.nativeEvent.index)
                }
                palette={palette}
                recording={recording}
                ref={nativeRef}
                selectedIndex={nativeSelectedIndex}
                style={styles.fill}
                tabs={tabs}
                testID="tabs-drag-surface"
                touchFeedback={nativeTouchFeedback}
            >
                <View
                    collapsable={false}
                    pointerEvents="none"
                    style={styles.fill}
                >
                    {backdrop}
                </View>
                <View
                    collapsable={false}
                    pointerEvents="none"
                    style={[styles.selectedBackdrop, selectedBackdropFrame]}
                >
                    {selectedBackdrop}
                </View>
                {items.map((item) => (
                    <Fragment key={item.key}>
                        <NativeTabSlot
                            badge={item.badge}
                            badgeStyle={item.badgeStyle}
                            color={resolvedColors.inactiveContent}
                            colors={resolvedColors}
                            displayScale={displayScale}
                            focused={false}
                            icon={item.inactiveIcon}
                            iconSize={iconSize}
                            opacity={layerOpacity.inactiveContent}
                        />
                        <NativeTabSlot
                            activeBadgeStyle={item.activeBadgeStyle}
                            badge={item.badge}
                            badgeStyle={item.badgeStyle}
                            color={resolvedColors.activeContent}
                            colors={resolvedColors}
                            displayScale={displayScale}
                            focused
                            icon={item.activeIcon}
                            iconSize={iconSize}
                            opacity={layerOpacity.activeContent}
                        />
                    </Fragment>
                ))}
            </NativeJellyTabBarView>

            <AccessibilityTabsRow
                items={items}
                onActivate={activateTab}
                onLongPress={onTabLongPress ? handleLongPress : undefined}
                selectedIndex={semanticSelectedIndex}
                trackInset={geometry.trackInset + pillOverhang / 2}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    fill: {
        ...ABSOLUTE_FILL,
    },
    selectedBackdrop: {
        position: "absolute",
    },
    wrapper: {
        alignSelf: "center",
        width: "100%",
    },
});
