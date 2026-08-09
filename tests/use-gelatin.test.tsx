import { act, cleanup, renderHook } from "@testing-library/react-native";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { GELATIN, resolveGelatinConfig } from "../src/constants";

let useGelatin: typeof import("../src/hooks/use-gelatin").useGelatin;

const GLOW_RADIUS = 50;
const WIDTH = 200;
const HEIGHT = 60;

// The mocked `useAnimatedStyle` hands back the plain object its updater
// returned, so assertions read it as one instead of as Reanimated's handle.
const styleOf = (style: unknown) => style as Record<string, unknown>;

const transformOf = (style: unknown) =>
    (style as { transform: Record<string, number>[] }).transform;

/**
 * Undoes the paired-translation pivot the style is built from, so assertions
 * read the four quantities that actually matter.
 */
const readGelatin = (style: unknown) => {
    const transform = transformOf(style);
    const pivotX = -(transform[4]?.translateX ?? 0);
    const pivotY = -(transform[5]?.translateY ?? 0);

    return {
        offsetX: (transform[0]?.translateX ?? 0) - pivotX,
        offsetY: (transform[1]?.translateY ?? 0) - pivotY,
        pivotX,
        pivotY,
        scaleX: transform[2]?.scaleX ?? 1,
        scaleY: transform[3]?.scaleY ?? 1,
    };
};

/**
 * `withSpring` is mocked to land on its target immediately, so every assertion
 * below reads the value the animation is heading for.
 */
const mountGelatin = async () => {
    const rendered = await renderHook(() =>
        useGelatin(resolveGelatinConfig(), GLOW_RADIUS),
    );

    await act(() => {
        rendered.result.current.setSize(WIDTH, HEIGHT);
    });
    await rendered.rerender(undefined);

    return rendered;
};

beforeAll(async () => {
    ({ useGelatin } = await import("../src/hooks/use-gelatin"));
});

afterEach(async () => {
    await cleanup();
});

describe("useGelatin", () => {
    test("rests undeformed with the glow hidden and centered", async () => {
        const { result } = await mountGelatin();

        expect(readGelatin(result.current.gelatinStyle)).toEqual({
            offsetX: 0,
            offsetY: 0,
            pivotX: 0,
            pivotY: 0,
            scaleX: 1,
            scaleY: 1,
        });
        expect(styleOf(result.current.touchFeedbackStyle)).toEqual({
            opacity: 0,
            transform: [
                { translateX: WIDTH / 2 - GLOW_RADIUS },
                { translateY: HEIGHT / 2 - GLOW_RADIUS },
            ],
        });
    });

    test("inflates and lights the glow where the finger landed", async () => {
        const { result, rerender } = await mountGelatin();

        await act(() => result.current.begin(30, 12));
        await rerender(undefined);

        // A press with no drag still inflates about the centre.
        expect(readGelatin(result.current.gelatinStyle)).toEqual({
            offsetX: 0,
            offsetY: 0,
            pivotX: 0,
            pivotY: 0,
            scaleX: GELATIN.pressedScale,
            scaleY: GELATIN.pressedScale,
        });
        expect(styleOf(result.current.touchFeedbackStyle)).toEqual({
            opacity: 1,
            transform: [
                { translateX: 30 - GLOW_RADIUS },
                { translateY: 12 - GLOW_RADIUS },
            ],
        });
    });

    test("keeps the glow inside the view when the touch starts outside it", async () => {
        const { result, rerender } = await mountGelatin();

        await act(() => result.current.begin(-40, 500));
        await rerender(undefined);

        expect(styleOf(result.current.touchFeedbackStyle)).toEqual({
            opacity: 1,
            transform: [
                { translateX: 0 - GLOW_RADIUS },
                { translateY: HEIGHT - GLOW_RADIUS },
            ],
        });
    });

    test("stretches along the dragged axis and follows the finger", async () => {
        const { result, rerender } = await mountGelatin();

        await act(() => result.current.begin(30, 30));
        // 1000px of raw drag eases down to 10px of travel.
        await act(() => result.current.update(1_000, 0, 260, 30));
        await rerender(undefined);

        const { drag } = GELATIN;
        const expectedStretch =
            1 +
            drag.maxStretch *
                (10 / drag.distanceForMaxStretch) *
                drag.stretchAmplification;
        const gelatin = readGelatin(result.current.gelatinStyle);

        expect(gelatin.offsetX).toBeCloseTo(10 * drag.follow, 10);
        expect(gelatin.offsetY).toBe(0);
        expect(gelatin.scaleX).toBeCloseTo(
            expectedStretch * GELATIN.pressedScale,
            10,
        );
        expect(gelatin.scaleY).toBeCloseTo(GELATIN.pressedScale, 10);
        // Dragging right pins the left edge, half a width left of centre.
        expect(gelatin.pivotX).toBeCloseTo(-WIDTH / 2, 10);
        expect(gelatin.pivotY).toBe(0);
        // The finger left the view on the right, so the glow parks at the edge.
        expect(styleOf(result.current.touchFeedbackStyle)).toEqual({
            opacity: 1,
            transform: [
                { translateX: WIDTH - GLOW_RADIUS },
                { translateY: 30 - GLOW_RADIUS },
            ],
        });
    });

    test("stretches towards the finger on a leftward drag", async () => {
        const { result, rerender } = await mountGelatin();

        await act(() => result.current.begin(120, 30));
        await act(() => result.current.update(-1_000, 0, -160, 30));
        await rerender(undefined);

        const gelatin = readGelatin(result.current.gelatinStyle);

        // Pulling left pins the right edge, so the surface grows leftwards
        // rather than spreading out from the middle.
        expect(gelatin.pivotX).toBeCloseTo(WIDTH / 2, 10);
        expect(gelatin.offsetX).toBeLessThan(0);
        expect(gelatin.scaleX).toBeGreaterThan(1);
    });

    test("bounces everything back and fades the glow out on release", async () => {
        const { result, rerender } = await mountGelatin();

        await act(() => result.current.begin(30, 30));
        await act(() => result.current.update(1_000, -1_000, 260, 0));
        await act(() => result.current.end());
        await rerender(undefined);

        expect(readGelatin(result.current.gelatinStyle)).toEqual({
            offsetX: 0,
            offsetY: 0,
            pivotX: 0,
            pivotY: 0,
            scaleX: 1,
            scaleY: 1,
        });
        expect(styleOf(result.current.touchFeedbackStyle)).toMatchObject({
            opacity: 0,
        });
    });

    test("does not yank the glow away from the finger on a mid-press layout", async () => {
        const { result, rerender } = await mountGelatin();

        await act(() => result.current.begin(30, 12));
        await act(() => result.current.setSize(400, 100));
        await rerender(undefined);

        expect(styleOf(result.current.touchFeedbackStyle)).toEqual({
            opacity: 1,
            transform: [
                { translateX: 30 - GLOW_RADIUS },
                { translateY: 12 - GLOW_RADIUS },
            ],
        });
    });
});
