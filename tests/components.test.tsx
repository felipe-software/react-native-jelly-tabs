import {
    act,
    cleanup,
    fireEvent,
    render,
    type RenderResult,
} from "@testing-library/react-native";
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    mock,
    test,
} from "bun:test";
import { createElement } from "react";
import type {
    JellyNavigationDescriptor,
    JellyNavigationHelpers,
    JellyNavigationRoute,
    TabsIcon,
    TabsItem,
} from "../src/types";
import {
    absoluteFill,
    dimensions,
    measureInWindow,
    platform,
} from "./setup";

let JellyTabBar: typeof import(
    "../src/components/navigation-tab-bar"
).JellyTabBar;
let PillMaskedView: typeof import(
    "../src/components/pill-masked-view"
).PillMaskedView;
let TabItem: typeof import("../src/components/tab-item").TabItem;
let JellyTabBarHeadless: typeof import(
    "../src/components/tabs"
).JellyTabBarHeadless;
let TouchFeedback: typeof import(
    "../src/components/touch-feedback"
).TouchFeedback;

const host = {
    animatedView: "Animated.View",
    content: "Content",
    icon: "Icon",
    maskedView: "MaskedView",
    navigationIcon: "NavigationIcon",
    radialGradient: "RadialGradient",
    rect: "Rect",
    stop: "Stop",
    text: "Text",
    view: "View",
};

const findAllByType = (renderer: RenderResult, type: string) =>
    renderer.container.queryAll((node) => node.type === type);

const findByType = (renderer: RenderResult, type: string) => {
    const nodes = findAllByType(renderer, type);
    if (nodes.length !== 1) {
        throw new Error(
            `Expected one ${type} host element, received ${nodes.length}`,
        );
    }

    return nodes[0]!;
};

const flattenStyle = (style: unknown): Record<string, unknown> => {
    if (Array.isArray(style)) {
        return style.reduce<Record<string, unknown>>(
            (result, value) => ({ ...result, ...flattenStyle(value) }),
            {},
        );
    }

    return style && typeof style === "object"
        ? (style as Record<string, unknown>)
        : {};
};

const accessibilityTabs = (renderer: RenderResult) =>
    renderer.getAllByRole("tab");

const accessibilityAction = (actionName: "activate" | "longpress") => ({
    nativeEvent: { actionName },
});

const ActiveIcon: TabsIcon = (props) =>
    createElement("Icon", { ...props, variant: "active" });
const InactiveIcon: TabsIcon = (props) =>
    createElement("Icon", { ...props, variant: "inactive" });

const colors = {
    activeContent: "#ff0000",
    inactiveContent: "#777777",
    selectedSurface: "#ffffff",
    surface: "#111111",
};

const items: readonly TabsItem[] = [
    {
        accessibilityLabel: "Open home",
        activeIcon: ActiveIcon,
        inactiveIcon: InactiveIcon,
        key: "home-key",
        label: "Home",
        testID: "home-tab",
    },
    {
        activeIcon: ActiveIcon,
        badge: 2,
        inactiveIcon: InactiveIcon,
        key: "profile-key",
        label: "Profile",
        testID: "profile-tab",
    },
];

beforeAll(async () => {
    ({ JellyTabBar } = await import(
        "../src/components/navigation-tab-bar"
    ));
    ({ PillMaskedView } = await import(
        "../src/components/pill-masked-view"
    ));
    ({ TabItem } = await import("../src/components/tab-item"));
    ({ JellyTabBarHeadless } = await import("../src/components/tabs"));
    ({ TouchFeedback } = await import(
        "../src/components/touch-feedback"
    ));
});

beforeEach(() => {
    platform.OS = "ios";
});

afterEach(async () => {
    await cleanup();
});

