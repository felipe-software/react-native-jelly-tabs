import { describe, expect, test } from "bun:test";
import { GELATIN } from "../src/constants";
import {
    applyElasticEasing,
    getGelatinTransform,
    getStretchFactor,
    getStretchOrigin,
    type GelatinDragConfig,
} from "../src/utils/gelatin-animation";

const drag: GelatinDragConfig = GELATIN.drag;
const { distanceForMaxStretch: FULL } = drag;

describe("applyElasticEasing", () => {
    test("leaves a zero drag untouched", () => {
        expect(applyElasticEasing(0, 1 / 3)).toBe(0);
    });

    test("flattens the distance with a power curve", () => {
        expect(applyElasticEasing(8, 1 / 3)).toBeCloseTo(2, 10);
        expect(applyElasticEasing(1_000, 1 / 3)).toBeCloseTo(10, 10);
    });

    test("keeps the drag direction", () => {
        expect(applyElasticEasing(-8, 1 / 3)).toBeCloseTo(-2, 10);
    });

    test("is the identity when the exponent is 1", () => {
        expect(applyElasticEasing(37, 1)).toBeCloseTo(37, 10);
        expect(applyElasticEasing(-37, 1)).toBeCloseTo(-37, 10);
    });

    test("grows ever more slowly as the finger travels", () => {
        const first = applyElasticEasing(50, 1 / 3);
        const second = applyElasticEasing(100, 1 / 3);
        const third = applyElasticEasing(150, 1 / 3);

        expect(second - first).toBeGreaterThan(third - second);
    });
});

describe("getStretchFactor", () => {
    test("does not stretch at rest", () => {
        expect(getStretchFactor(0, drag)).toBe(1);
    });

    test("scales linearly with the eased distance up to the cap", () => {
        // Half of the full-stretch distance -> half of 0.9 * 3.
        expect(getStretchFactor(FULL / 2, drag)).toBeCloseTo(
            1 + 0.9 * 0.5 * 3,
            10,
        );
    });

    test("clamps at the full-stretch distance", () => {
        const capped = 1 + drag.maxStretch * drag.stretchAmplification;

        expect(getStretchFactor(FULL, drag)).toBeCloseTo(capped, 10);
        expect(getStretchFactor(5_000, drag)).toBeCloseTo(capped, 10);
    });

    test("is direction agnostic", () => {
        expect(getStretchFactor(-FULL / 2, drag)).toBe(
            getStretchFactor(FULL / 2, drag),
        );
    });

    test("falls back to no stretch when the distance is not positive", () => {
        expect(
            getStretchFactor(FULL / 2, { ...drag, distanceForMaxStretch: 0 }),
        ).toBe(1);
    });
});

describe("getStretchOrigin", () => {
    test("scales about the centre at rest", () => {
        expect(getStretchOrigin(0, drag)).toBe(0.5);
    });

    test("pins the trailing edge so the stretch travels to the finger", () => {
        // Dragging right anchors the left edge, and the other way around.
        expect(getStretchOrigin(FULL, drag)).toBe(0);
        expect(getStretchOrigin(-FULL, drag)).toBe(1);
    });

    test("slides the origin proportionally before the cap", () => {
        expect(getStretchOrigin(FULL / 2, drag)).toBeCloseTo(0.25, 10);
        expect(getStretchOrigin(-FULL / 2, drag)).toBeCloseTo(0.75, 10);
    });

    test("clamps past the full-stretch distance", () => {
        expect(getStretchOrigin(FULL * 20, drag)).toBe(0);
        expect(getStretchOrigin(-FULL * 20, drag)).toBe(1);
    });

    test("stays centred when the anchor is disabled", () => {
        const centred = { ...drag, stretchAnchor: 0 };

        expect(getStretchOrigin(FULL, centred)).toBe(0.5);
        expect(getStretchOrigin(-FULL, centred)).toBe(0.5);
    });

    test("honours a partial anchor", () => {
        expect(getStretchOrigin(FULL, { ...drag, stretchAnchor: 0.5 })).toBe(
            0.25,
        );
    });

    test("falls back to the centre when the distance is not positive", () => {
        expect(
            getStretchOrigin(FULL, { ...drag, distanceForMaxStretch: 0 }),
        ).toBe(0.5);
    });
});

describe("getGelatinTransform", () => {
    test("stays neutral without a drag", () => {
        expect(getGelatinTransform(0, 0, drag)).toEqual({
            offsetX: 0,
            offsetY: 0,
            originX: 0.5,
            originY: 0.5,
            scaleX: 1,
            scaleY: 1,
        });
    });

    test("deforms each axis from its own translation", () => {
        const transform = getGelatinTransform(1_000, 0, drag);

        expect(transform.offsetX).toBeCloseTo(10 * drag.follow, 10);
        expect(transform.offsetY).toBe(0);
        expect(transform.scaleX).toBeGreaterThan(1);
        expect(transform.scaleY).toBe(1);
        // Dragging right pins the left edge; the untouched axis stays centred.
        expect(transform.originX).toBe(0);
        expect(transform.originY).toBe(0.5);
    });

    test("anchors the origin on the edge opposite each drag direction", () => {
        const transform = getGelatinTransform(-1_000, 1_000, drag);

        expect(transform.originX).toBe(1);
        expect(transform.originY).toBe(0);
    });

    test("scales the offset with follow but leaves the stretch alone", () => {
        const base = getGelatinTransform(1_000, 1_000, drag);
        const doubled = getGelatinTransform(1_000, 1_000, {
            ...drag,
            follow: drag.follow * 2,
        });

        expect(doubled.offsetX).toBeCloseTo(base.offsetX * 2, 10);
        expect(doubled.offsetY).toBeCloseTo(base.offsetY * 2, 10);
        expect(doubled.scaleX).toBeCloseTo(base.scaleX, 10);
        expect(doubled.scaleY).toBeCloseTo(base.scaleY, 10);
    });

    test("moves opposite to a negative drag", () => {
        const transform = getGelatinTransform(-1_000, -1_000, drag);

        expect(transform.offsetX).toBeCloseTo(-10 * drag.follow, 10);
        expect(transform.offsetY).toBeCloseTo(-10 * drag.follow, 10);
        expect(transform.scaleX).toBeGreaterThan(1);
        expect(transform.scaleY).toBeGreaterThan(1);
    });
});
