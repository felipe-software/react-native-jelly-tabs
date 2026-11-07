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
import type { TabsIcon, TabsItem } from "../src/types";
import { nativeViewCalls, platform, processColor } from "./setup";

let JellyTabBarHeadless: typeof import("../src/components/tabs").JellyTabBarHeadless;
let glyphIcon: typeof import("../src/icons").glyphIcon;
let pathIcon: typeof import("../src/icons").pathIcon;
let getNavigationItems: typeof import("../src/utils/navigation").getNavigationItems;
let getNativeIcon: typeof import("../src/utils/native-tab-bar").getNativeIcon;

const HOME_PATH = "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z";
const OUTLINE_PATH =
    "M12 5.69 17 10.19V18h-2v-6H9v6H7v-7.81l5-4.5M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z";

const ReactIcon: TabsIcon = (props) => createElement("Icon", props);

const nativeView = (renderer: RenderResult) => {
    const [view] = renderer.container.queryAll(
        (node) => node.type === "NativeJellyTabBarView",
    );
    if (!view) {
        throw new Error("Expected the native jelly tab bar view");
    }
    return view;
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

const tabEvent = (index: number) => ({ nativeEvent: { index } });

const accessibilityAction = (actionName: "activate" | "longpress") => ({
    nativeEvent: { actionName },
});

const makeItems = (): TabsItem[] => [
    {
        activeIcon: ReactIcon,
        badge: 4,
        badgeStyle: { backgroundColor: "#0000ff" },
        activeBadgeStyle: { color: "#00ff00" },
        inactiveIcon: ReactIcon,
        key: "home",
        label: "Home",
    },
    {
        activeIcon: pathIcon(HOME_PATH, { inactivePath: OUTLINE_PATH }),
        inactiveIcon: pathIcon(HOME_PATH, { inactivePath: OUTLINE_PATH }),
        key: "path",
        label: "Path",
        labelStyle: {
            color: "#123456",
            fontStyle: "italic",
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
        },
    },
    {
        activeIcon: glyphIcon("MaterialIcons", 0xe88a),
        inactiveIcon: glyphIcon("MaterialIcons", 0xe88a),
        key: "glyph",
        label: "",
    },
];

beforeAll(async () => {
    ({ JellyTabBarHeadless } = await import("../src/components/tabs"));
    ({ glyphIcon, pathIcon } = await import("../src/icons"));
    ({ getNavigationItems } = await import("../src/utils/navigation"));
    ({ getNativeIcon } = await import("../src/utils/native-tab-bar"));
});

beforeEach(() => {
    platform.OS = "android";
    nativeViewCalls.activate.mockClear();
    nativeViewCalls.restore.mockClear();
});

afterEach(async () => {
    platform.OS = "ios";
    await cleanup();
});

describe("Android native renderer", () => {
    test("renders the native view instead of the Reanimated layers", async () => {
        const renderer = await render(
            <JellyTabBarHeadless items={makeItems()} />,
        );

        expect(nativeView(renderer)).toBeDefined();
        expect(
            renderer.container.queryAll((node) => node.type === "MaskedView"),
        ).toHaveLength(0);
        expect(renderer.getAllByRole("tab")).toHaveLength(3);
    });

    test("maps icons and label styles to native tabs", async () => {
        const renderer = await render(
            <JellyTabBarHeadless displayScale={2} items={makeItems()} />,
        );

        const [reactTab, pathTab, glyphTab] = nativeView(renderer).props.tabs;
        expect(reactTab).toMatchObject({
            activeIcon: { kind: "react" },
            activeLabel: { fontSize: 22, fontWeight: 600, italic: false },
            inactiveLabel: { fontSize: 22, fontWeight: 500 },
            label: "Home",
        });
        expect(pathTab).toMatchObject({
            activeIcon: { kind: "path", path: HOME_PATH, viewBox: 24 },
            activeLabel: {
                color: processColor("#123456"),
                fontWeight: 600,
                italic: true,
                letterSpacing: 1.5,
            },
            inactiveIcon: { kind: "path", path: OUTLINE_PATH },
            label: "PATH",
        });
        expect(glyphTab).toMatchObject({
            activeIcon: {
                fontFamily: "MaterialIcons",
                glyph: String.fromCodePoint(0xe88a),
                kind: "glyph",
            },
            label: "",
        });
    });

    test("hosts React icons, badges and backdrops as native children", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                backdrop={createElement("Backdrop")}
                items={makeItems()}
                selectedBackdrop={createElement("SelectedBackdrop")}
            />,
        );

        const children = nativeView(renderer).children;
        expect(children).toHaveLength(2 + 3 * 2);
        expect(
            renderer.container.queryAll((node) => node.type === "Backdrop"),
        ).toHaveLength(1);
        expect(
            renderer.container.queryAll(
                (node) => node.type === "SelectedBackdrop",
            ),
        ).toHaveLength(1);

        const icons = renderer.container.queryAll(
            (node) => node.type === "Icon",
        );
        expect(icons.map((icon) => icon.props.focused)).toEqual([false, true]);

        const badges = renderer.container.queryAll(
            (node) => node.type === "Text" && node.props.children === 4,
        );
        expect(badges.map((badge) => flattenStyle(badge.props.style))).toEqual([
            expect.objectContaining({ backgroundColor: "#0000ff" }),
            expect.objectContaining({
                backgroundColor: "#0000ff",
                color: "#00ff00",
            }),
        ]);

        const bakedSlot = renderer.container.queryAll(
            (node) =>
                node.type === "View" &&
                node.props.collapsable === false &&
                flattenStyle(node.props.style).width === 28,
        );
        expect(bakedSlot).toHaveLength(4);
    });

    test("passes resolved colors, opacity, metrics and motion", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                colors={{ surface: "#101010" }}
                config={{ distortion: { pressedScale: 1.05 } }}
                displayScale={2}
                items={makeItems()}
                opacity={{ selectedSurface: 4, surface: -1 }}
                touchFeedbackEnabled={false}
            />,
        );

        const props = nativeView(renderer).props;
        expect(props.palette.surface).toBe(processColor("#101010"));
        expect(props.layerOpacity).toMatchObject({
            selectedSurface: 1,
            surface: 0,
        });
        expect(props.metrics).toEqual({
            iconLabelGap: 2,
            iconSize: 56,
            itemHeight: 112,
            labelPadding: 8,
            pillOverhang: 16,
            trackHeight: 128,
            trackInset: 8,
        });
        expect(props.motion).toMatchObject({
            barPressedScale: 1.05,
            panelOffset: 8,
            pillPressedScale: 1.2,
            verticalDistortionDistance: 1400,
        });
        expect(props.touchFeedback.enabled).toBe(false);
        expect(props.longPressEnabled).toBe(false);
    });

    test("confirms native presses and reports changes", async () => {
        const onTabChange = mock();
        const onTabPress = mock();
        const renderer = await render(
            <JellyTabBarHeadless
                items={makeItems()}
                onTabChange={onTabChange}
                onTabPress={onTabPress}
            />,
        );

        await act(async () => {
            fireEvent(nativeView(renderer), "tabPress", tabEvent(1));
        });

        expect(onTabPress).toHaveBeenCalledWith(
            expect.objectContaining({ index: 1 }),
        );
        expect(onTabChange).toHaveBeenCalledWith(
            expect.objectContaining({ index: 1 }),
        );
        expect(
            renderer.getAllByRole("tab")[1]?.props.accessibilityState,
        ).toEqual({ selected: true });

        await act(async () => {
            fireEvent(nativeView(renderer), "tabPress", tabEvent(1));
        });
        expect(onTabChange).toHaveBeenCalledTimes(1);
    });

    test("restores the controlled tab after a rejected press", async () => {
        const onTabChange = mock();
        const renderer = await render(
            <JellyTabBarHeadless
                items={makeItems()}
                onTabChange={onTabChange}
                onTabPress={() => false}
                selectedIndex={2}
            />,
        );

        expect(nativeView(renderer).props.selectedIndex).toBe(2);
        await act(async () => {
            fireEvent(nativeView(renderer), "tabPress", tabEvent(0));
        });

        expect(nativeViewCalls.restore).toHaveBeenCalledWith(2);
        expect(onTabChange).not.toHaveBeenCalled();
    });

    test("forwards long presses and accessibility actions", async () => {
        const onTabLongPress = mock();
        const onTabPress = mock();
        const renderer = await render(
            <JellyTabBarHeadless
                items={makeItems()}
                onTabLongPress={onTabLongPress}
                onTabPress={onTabPress}
            />,
        );

        expect(nativeView(renderer).props.longPressEnabled).toBe(true);
        await act(async () => {
            fireEvent(nativeView(renderer), "tabLongPress", tabEvent(2));
        });
        expect(onTabLongPress).toHaveBeenCalledWith(
            expect.objectContaining({ index: 2 }),
        );

        const [, secondTab] = renderer.getAllByRole("tab");
        await act(async () => {
            fireEvent(
                secondTab!,
                "accessibilityAction",
                accessibilityAction("activate"),
            );
        });
        expect(nativeViewCalls.activate).toHaveBeenCalledWith(1);
        expect(onTabPress).toHaveBeenCalledWith(
            expect.objectContaining({ index: 1 }),
        );
    });

    test("centers the accessibility tabs on the overhanging slots", async () => {
        const renderer = await render(
            <JellyTabBarHeadless
                config={{ layout: { pillOverhang: 12, trackInset: 6 } }}
                items={makeItems()}
            />,
        );

        const row = renderer.getAllByRole("tab")[0]?.parent;
        expect(flattenStyle(row?.props.style)).toMatchObject({
            paddingHorizontal: 12,
        });
    });

    test("hides the pill when nothing is selected", async () => {
        const renderer = await render(
            <JellyTabBarHeadless items={makeItems()} selectedIndex={null} />,
        );

        expect(nativeView(renderer).props.selectedIndex).toBe(-1);
    });
});

