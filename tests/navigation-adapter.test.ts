import { describe, expect, mock, test } from "bun:test";
import {
    getNavigationItems,
    getVisibleRoutes,
    getVisibleSelectedIndex,
    longPressNavigationTab,
    pressNavigationTab,
} from "../src/utils/navigation";
import type {
    JellyNavigationDescriptor,
    JellyNavigationHelpers,
    JellyNavigationRoute,
    TabsIconProps,
} from "../src/types";

const routes: readonly JellyNavigationRoute[] = [
    { key: "home-key", name: "index", path: "/" },
    { key: "internal-key", name: "internal", path: "/internal" },
    {
        key: "profile-key",
        name: "profile",
        params: { user: "42" },
        path: "/profile/42",
    },
];

const descriptors: Readonly<Record<string, JellyNavigationDescriptor>> = {
    "home-key": {
        options: {
            href: "/",
            tabBarAccessibilityLabel: "Open home",
            tabBarActiveBadgeStyle: { backgroundColor: "gold" },
            tabBarBadge: 3,
            tabBarBadgeStyle: { backgroundColor: "purple" },
            tabBarButtonTestID: "home-tab",
            tabBarLabel: "Home",
        },
    },
    "internal-key": { options: { href: null, title: "Internal" } },
    "profile-key": { options: { title: "Your profile" } },
};

const createNavigation = (defaultPrevented = false) => {
    const dispatch = mock(() => undefined);
    const emit = mock(() => ({ defaultPrevented }));

    return {
        dispatch,
        emit,
        navigation: { dispatch, emit } as JellyNavigationHelpers,
    };
};

describe("Expo Router tab visibility", () => {
    test("hides routes configured with href: null", () => {
        const visibleRoutes = getVisibleRoutes(routes, descriptors);

        expect(visibleRoutes.map((route) => route.key)).toEqual([
            "home-key",
            "profile-key",
        ]);
    });

    test("keeps routes whose descriptor or href is undefined", () => {
        const routesWithoutOptions = [
            { key: "with-empty-options", name: "empty" },
            { key: "without-descriptor", name: "missing" },
        ];

        expect(
            getVisibleRoutes(routesWithoutOptions, {
                "with-empty-options": { options: {} },
            }),
        ).toEqual(routesWithoutOptions);
    });

    test("maps the focused route to its index after hidden tabs are removed", () => {
        const visibleRoutes = getVisibleRoutes(routes, descriptors);

        expect(
            getVisibleSelectedIndex(visibleRoutes, "profile-key"),
        ).toBe(1);
    });

    test("returns no selection when Expo Router focuses a hidden route", () => {
        const visibleRoutes = getVisibleRoutes(routes, descriptors);

        expect(
            getVisibleSelectedIndex(visibleRoutes, "internal-key"),
        ).toBe(-1);
    });
});

describe("React Navigation item mapping", () => {
    test("maps labels, badges and accessibility props from descriptors", () => {
        const items = getNavigationItems(
            getVisibleRoutes(routes, descriptors),
            descriptors,
        );

        expect(items).toHaveLength(2);
        expect(items[0]).toMatchObject({
            accessibilityLabel: "Open home",
            activeBadgeStyle: { backgroundColor: "gold" },
            badge: 3,
            badgeStyle: { backgroundColor: "purple" },
            key: "home-key",
            label: "Home",
            testID: "home-tab",
        });
        expect(items[1]).toMatchObject({
            key: "profile-key",
            label: "Your profile",
        });
    });

    test("supports hidden labels and falls back to the route name", () => {
        const items = getNavigationItems(
            [
                { key: "hidden-label", name: "settings" },
                { key: "route-label", name: "search" },
            ],
            {
                "hidden-label": {
                    options: { tabBarShowLabel: false },
                },
                "route-label": { options: {} },
            },
        );

        expect(items.map((item) => item.label)).toEqual(["", "search"]);
    });

    test("adapts the focused flag expected by tabBarIcon", () => {
        const tabBarIcon = mock(() => null);
        const [item] = getNavigationItems(
            [{ key: "home", name: "home" }],
            { home: { options: { tabBarIcon } } },
        );

        expect(item).toBeDefined();
        const activeIcon = item!.activeIcon as (
            props: TabsIconProps,
        ) => React.ReactNode;
        const inactiveIcon = item!.inactiveIcon as (
            props: TabsIconProps,
        ) => React.ReactNode;

        activeIcon({
            color: "red",
            colors: {
                activeContent: "red",
                inactiveContent: "gray",
                selectedSurface: "white",
                surface: "black",
            },
            opacity: 1,
            size: 24,
        });
        inactiveIcon({
            color: "gray",
            colors: {
                activeContent: "red",
                inactiveContent: "gray",
                selectedSurface: "white",
                surface: "black",
            },
            opacity: 0.5,
            size: 20,
        });

        expect(tabBarIcon).toHaveBeenNthCalledWith(1, {
            color: "red",
            focused: true,
            size: 24,
        });
        expect(tabBarIcon).toHaveBeenNthCalledWith(2, {
            color: "gray",
            focused: false,
            size: 20,
        });
    });
});

describe("React Navigation events", () => {
    const visibleRoutes = getVisibleRoutes(routes, descriptors);

    test("emits tabPress and dispatches Expo Router route data", () => {
        const { dispatch, emit, navigation } = createNavigation();

        expect(
            pressNavigationTab({
                focusedRouteKey: "home-key",
                index: 1,
                navigation,
                stateKey: "tabs-state",
                visibleRoutes,
            }),
        ).toBe(true);
        expect(emit).toHaveBeenCalledWith({
            canPreventDefault: true,
            target: "profile-key",
            type: "tabPress",
        });
        expect(dispatch).toHaveBeenCalledWith({
            payload: {
                name: "profile",
                params: { user: "42" },
                path: "/profile/42",
            },
            target: "tabs-state",
            type: "NAVIGATE",
        });
    });

    test("does not dispatch when tabPress is prevented", () => {
        const { dispatch, navigation } = createNavigation(true);

        expect(
            pressNavigationTab({
                focusedRouteKey: "home-key",
                index: 1,
                navigation,
                stateKey: "tabs-state",
                visibleRoutes,
            }),
        ).toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
    });

    test("does not dispatch when the pressed tab is already focused", () => {
        const { dispatch, emit, navigation } = createNavigation();

        expect(
            pressNavigationTab({
                focusedRouteKey: "home-key",
                index: 0,
                navigation,
                stateKey: "tabs-state",
                visibleRoutes,
            }),
        ).toBe(true);
        expect(emit).toHaveBeenCalledTimes(1);
        expect(dispatch).not.toHaveBeenCalled();
    });

    test("ignores an index outside the visible routes", () => {
        const { dispatch, emit, navigation } = createNavigation();

        expect(
            pressNavigationTab({
                focusedRouteKey: "home-key",
                index: 99,
                navigation,
                stateKey: "tabs-state",
                visibleRoutes,
            }),
        ).toBe(false);
        expect(emit).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    test("emits tabLongPress for the visible route", () => {
        const { emit, navigation } = createNavigation();

        longPressNavigationTab({ index: 1, navigation, visibleRoutes });

        expect(emit).toHaveBeenCalledWith({
            target: "profile-key",
            type: "tabLongPress",
        });
    });
});
