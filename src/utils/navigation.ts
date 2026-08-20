import type {
    JellyNavigationDescriptor,
    JellyNavigationHelpers,
    JellyNavigationOptions,
    JellyNavigationRoute,
    TabsIcon,
    TabsItem,
} from "../types";
import { StyleSheet } from "react-native";

const EmptyIcon: TabsIcon = () => null;

/**
 * The tab's name, whether or not the label is drawn. Kept separate from
 * `resolveLabel` so hiding the label cannot also remove the accessible name.
 */
const resolveAccessibleName = (
    routeName: string,
    options: JellyNavigationOptions,
) => {
    if (typeof options.tabBarLabel === "string") {
        return options.tabBarLabel;
    }
    return options.title ?? routeName;
};

const resolveLabel = (routeName: string, options: JellyNavigationOptions) => {
    if (options.tabBarShowLabel === false) {
        return "";
    }
    return resolveAccessibleName(routeName, options);
};

type TabBarIconRenderer = NonNullable<JellyNavigationOptions["tabBarIcon"]>;

const iconWrappers = new WeakMap<
    TabBarIconRenderer,
    { active: TabsIcon; inactive: TabsIcon }
>();

const resolveIcon = (
    options: JellyNavigationOptions,
    focused: boolean,
): TabsIcon => {
    const renderIcon = options.tabBarIcon;
    if (!renderIcon) {
        return EmptyIcon;
    }

    let wrappers = iconWrappers.get(renderIcon);
    if (!wrappers) {
        wrappers = {
            active: ({ color, size }) =>
                renderIcon({ color, focused: true, size }),
            inactive: ({ color, size }) =>
                renderIcon({ color, focused: false, size }),
        };
        iconWrappers.set(renderIcon, wrappers);
    }

    return focused ? wrappers.active : wrappers.inactive;
};

/**
 * Expo Router consumes `href: null` and exposes it to custom JavaScript tab bars
 * as `tabBarItemStyle: { display: "none" }`. Keep supporting `href: null`
 * directly for navigation integrations that preserve it.
 */
export const getVisibleRoutes = (
    routes: readonly JellyNavigationRoute[],
    descriptors: Readonly<Record<string, JellyNavigationDescriptor>>,
) =>
    routes.filter((route) => {
        const options = descriptors[route.key]?.options;

        return (
            options?.href !== null &&
            StyleSheet.flatten(options?.tabBarItemStyle)?.display !== "none"
        );
    });

export const getVisibleSelectedIndex = (
    visibleRoutes: readonly JellyNavigationRoute[],
    focusedRouteKey: string | undefined,
) => visibleRoutes.findIndex((route) => route.key === focusedRouteKey);

export const getNavigationItems = (
    visibleRoutes: readonly JellyNavigationRoute[],
    descriptors: Readonly<Record<string, JellyNavigationDescriptor>>,
): TabsItem[] =>
    visibleRoutes.map((route) => {
        const options = descriptors[route.key]?.options ?? {};
        return {
            accessibilityLabel:
                options.tabBarAccessibilityLabel ??
                resolveAccessibleName(route.name, options),
            activeBadgeStyle: options.tabBarActiveBadgeStyle,
            activeIcon: resolveIcon(options, true),
            badge: options.tabBarBadge,
            badgeStyle: options.tabBarBadgeStyle,
            inactiveIcon: resolveIcon(options, false),
            key: route.key,
            label: resolveLabel(route.name, options),
            labelStyle: options.tabBarLabelStyle,
            testID: options.tabBarButtonTestID,
        };
    });

interface PressNavigationTabOptions {
    focusedRouteKey: string | undefined;
    index: number;
    navigation: JellyNavigationHelpers;
    stateKey: string;
    visibleRoutes: readonly JellyNavigationRoute[];
}

export const pressNavigationTab = ({
    focusedRouteKey,
    index,
    navigation,
    stateKey,
    visibleRoutes,
}: PressNavigationTabOptions) => {
    const route = visibleRoutes[index];
    if (!route) {
        return false;
    }

    const event = navigation.emit({
        canPreventDefault: true,
        target: route.key,
        type: "tabPress",
    }) as { defaultPrevented?: boolean };

    if (event.defaultPrevented) {
        return false;
    }

    if (route.key !== focusedRouteKey) {
        navigation.dispatch({
            payload: {
                name: route.name,
                params: route.params,
                path: route.path,
            },
            target: stateKey,
            type: "NAVIGATE",
        });
    }

    return true;
};

interface LongPressNavigationTabOptions {
    index: number;
    navigation: JellyNavigationHelpers;
    visibleRoutes: readonly JellyNavigationRoute[];
}

export const longPressNavigationTab = ({
    index,
    navigation,
    visibleRoutes,
}: LongPressNavigationTabOptions) => {
    const route = visibleRoutes[index];
    if (!route) {
        return;
    }

    navigation.emit({
        target: route.key,
        type: "tabLongPress",
    });
};
