import { describe, expect, test } from "bun:test";
import {
    DEFAULT_GELATIN_CONFIG,
    GELATIN,
    resolveGelatinConfig,
} from "../src/constants";

describe("gelatin defaults", () => {
    test("keeps the documented defaults", () => {
        expect(GELATIN).toEqual({
            pressedScale: 1.1,
            drag: {
                distanceForMaxStretch: 32,
                easingExponent: 1 / 3,
                follow: 2,
                maxStretch: 0.9,
                stretchAnchor: 1,
                stretchAmplification: 3,
            },
            springs: {
                drag: { dampingRatio: 1, duration: 390 },
                press: { dampingRatio: 0.5, duration: 300 },
                release: { dampingRatio: 0.5, duration: 500 },
            },
            touchFeedback: {
                middleOpacityRatio: 0.43,
                opacity: 0.35,
                radius: 90,
                scale: 1,
            },
        });
    });

    test("exposes the same object as the resolved default", () => {
        expect(DEFAULT_GELATIN_CONFIG).toBe(GELATIN);
        expect(resolveGelatinConfig()).toEqual(GELATIN);
    });
});

describe("resolveGelatinConfig", () => {
    test("returns a fresh, mutable object", () => {
        const resolved = resolveGelatinConfig();

        expect(resolved).not.toBe(GELATIN);
        expect(resolved.drag).not.toBe(GELATIN.drag);
        expect(resolved.springs.drag).not.toBe(GELATIN.springs.drag);
        expect(resolved.touchFeedback).not.toBe(GELATIN.touchFeedback);
    });

    test("merges a partial drag group without dropping siblings", () => {
        const resolved = resolveGelatinConfig({ drag: { follow: 0.4 } });

        expect(resolved.drag).toEqual({
            ...GELATIN.drag,
            follow: 0.4,
        });
    });

    test("merges each spring channel independently", () => {
        const resolved = resolveGelatinConfig({
            springs: { release: { dampingRatio: 0.2 } },
        });

        expect(resolved.springs.release).toEqual({
            dampingRatio: 0.2,
            duration: GELATIN.springs.release.duration,
        });
        expect(resolved.springs.drag).toEqual(GELATIN.springs.drag);
        expect(resolved.springs.press).toEqual(GELATIN.springs.press);
    });

    test("overrides scalars and the touch feedback group", () => {
        const resolved = resolveGelatinConfig({
            pressedScale: 1.5,
            touchFeedback: { radius: 40 },
        });

        expect(resolved.pressedScale).toBe(1.5);
        expect(resolved.touchFeedback).toEqual({
            ...GELATIN.touchFeedback,
            radius: 40,
        });
    });

    test("keeps a zero override instead of falling back to the default", () => {
        expect(resolveGelatinConfig({ pressedScale: 0 }).pressedScale).toBe(0);
        expect(
            resolveGelatinConfig({ drag: { follow: 0 } }).drag.follow,
        ).toBe(0);
    });
});