describe("icon helpers", () => {
    test("render paths and glyphs as React icons off Android", async () => {
        platform.OS = "ios";
        const PathIcon = pathIcon(HOME_PATH, {
            inactivePath: OUTLINE_PATH,
            viewBox: 48,
        });
        const GlyphIcon = glyphIcon("MaterialIcons", "★");

        const renderer = await render(
            <>
                <PathIcon color="#ff0000" focused={false} size={20} />
                <GlyphIcon color="#00ff00" size={30} />
            </>,
        );

        const svg = renderer.container.queryAll((node) => node.type === "Svg");
        expect(svg[0]?.props).toMatchObject({
            height: 20,
            viewBox: "0 0 48 48",
            width: 20,
        });
        const path = renderer.container.queryAll(
            (node) => node.type === "Path",
        );
        expect(path[0]?.props).toMatchObject({
            d: OUTLINE_PATH,
            fill: "#ff0000",
        });
        const glyph = renderer.container.queryAll(
            (node) => node.type === "Text" && node.props.children === "★",
        );
        expect(flattenStyle(glyph[0]?.props.style)).toMatchObject({
            color: "#00ff00",
            fontFamily: "MaterialIcons",
            fontSize: 30,
        });
    });

    test("keep native sources through navigation tabBarIcon wrappers", () => {
        const [item] = getNavigationItems([{ key: "home", name: "home" }], {
            home: {
                options: {
                    tabBarIcon: pathIcon(HOME_PATH, {
                        inactivePath: OUTLINE_PATH,
                    }),
                },
            },
        });

        expect(getNativeIcon(item?.activeIcon, "active")).toEqual({
            kind: "path",
            path: HOME_PATH,
            viewBox: 24,
        });
        expect(getNativeIcon(item?.inactiveIcon, "inactive")).toEqual({
            kind: "path",
            path: OUTLINE_PATH,
            viewBox: 24,
        });
    });

    test("treat plain components as React icons", () => {
        expect(getNativeIcon(ReactIcon, "active")).toEqual({ kind: "react" });
    });
});