describe("TabItem", () => {
    test("renders the active icon, label and badge with active styles", async () => {
        const renderer = await render(
            <TabItem
                activeColor="#ff0000"
                activeIcon={ActiveIcon}
                activeOpacity={0.8}
                badge={7}
                badgeStyle={{ backgroundColor: "navy" }}
                colors={colors}
                displayScale={2}
                inactiveColor="#777777"
                inactiveIcon={InactiveIcon}
                isActive
                labelStyle={{ letterSpacing: 3 }}
                text="Home"
            />,
        );

        const icon = findByType(renderer, host.icon);
        expect(icon.props).toMatchObject({
            color: "#ff0000",
            colors,
            opacity: 0.8,
            size: 56,
            variant: "active",
        });

        const textNodes = findAllByType(renderer, host.text);
        const badge = textNodes.find((node) => node.props.children === 7);
        const label = textNodes.find((node) => node.props.children === "Home");

        expect(flattenStyle(badge?.props.style)).toMatchObject({
            backgroundColor: "navy",
            fontSize: 20,
            height: 32,
        });
        expect(flattenStyle(label?.props.style)).toMatchObject({
            color: "#ff0000",
            fontSize: 26,
            fontWeight: "700",
            letterSpacing: 3,
        });
    });

    test("renders the inactive icon and omits an undefined badge", async () => {
        const renderer = await render(
            <TabItem
                activeIcon={ActiveIcon}
                colors={colors}
                inactiveColor="#777777"
                inactiveIcon={InactiveIcon}
                inactiveOpacity={0.35}
                text="Profile"
            />,
        );

        expect(findByType(renderer, host.icon).props).toMatchObject({
            color: "#777777",
            opacity: 0.35,
            variant: "inactive",
        });
        const textNodes = findAllByType(renderer, host.text);
        expect(textNodes).toHaveLength(1);
        expect(flattenStyle(textNodes[0]?.props.style)).toMatchObject({
            color: "#777777",
            fontWeight: "400",
        });
    });
});

describe("TouchFeedback", () => {
    test("renders the configured radial gradient and geometry", async () => {
        const renderer = await render(
            <TouchFeedback
                animatedStyle={{ opacity: 0.5 }}
                centerOpacity={0.4}
                color="#00ff00"
                diameter={120}
                gradientId="touch-gradient"
                middleOpacity={0.2}
                offsetX={8}
                offsetY={12}
                radius={60}
            />,
        );

        expect(
            flattenStyle(
                findByType(renderer, host.animatedView).props.style,
            ),
        ).toMatchObject({
            height: 120,
            left: 8,
            opacity: 0.5,
            top: 12,
            width: 120,
        });
        expect(
            findByType(renderer, host.radialGradient).props,
        ).toMatchObject({
            cx: 60,
            cy: 60,
            id: "touch-gradient",
            r: 60,
        });
        expect(
            findAllByType(renderer, host.stop)
                .map((stop) => stop.props.stopOpacity),
        ).toEqual([0.4, 0.2, 0]);
        expect(findByType(renderer, host.rect).props).toMatchObject({
            fill: "url(#touch-gradient)",
            height: 120,
            width: 120,
        });
    });
});

describe("PillMaskedView", () => {
    const pillProps = {
        animatedStyle: { transform: [{ translateX: 10 }] },
        clipStyle: { transform: [{ scaleX: 1.1 }] },
        contentHeight: 96,
        contentStyle: { transform: [{ scaleX: 0.9 }] },
        contentWidth: 320,
        height: 56,
        left: 52,
        tabWidth: 100,
        top: 20,
    };

    test("uses MaskedView with a hardware mask on native", async () => {
        const renderer = await render(
            <PillMaskedView {...pillProps}>
                <Content />
            </PillMaskedView>,
        );

        const maskedView = findByType(renderer, host.maskedView);
        expect(maskedView.props.androidRenderingMode).toBe("hardware");
        expect(maskedView.props.style).toBe(absoluteFill);
        expect(maskedView.props.maskElement.props).toMatchObject({
            animatedStyle: pillProps.animatedStyle,
            height: 56,
            left: 52,
            top: 20,
        });
        const maskRenderer = await render(maskedView.props.maskElement);
        expect(
            flattenStyle(
                findByType(maskRenderer, host.animatedView).props.style,
            ),
        ).toMatchObject({
            backgroundColor: "#000000",
            borderRadius: 999,
            height: 56,
            left: 52,
            top: 20,
            transform: [{ translateX: 10 }],
        });
        expect(findByType(renderer, host.content)).toBeDefined();
    });

    test("renders a stable rounded clip hierarchy on web", async () => {
        platform.OS = "web";
        const renderer = await render(
            <PillMaskedView {...pillProps}>
                <Content />
            </PillMaskedView>,
        );

        expect(findAllByType(renderer, host.maskedView)).toHaveLength(0);
        const animatedViews = findAllByType(renderer, host.animatedView);
        expect(animatedViews).toHaveLength(2);
        expect(flattenStyle(animatedViews[0]?.props.style)).toMatchObject({
            borderRadius: 28,
            clipPath: "inset(0 round 999px)",
            height: 56,
            left: 52,
            overflow: "hidden",
            top: 20,
            width: 100,
            willChange: "transform",
        });
        expect(flattenStyle(animatedViews[1]?.props.style)).toMatchObject({
            height: 96,
            width: 320,
        });
    });
});

