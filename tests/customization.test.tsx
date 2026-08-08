import {
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
import { DEFAULT_TAB_BAR_COLORS } from "../src/constants";
import type {
    JellyNavigationDescriptor,
    JellyNavigationHelpers,
    TabsIcon,
    TabsItem,
} from "../src/types";
import { platform } from "./setup";

let JellyTabBar: typeof import(
    "../src/components/navigation-tab-bar"
).JellyTabBar;
let JellyTabBarHeadless: typeof import(
    "../src/components/tabs"
).JellyTabBarHeadless;
let JellyTabs: typeof import("../src/components/tabs").JellyTabs;

const host = {
    animatedView: "Animated.View",
    icon: "CustomizationIcon",
    maskedView: "MaskedView",
    navigationBackdrop: "NavigationBackdrop",
    radialGradient: "RadialGradient",
    rect: "Rect",
    selectedBackdrop: "SelectedBackdrop",
    stop: "Stop",
    text: "Text",
    trackBackdrop: "TrackBackdrop",
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

const findViewByBackgroundColor = (
    renderer: RenderResult,
    backgroundColor: string,
) =>
    findAllByType(renderer, host.view).find(
        (node) =>
            flattenStyle(node.props.style).backgroundColor ===
            backgroundColor,
    );

const ActiveIcon: TabsIcon = (props) =>
    createElement(host.icon, { ...props, variant: "active" });
const InactiveIcon: TabsIcon = (props) =>
    createElement(host.icon, { ...props, variant: "inactive" });

const items: readonly TabsItem[] = [
    {
        activeIcon: ActiveIcon,
        inactiveIcon: InactiveIcon,
        key: "home",
        label: "Home",
        testID: "home-tab",
    },
    {
        activeIcon: ActiveIcon,
        inactiveIcon: InactiveIcon,
        key: "profile",
        label: "Profile",
        testID: "profile-tab",
    },
];

const accessibilityAction = (actionName: "activate" | "longpress") => ({
    nativeEvent: { actionName },
});

beforeAll(async () => {
    ({ JellyTabBar } = await import(
        "../src/components/navigation-tab-bar"
    ));
    ({ JellyTabBarHeadless, JellyTabs } = await import(
        "../src/components/tabs"
    ));
});

beforeEach(() => {
    platform.OS = "ios";
});

afterEach(async () => {
    await cleanup();
});

describe("PROPS.md component contract", () => {
    test("keeps JellyTabs as an alias for JellyTabBarHeadless", () => {
        expect(JellyTabs).toBe(JellyTabBarHeadless);
    });

    test("applies maxWidth, displayScale and partial layout configuration", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                config={{
                    layout: {
                        iconSize: 35,
                        itemHeight: 30,
                        maskOverscanX: 7,
                        maskOverscanY: 5,
                        trackHeight: 40,
                        trackInset: 3,
                    },
                }}
                displayScale={2}
                items={items}
                maxWidth={640}
            />,
        );

        const wrapper = findAllByType(renderer, host.animatedView).find(
            (node) => flattenStyle(node.props.style).maxWidth === 640,
        );
        expect(flattenStyle(wrapper?.props.style)).toMatchObject({
            height: 80,
            maxWidth: 640,
        });
        expect(
            flattenStyle(
                renderer.getByTestId("tabs-drag-surface").props.style,
            ),
        ).toMatchObject({ height: 80 });
        expect(
            findAllByType(renderer, host.icon).map(
                (icon) => icon.props.size,
            ),
        ).toEqual([70, 70, 70, 70]);

        const maskElement = findByType(renderer, host.maskedView).props
            .maskElement;
        expect(maskElement.props).toMatchObject({
            height: 60,
            left: 20,
            top: 16,
        });
    });

    test("updates controlled selection and hides the selected pill for null or negative indices", async () => {
        const renderer = await render(
            <JellyTabBarHeadless items={items} selectedIndex={null} />,
        );
        const selectedStates = () =>
            renderer
                .getAllByRole("tab")
                .map((tab) => tab.props.accessibilityState.selected);
        const hasHiddenPill = () =>
            findAllByType(renderer, host.view).some(
                (node) =>
                    flattenStyle(node.props.style).display === "none",
            );

        expect(selectedStates()).toEqual([false, false]);
        expect(hasHiddenPill()).toBe(true);

        await renderer.rerender(
            <JellyTabBarHeadless items={items} selectedIndex={-1} />,
        );
        expect(selectedStates()).toEqual([false, false]);
        expect(hasHiddenPill()).toBe(true);

        await renderer.rerender(
            <JellyTabBarHeadless items={items} selectedIndex={1} />,
        );
        expect(selectedStates()).toEqual([false, true]);
        expect(hasHiddenPill()).toBe(false);
    });

    test("calls onTabPress but not onTabChange for the already selected tab", async () => {
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
            renderer.getAllByRole("tab")[0]!,
            "accessibilityAction",
            accessibilityAction("activate"),
        );

        expect(onTabPress).toHaveBeenCalledWith({
            index: 0,
            item: items[0],
        });
        expect(onTabChange).not.toHaveBeenCalled();
    });

    test("merges a partial palette and passes the resolved colors to every icon", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                colors={{ activeContent: "#ff5500" }}
                items={items}
            />,
        );
        const resolvedColors = {
            ...DEFAULT_TAB_BAR_COLORS,
            activeContent: "#ff5500",
        };
        const icons = findAllByType(renderer, host.icon);

        expect(
            icons
                .filter((icon) => icon.props.variant === "active")
                .map((icon) => icon.props.color),
        ).toEqual(["#ff5500", "#ff5500"]);
        expect(
            icons
                .filter((icon) => icon.props.variant === "inactive")
                .map((icon) => icon.props.color),
        ).toEqual(["#b8b4ad", "#b8b4ad"]);
        expect(icons.map((icon) => icon.props.colors)).toEqual([
            resolvedColors,
            resolvedColors,
            resolvedColors,
            resolvedColors,
        ]);
        expect(new Set(icons.map((icon) => icon.props.colors)).size).toBe(1);
        expect(
            new Set(icons.map((icon) => icon.props.size)),
        ).toEqual(new Set([28]));
        expect(
            findAllByType(renderer, host.animatedView).some(
                (node) => flattenStyle(node.props.style).maxWidth === 400,
            ),
        ).toBe(true);
        expect(
            findViewByBackgroundColor(renderer, "#22211f"),
        ).toBeDefined();
        expect(
            findViewByBackgroundColor(renderer, "#f2eee7"),
        ).toBeDefined();
    });

    test("clamps each independently customized opacity between zero and one", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                colors={{
                    activeContent: "#101010",
                    inactiveContent: "#202020",
                    selectedSurface: "#303030",
                    surface: "#404040",
                }}
                items={items}
                opacity={{
                    activeContent: 2,
                    inactiveContent: -1,
                    selectedSurface: 8,
                    surface: -3,
                }}
            />,
        );
        const icons = findAllByType(renderer, host.icon);

        expect(
            icons
                .filter((icon) => icon.props.variant === "active")
                .map((icon) => icon.props.opacity),
        ).toEqual([1, 1]);
        expect(
            icons
                .filter((icon) => icon.props.variant === "inactive")
                .map((icon) => icon.props.opacity),
        ).toEqual([0, 0]);
        expect(
            flattenStyle(
                findViewByBackgroundColor(renderer, "#303030")?.props
                    .style,
            ).opacity,
        ).toBe(1);
        expect(
            flattenStyle(
                findViewByBackgroundColor(renderer, "#404040")?.props
                    .style,
            ).opacity,
        ).toBe(0);
    });

    test("applies label and badge customization while preserving one-line labels", async () => {
        const customItem: TabsItem = {
            accessibilityLabel: "Open inbox",
            activeIcon: ActiveIcon,
            badge: "NEW",
            badgeStyle: { backgroundColor: "purple" },
            inactiveIcon: InactiveIcon,
            key: "inbox",
            label: "A very long inbox label",
            labelStyle: { letterSpacing: 2 },
            testID: "inbox-tab",
        };
        const renderer = await render(
            <JellyTabBarHeadless items={[customItem]} />,
        );
        const textNodes = findAllByType(renderer, host.text);
        const labels = textNodes.filter(
            (node) => node.props.children === customItem.label,
        );
        const badges = textNodes.filter(
            (node) => node.props.children === customItem.badge,
        );

        expect(labels).toHaveLength(2);
        expect(
            labels.every(
                (label) =>
                    label.props.ellipsizeMode === "tail" &&
                    label.props.numberOfLines === 1 &&
                    flattenStyle(label.props.style).letterSpacing === 2,
            ),
        ).toBe(true);
        expect(badges).toHaveLength(2);
        expect(
            badges.every(
                (badge) =>
                    badge.props.numberOfLines === 1 &&
                    flattenStyle(badge.props.style).backgroundColor ===
                        "purple",
            ),
        ).toBe(true);
        expect(
            renderer.getByRole("tab", { name: "Open inbox" }).props.testID,
        ).toBe("inbox-tab");
    });

    test("layers activeBadgeStyle over badgeStyle inside the pill mask only", async () => {
        const customItem: TabsItem = {
            activeBadgeStyle: { backgroundColor: "gold", color: "black" },
            activeIcon: ActiveIcon,
            badge: "NEW",
            badgeStyle: { backgroundColor: "purple" },
            inactiveIcon: InactiveIcon,
            key: "inbox",
            label: "Inbox",
        };
        const renderer = await render(
            <JellyTabBarHeadless items={[customItem]} />,
        );
        // The track row renders before the row revealed through the mask.
        const [trackBadge, maskedBadge] = findAllByType(
            renderer,
            host.text,
        ).filter((node) => node.props.children === customItem.badge);

        expect(flattenStyle(trackBadge?.props.style)).toMatchObject({
            backgroundColor: "purple",
            color: "#FFFFFF",
        });
        expect(flattenStyle(maskedBadge?.props.style)).toMatchObject({
            backgroundColor: "gold",
            color: "black",
        });
    });

    test("renders track and selected backdrops before their color layers", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                backdrop={createElement(host.trackBackdrop)}
                items={items}
                selectedBackdrop={createElement(host.selectedBackdrop)}
            />,
        );
        const trackBackdrop = findByType(renderer, host.trackBackdrop);
        const selectedBackdrop = findByType(
            renderer,
            host.selectedBackdrop,
        );
        const trackSiblings = trackBackdrop.parent?.children.filter(
            (child) => typeof child !== "string",
        );
        const selectedSiblings = selectedBackdrop.parent?.children.filter(
            (child) => typeof child !== "string",
        );

        expect(trackSiblings?.[0]).toBe(trackBackdrop);
        expect(
            flattenStyle(trackSiblings?.[1]?.props.style).backgroundColor,
        ).toBe(DEFAULT_TAB_BAR_COLORS.surface);
        expect(selectedSiblings?.[0]).toBe(selectedBackdrop);
        expect(
            flattenStyle(selectedSiblings?.[1]?.props.style)
                .backgroundColor,
        ).toBe(DEFAULT_TAB_BAR_COLORS.selectedSurface);
    });

    test("derives touch feedback from colors and distortion config", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                colors={{ selectedSurface: "#abcdef" }}
                config={{
                    distortion: {
                        touchFeedback: {
                            middleOpacityRatio: 0.25,
                            opacity: 0.4,
                            radius: 10,
                            scale: 3,
                        },
                    },
                }}
                items={items}
            />,
        );

        expect(
            findAllByType(renderer, host.radialGradient).map(
                (gradient) => gradient.props.r,
            ),
        ).toEqual([30, 30]);
        expect(
            findAllByType(renderer, host.stop).map((stop) => ({
                color: stop.props.stopColor,
                opacity: stop.props.stopOpacity,
            })),
        ).toEqual([
            { color: "#abcdef", opacity: 0.4 },
            { color: "#abcdef", opacity: 0.1 },
            { color: "#abcdef", opacity: 0 },
            { color: "#abcdef", opacity: 0.4 },
            { color: "#abcdef", opacity: 0.1 },
            { color: "#abcdef", opacity: 0 },
        ]);
        expect(
            findAllByType(renderer, host.rect).map(
                (rect) => rect.props.width,
            ),
        ).toEqual([60, 60]);
    });

    test("lets direct touch feedback props override the config", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                config={{
                    distortion: {
                        touchFeedback: {
                            middleOpacityRatio: 0.25,
                            radius: 10,
                        },
                    },
                }}
                items={items}
                touchFeedbackColor="#123456"
                touchFeedbackOpacity={2}
                touchFeedbackScale={0.5}
            />,
        );

        expect(
            findAllByType(renderer, host.radialGradient).map(
                (gradient) => gradient.props.r,
            ),
        ).toEqual([5, 5]);
        expect(
            findAllByType(renderer, host.stop).map((stop) => ({
                color: stop.props.stopColor,
                opacity: stop.props.stopOpacity,
            })),
        ).toEqual([
            { color: "#123456", opacity: 1 },
            { color: "#123456", opacity: 0.25 },
            { color: "#123456", opacity: 0 },
            { color: "#123456", opacity: 1 },
            { color: "#123456", opacity: 0.25 },
            { color: "#123456", opacity: 0 },
        ]);
    });
});

