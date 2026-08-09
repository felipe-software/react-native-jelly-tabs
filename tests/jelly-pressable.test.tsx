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
import { GELATIN } from "../src/constants";
import { measureInWindow, platform } from "./setup";

let JellyPressable: typeof import(
    "../src/components/jelly-pressable"
).JellyPressable;

const host = {
    animatedView: "Animated.View",
    label: "Label",
    radialGradient: "RadialGradient",
    rect: "Rect",
    stop: "Stop",
    view: "View",
};

const findAllByType = (renderer: RenderResult, type: string) =>
    renderer.container.queryAll((node) => node.type === type);

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

const accessibilityAction = (actionName: "activate" | "longpress") => ({
    nativeEvent: { actionName },
});

const layout = (width: number, height: number) => ({
    nativeEvent: { layout: { height, width } },
});

const Label = () => createElement("Label");

beforeAll(async () => {
    ({ JellyPressable } = await import("../src/components/jelly-pressable"));
});

beforeEach(() => {
    platform.OS = "ios";
    measureInWindow.mockClear();
});

afterEach(async () => {
    await cleanup();
});

describe("JellyPressable", () => {
    test("renders children inside an accessible button", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityHint="Opens the composer"
                accessibilityLabel="Compose"
                testID="compose"
            >
                <Label />
            </JellyPressable>,
        );

        const button = renderer.getByRole("button");
        expect(button.props).toMatchObject({
            accessibilityHint: "Opens the composer",
            accessibilityLabel: "Compose",
            accessibilityState: { disabled: false },
        });
        expect(button.props.accessibilityActions).toEqual([
            { name: "activate" },
        ]);
        expect(renderer.getByTestId("compose")).toBeDefined();
        expect(findAllByType(renderer, host.label)).toHaveLength(1);
    });

    test("keeps the semantics on an inert layer, off the gesture surface", async () => {
        const renderer = await render(
            <JellyPressable accessibilityLabel="Compose" testID="compose">
                <Label />
            </JellyPressable>,
        );

        // Gesture Handler skips web pointer capture when its own view carries
        // role="button", which would drop every release outside the button.
        const surface = renderer.getByTestId("compose");
        expect(surface.props.accessibilityRole).toBeUndefined();
        expect(surface.props.pointerEvents).toBe("box-only");
        expect(renderer.getByRole("button").props.pointerEvents).toBe("none");
    });

    test("accepts a custom role and merges the accessibility state", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityRole="tab"
                accessibilityState={{ selected: true }}
                accessibilityLabel="Second"
            />,
        );

        expect(renderer.getByRole("tab").props.accessibilityState).toEqual({
            disabled: false,
            selected: true,
        });
    });

    test("advertises a long press action only when one is handled", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                onLongPress={() => undefined}
            />,
        );

        expect(
            renderer.getByRole("button").props.accessibilityActions,
        ).toEqual([{ name: "activate" }, { name: "longpress" }]);
    });

    test("runs press and long-press handlers from accessibility actions", async () => {
        const onLongPress = mock(() => undefined);
        const onPress = mock(() => undefined);
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                onLongPress={onLongPress}
                onPress={onPress}
            />,
        );

        const button = renderer.getByRole("button");
        await fireEvent(
            button,
            "accessibilityAction",
            accessibilityAction("activate"),
        );
        await fireEvent(
            button,
            "accessibilityAction",
            accessibilityAction("longpress"),
        );

        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    test("ignores accessibility actions while disabled", async () => {
        const onPress = mock(() => undefined);
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                disabled
                onPress={onPress}
            />,
        );

        const button = renderer.getByRole("button");
        await fireEvent(
            button,
            "accessibilityAction",
            accessibilityAction("activate"),
        );

        expect(onPress).not.toHaveBeenCalled();
        expect(button.props.accessibilityState).toEqual({ disabled: true });
    });

    test("draws the glow with the default radius and opacity ramp", async () => {
        const renderer = await render(
            <JellyPressable accessibilityLabel="Compose" />,
        );

        const { opacity, radius } = GELATIN.touchFeedback;
        const gradient = findAllByType(renderer, host.radialGradient)[0];
        expect(gradient?.props).toMatchObject({
            cx: radius,
            cy: radius,
            r: radius,
        });
        expect(gradient?.props.id).toStartWith("jelly-pressable-glow-");
        expect(findAllByType(renderer, host.rect)[0]?.props).toMatchObject({
            fill: `url(#${gradient?.props.id})`,
            height: radius * 2,
            width: radius * 2,
        });
        expect(
            findAllByType(renderer, host.stop).map(
                (stop) => stop.props.stopOpacity,
            ),
        ).toEqual([
            opacity,
            opacity * GELATIN.touchFeedback.middleOpacityRatio,
            0,
        ]);
    });

    test("scales, tints and clamps the glow from props", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                touchFeedbackColor="#38bdf8"
                touchFeedbackOpacity={4}
                touchFeedbackScale={0.5}
            />,
        );

        const expectedRadius = GELATIN.touchFeedback.radius * 0.5;
        expect(
            findAllByType(renderer, host.radialGradient)[0]?.props.r,
        ).toBe(expectedRadius);
        expect(
            findAllByType(renderer, host.stop).map((stop) => [
                stop.props.stopColor,
                stop.props.stopOpacity,
            ]),
        ).toEqual([
            ["#38bdf8", 1],
            ["#38bdf8", GELATIN.touchFeedback.middleOpacityRatio],
            ["#38bdf8", 0],
        ]);
    });

    test("omits the glow layer entirely when disabled", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                touchFeedbackEnabled={false}
            />,
        );

        expect(findAllByType(renderer, host.radialGradient)).toHaveLength(0);
    });

    test("clips the glow to the radius declared on style", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                style={{ borderRadius: 24 }}
            />,
        );

        const clip = findAllByType(renderer, host.view)[0];
        expect(flattenStyle(clip?.props.style)).toMatchObject({
            borderRadius: 24,
            overflow: "hidden",
        });
    });

    test("lets an explicit borderRadius win over the one on style", async () => {
        const renderer = await render(
            <JellyPressable
                accessibilityLabel="Compose"
                borderRadius={8}
                style={{ borderRadius: 24 }}
            />,
        );

        expect(
            flattenStyle(findAllByType(renderer, host.view)[0]?.props.style),
        ).toMatchObject({ borderRadius: 8 });
        // The surface itself still uses the radius from `style`.
        expect(
            flattenStyle(
                findAllByType(renderer, host.animatedView)[0]?.props.style,
            ),
        ).toMatchObject({ borderRadius: 24 });
    });

    test("measures its window position on layout for web coordinates", async () => {
        platform.OS = "web";
        const renderer = await render(
            <JellyPressable accessibilityLabel="Compose" testID="compose" />,
        );

        await fireEvent(
            renderer.getByTestId("compose"),
            "layout",
            layout(200, 60),
        );

        expect(measureInWindow).toHaveBeenCalled();
    });
});