describe("JellyTabBarHeadless", () => {
    test("renders semantic tabs and respects the controlled selection", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                items={items}
                onTabLongPress={() => undefined}
                selectedIndex={1}
            />,
        );

        const tabs = accessibilityTabs(renderer);
        expect(tabs).toHaveLength(2);
        expect(tabs[0]?.props).toMatchObject({
            accessibilityLabel: "Open home",
            accessibilityRole: "tab",
            accessibilityState: { selected: false },
            testID: "home-tab",
        });
        expect(tabs[1]?.props).toMatchObject({
            accessibilityLabel: "Profile",
            accessibilityState: { selected: true },
            testID: "profile-tab",
        });
        expect(tabs[0]?.props.accessibilityActions).toEqual([
            { name: "activate" },
            { name: "longpress" },
        ]);
    });

    test("activates a tab, updates uncontrolled selection and emits item data", async () => {
        const onTabChange = mock(() => undefined);
        const onTabPress = mock(() => true);
        const renderer = await render(
            <JellyTabBarHeadless
                items={items}
                onTabChange={onTabChange}
                onTabPress={onTabPress}
            />,
        );

        await fireEvent(
            accessibilityTabs(renderer)[1]!,
            "accessibilityAction",
            accessibilityAction("activate"),
        );

        expect(onTabPress).toHaveBeenCalledWith({ index: 1, item: items[1] });
        expect(onTabChange).toHaveBeenCalledWith({ index: 1, item: items[1] });
        expect(
            accessibilityTabs(renderer).map(
                (tab) => tab.props.accessibilityState.selected,
            ),
        ).toEqual([false, true]);
    });

    test("does not change selection when a press is rejected", async () => {
        const onTabChange = mock(() => undefined);
        const onTabPress = mock(() => false);
        const renderer = await render(
            <JellyTabBarHeadless
                items={items}
                onTabChange={onTabChange}
                onTabPress={onTabPress}
            />,
        );

        await fireEvent(
            accessibilityTabs(renderer)[1]!,
            "accessibilityAction",
            accessibilityAction("activate"),
        );

        expect(onTabChange).not.toHaveBeenCalled();
        expect(
            accessibilityTabs(renderer).map(
                (tab) => tab.props.accessibilityState.selected,
            ),
        ).toEqual([true, false]);
    });

    test("emits long presses and handles web track layout", async () => {
        platform.OS = "web";
        const onTabLongPress = mock(() => undefined);
        const renderer = await render(
            <JellyTabBarHeadless
                items={items}
                onTabLongPress={onTabLongPress}
            />,
        );

        await fireEvent(
            accessibilityTabs(renderer)[1]!,
            "accessibilityAction",
            accessibilityAction("longpress"),
        );
        await fireEvent(
            renderer.getByTestId("tabs-drag-surface"),
            "layout",
            { nativeEvent: { layout: { width: 320 } } },
        );

        expect(onTabLongPress).toHaveBeenCalledWith({
            index: 1,
            item: items[1],
        });
        expect(
            findAllByType(renderer, host.animatedView)
                .map((node) => flattenStyle(node.props.style).width),
        ).toContain(416);
    });

    test("remeasures the web track position after a viewport resize", async () => {
        platform.OS = "web";
        const renderer = await render(<JellyTabBarHeadless items={items} />);

        await fireEvent(
            renderer.getByTestId("tabs-drag-surface"),
            "layout",
            { nativeEvent: { layout: { width: 320 } } },
        );
        const measurementsBeforeResize = measureInWindow.mock.calls.length;

        await act(() => dimensions.emitChange());

        expect(measureInWindow).toHaveBeenCalledTimes(
            measurementsBeforeResize + 1,
        );
    });

    test("can omit both touch feedback layers", async () => {
        const renderer = await render(
            <JellyTabBarHeadless items={items} touchFeedbackEnabled={false} />,
        );

        expect(
            findAllByType(renderer, host.radialGradient),
        ).toHaveLength(0);
    });
});