describe("PROPS.md navigation customization", () => {
    test("maps navigator appearance options and wrapper overrides", async () => {
        const dispatch = mock(() => undefined);
        const emit = mock(() => ({ defaultPrevented: false }));
        const navigation = { dispatch, emit } as JellyNavigationHelpers;
        const descriptors: Readonly<
            Record<string, JellyNavigationDescriptor>
        > = {
            dashboard: {
                options: {
                    tabBarAccessibilityLabel: "Open dashboard",
                    tabBarActiveBackgroundColor: "#ffeecc",
                    tabBarActiveTintColor: "#ff6600",
                    tabBarBackground: () =>
                        createElement(host.navigationBackdrop),
                    tabBarBadge: "NEW",
                    tabBarBadgeStyle: { backgroundColor: "#660099" },
                    tabBarButtonTestID: "dashboard-tab",
                    tabBarIcon: ({ color, focused, size }) =>
                        createElement(host.icon, {
                            color,
                            focused,
                            size,
                            variant: focused ? "active" : "inactive",
                        }),
                    tabBarInactiveBackgroundColor: "#111122",
                    tabBarInactiveTintColor: "#999999",
                    tabBarLabel: "Dashboard",
                    tabBarLabelStyle: { letterSpacing: 4 },
                    tabBarStyle: { borderWidth: 3, paddingTop: 18 },
                },
            },
        };
        const renderer = await render(
            <JellyTabBar
                containerStyle={{
                    backgroundColor: "#fafafa",
                    paddingTop: 40,
                }}
                descriptors={descriptors}
                displayScale={0.5}
                floating
                insets={{ bottom: 6, left: 1, right: 2, top: 0 }}
                maxWidth={520}
                navigation={navigation}
                state={{
                    index: 0,
                    key: "tabs-state",
                    routes: [{ key: "dashboard", name: "index" }],
                }}
            />,
        );
        const root = renderer.root;
        if (!root) {
            throw new Error("Expected JellyTabBar to render a root view");
        }
        const bar = root.children.find(
            (child) => typeof child !== "string",
        );

        expect(flattenStyle(root.props.style)).toMatchObject({
            backgroundColor: "#fafafa",
            borderWidth: 3,
            bottom: 0,
            left: 0,
            paddingBottom: 18,
            paddingLeft: 21,
            paddingRight: 22,
            paddingTop: 40,
            position: "absolute",
            right: 0,
        });
        expect(flattenStyle(bar?.props.style)).toMatchObject({
            height: 32,
            maxWidth: 520,
        });
        expect(
            findByType(renderer, host.navigationBackdrop),
        ).toBeDefined();

        const icons = findAllByType(renderer, host.icon);
        expect(
            icons.find((icon) => icon.props.focused)?.props.color,
        ).toBe("#ff6600");
        expect(
            icons.find((icon) => !icon.props.focused)?.props.color,
        ).toBe("#999999");
        expect(
            findViewByBackgroundColor(renderer, "#ffeecc"),
        ).toBeDefined();
        expect(
            findViewByBackgroundColor(renderer, "#111122"),
        ).toBeDefined();

        const labels = findAllByType(renderer, host.text).filter(
            (node) => node.props.children === "Dashboard",
        );
        const badges = findAllByType(renderer, host.text).filter(
            (node) => node.props.children === "NEW",
        );
        expect(labels).toHaveLength(2);
        expect(badges).toHaveLength(2);
        expect(
            labels.every(
                (label) =>
                    flattenStyle(label.props.style).letterSpacing === 4,
            ),
        ).toBe(true);
        expect(
            badges.every(
                (badge) =>
                    flattenStyle(badge.props.style).backgroundColor ===
                    "#660099",
            ),
        ).toBe(true);
        expect(
            renderer.getByRole("tab", { name: "Open dashboard" }).props
                .testID,
        ).toBe("dashboard-tab");
    });
});
