import { DEFAULT_TAB_BAR_COLORS, resolveTabBarConfig } from "../constants";
import type { TabBarColors } from "../constants";
import type { JellyTabBarProps, TabsItem } from "../types";
import { useStableArray } from "../hooks/use-stable-array";
import {
    getNavigationItems,
    getVisibleRoutes,
    getVisibleSelectedIndex,
    longPressNavigationTab,
    pressNavigationTab,
} from "../utils/navigation";
import {
    areItemsEqual,
    areRoutesEqual,
    asColorString,
} from "../utils/navigation-tab-bar";
import { JellyTabBarHeadless } from "./tabs";
import { useCallback, useMemo } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

export const JellyTabBar = ({
    backdrop,
    colors,
    config,
    containerStyle,
    descriptors,
    displayScale = 1,
    floating = false,
    insets,
    maxWidth = 400,
    navigation,
    state,
    ...headlessProps
}: JellyTabBarProps) => {
    const visibleRoutes = useStableArray(
        getVisibleRoutes(state.routes, descriptors),
        areRoutesEqual,
    );
    const focusedRoute = state.routes[state.index];
    const selectedIndex = getVisibleSelectedIndex(
        visibleRoutes,
        focusedRoute?.key,
    );
    const focusedOptions = focusedRoute
        ? descriptors[focusedRoute.key]?.options
        : undefined;
    const resolvedConfig = useMemo(() => resolveTabBarConfig(config), [config]);
    const trackHeight = resolvedConfig.layout.trackHeight * displayScale;

    const items = useStableArray<TabsItem>(
        getNavigationItems(visibleRoutes, descriptors),
        areItemsEqual,
    );

    const activeTint = asColorString(
        focusedOptions?.tabBarActiveTintColor,
    );
    const inactiveTint = asColorString(
        focusedOptions?.tabBarInactiveTintColor,
    );
    const activeSurface = asColorString(
        focusedOptions?.tabBarActiveBackgroundColor,
    );
    const inactiveSurface = asColorString(
        focusedOptions?.tabBarInactiveBackgroundColor,
    );
    const {
        activeContent: overrideActiveContent,
        inactiveContent: overrideInactiveContent,
        selectedSurface: overrideSelectedSurface,
        surface: overrideSurface,
    } = colors ?? {};

    const navigationColors = useMemo<TabBarColors>(
        () => ({
            activeContent:
                overrideActiveContent ??
                activeTint ??
                DEFAULT_TAB_BAR_COLORS.activeContent,
            inactiveContent:
                overrideInactiveContent ??
                inactiveTint ??
                DEFAULT_TAB_BAR_COLORS.inactiveContent,
            selectedSurface:
                overrideSelectedSurface ??
                activeSurface ??
                DEFAULT_TAB_BAR_COLORS.selectedSurface,
            surface:
                overrideSurface ??
                inactiveSurface ??
                DEFAULT_TAB_BAR_COLORS.surface,
        }),
        [
            activeTint,
            inactiveTint,
            activeSurface,
            inactiveSurface,
            overrideActiveContent,
            overrideInactiveContent,
            overrideSelectedSurface,
            overrideSurface,
        ],
    );

    const handleTabPress = useCallback(
        ({ index }: { index: number }) => {
            return pressNavigationTab({
                focusedRouteKey: focusedRoute?.key,
                index,
                navigation,
                stateKey: state.key,
                visibleRoutes,
            });
        },
        [focusedRoute?.key, navigation, state.key, visibleRoutes],
    );

    const handleTabLongPress = useCallback(
        ({ index }: { index: number }) => {
            longPressNavigationTab({
                index,
                navigation,
                visibleRoutes,
            });
        },
        [navigation, visibleRoutes],
    );

    return (
        <View
            // The container is full width while the track is centered and capped
            // at `maxWidth`, so without this the empty strip either side of the
            // bar swallows touches meant for the content behind it.
            pointerEvents="box-none"
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom + 12,
                    paddingLeft: insets.left + 20,
                    paddingRight: insets.right + 20,
                },
                focusedOptions?.tabBarStyle as StyleProp<ViewStyle>,
                floating && styles.floating,
                containerStyle,
            ]}
        >
            <View style={[styles.bar, { height: trackHeight, maxWidth }]}>
                <JellyTabBarHeadless
                    {...headlessProps}
                    backdrop={backdrop ?? focusedOptions?.tabBarBackground?.()}
                    colors={navigationColors}
                    config={config}
                    displayScale={displayScale}
                    items={items}
                    onTabLongPress={handleTabLongPress}
                    onTabPress={handleTabPress}
                    selectedIndex={selectedIndex}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        alignSelf: "center",
        width: "100%",
    },
    container: {
        paddingTop: 12,
        width: "100%",
    },
    floating: {
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        zIndex: 1,
    },
});