describe("JellyTabBar navigation adapter", () => {
    const routes: readonly JellyNavigationRoute[] = [
        { key: "home-key", name: "index", path: "/" },
        { key: "hidden-key", name: "internal", path: "/internal" },
        {
            key: "style-hidden-key",
            name: "style-hidden",
            path: "/style-hidden",
        },
        {
            key: "profile-key",
            name: "profile",
            params: { user: "42" },
            path: "/profile/42",
        },
    ];
    const navigationIcon = (route: string) =>
        ({ color, focused, size }: {
            color: string;
            focused: boolean;
            size: number;
        }) =>
            createElement("NavigationIcon", {
                color,
                focused,
                route,
                size,
            });
    const descriptors: Readonly<
        Record<string, JellyNavigationDescriptor>
    > = {
        "hidden-key": {
            options: {
                href: null,
                title: "Internal",
            },
        },
        "style-hidden-key": {
            options: {
                tabBarItemStyle: [{ opacity: 0.5 }, { display: "none" }],
                title: "Style hidden",
            },
        },
        "home-key": {
            options: {
                tabBarAccessibilityLabel: "Open home",
                tabBarButtonTestID: "home-navigation-tab",
                tabBarIcon: navigationIcon("home"),
                title: "Home",
            },
        },
        "profile-key": {
            options: {
                tabBarActiveTintColor: "orange",
                tabBarIcon: navigationIcon("profile"),
                tabBarInactiveTintColor: "gray",
                title: "Profile",
            },
        },
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

    test("renders visible tabs while hiding href-null and display-none routes", async () => {
        const { navigation } = createNavigation();
        const renderer = await render(
            <JellyTabBar
                colors={{ activeContent: "purple" }}
                descriptors={descriptors}
                insets={{ bottom: 8, left: 2, right: 4, top: 0 }}
                navigation={navigation}
                state={{ index: 3, key: "tabs-state", routes }}
            />,
        );

        const tabs = accessibilityTabs(renderer);
        expect(tabs).toHaveLength(2);
        expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
            "Open home",
            "Profile",
        ]);
        expect(
            tabs.map((tab) => tab.props.accessibilityState.selected),
        ).toEqual([false, true]);

        const navigationIcons = findAllByType(
            renderer,
            host.navigationIcon,
        );
        expect(
            navigationIcons
                .filter((icon) => icon.props.focused)
                .every((icon) => icon.props.color === "purple"),
        ).toBe(true);
        expect(
            navigationIcons
                .filter((icon) => !icon.props.focused)
                .every((icon) => icon.props.color === "gray"),
        ).toBe(true);

        const outerView = findAllByType(renderer, host.view)[0];
        expect(flattenStyle(outerView?.props.style)).toMatchObject({
            paddingBottom: 20,
            paddingLeft: 22,
            paddingRight: 24,
        });
    });

    test("renders a route when its flattened item style overrides display to flex", async () => {
        const { navigation } = createNavigation();
        const visibleStyleDescriptors: Readonly<
            Record<string, JellyNavigationDescriptor>
        > = {
            ...descriptors,
            "style-hidden-key": {
                options: {
                    tabBarItemStyle: [
                        { display: "none" },
                        { display: "flex" },
                    ],
                    title: "Style visible",
                },
            },
        };
        const renderer = await render(
            <JellyTabBar
                descriptors={visibleStyleDescriptors}
                insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
                navigation={navigation}
                state={{ index: 3, key: "tabs-state", routes }}
            />,
        );

        expect(
            accessibilityTabs(renderer).map(
                (tab) => tab.props.accessibilityLabel,
            ),
        ).toEqual(["Open home", "Style visible", "Profile"]);
    });

    test("dispatches navigation and long-press events from rendered tabs", async () => {
        const { dispatch, emit, navigation } = createNavigation();
        const renderer = await render(
            <JellyTabBar
                descriptors={descriptors}
                insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
                navigation={navigation}
                state={{ index: 3, key: "tabs-state", routes }}
            />,
        );

        await fireEvent(
            accessibilityTabs(renderer)[0]!,
            "accessibilityAction",
            accessibilityAction("activate"),
        );
        expect(emit).toHaveBeenCalledWith({
            canPreventDefault: true,
            target: "home-key",
            type: "tabPress",
        });
        expect(dispatch).toHaveBeenCalledWith({
            payload: { name: "index", params: undefined, path: "/" },
            target: "tabs-state",
            type: "NAVIGATE",
        });

        await fireEvent(
            accessibilityTabs(renderer)[1]!,
            "accessibilityAction",
            accessibilityAction("longpress"),
        );
        expect(emit).toHaveBeenCalledWith({
            target: "profile-key",
            type: "tabLongPress",
        });
    });

    test("shows no selected tab when an href-null route is focused", async () => {
        const { navigation } = createNavigation();
        const renderer = await render(
            <JellyTabBar
                descriptors={descriptors}
                insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
                navigation={navigation}
                state={{ index: 1, key: "tabs-state", routes }}
            />,
        );

        expect(
            accessibilityTabs(renderer).map(
                (tab) => tab.props.accessibilityState.selected,
            ),
        ).toEqual([false, false]);
    });

    test("shows no selected tab when a display-none route is focused", async () => {
        const { navigation } = createNavigation();
        const renderer = await render(
            <JellyTabBar
                descriptors={descriptors}
                insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
                navigation={navigation}
                state={{ index: 2, key: "tabs-state", routes }}
            />,
        );

        expect(
            accessibilityTabs(renderer).map(
                (tab) => tab.props.accessibilityState.selected,
            ),
        ).toEqual([false, false]);
    });
});

function Content() {
    return createElement("Content");
}
