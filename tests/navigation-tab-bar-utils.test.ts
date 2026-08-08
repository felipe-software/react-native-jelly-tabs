import { describe, expect, test } from "bun:test";
import {
    areItemsEqual,
    areRoutesEqual,
    asColorString,
} from "../src/utils/navigation-tab-bar";
import type { TabsItem } from "../src/types";

const ActiveIcon: TabsItem["activeIcon"] = () => null;
const InactiveIcon: TabsItem["inactiveIcon"] = () => null;
const labelStyle = { color: "red" } as const;
const badgeStyle = { color: "white" } as const;

const baseItem: TabsItem = {
    accessibilityLabel: "Open home",
    activeBadgeStyle: { color: "black" },
    activeIcon: ActiveIcon,
    badge: 3,
    badgeStyle,
    inactiveIcon: InactiveIcon,
    key: "home-key",
    label: "Home",
    labelStyle,
    testID: "home-tab",
};

describe("asColorString", () => {
    test("returns string values without changing them", () => {
        expect(asColorString("#ff0000")).toBe("#ff0000");
        expect(asColorString("")).toBe("");
    });

    test("returns undefined for non-string values", () => {
        expect(asColorString(undefined)).toBeUndefined();
        expect(asColorString(null)).toBeUndefined();
        expect(asColorString(42)).toBeUndefined();
        expect(asColorString({ color: "red" })).toBeUndefined();
    });
});

describe("areRoutesEqual", () => {
    test("compares routes by reference", () => {
        const route = { key: "home-key", name: "home" };

        expect(areRoutesEqual(route, route)).toBe(true);
        expect(areRoutesEqual(route, { ...route })).toBe(false);
    });
});

describe("areItemsEqual", () => {
    test("accepts different objects with the same relevant values", () => {
        expect(areItemsEqual(baseItem, { ...baseItem })).toBe(true);
    });

    const differentValues: Array<[keyof TabsItem, TabsItem[keyof TabsItem]]> = [
        ["key", "search-key"],
        ["label", "Search"],
        ["labelStyle", { color: "blue" }],
        ["activeIcon", () => null],
        ["inactiveIcon", () => null],
        ["badge", 4],
        ["badgeStyle", { color: "black" }],
        ["activeBadgeStyle", { color: "white" }],
        ["accessibilityLabel", "Open search"],
        ["testID", "search-tab"],
    ];

    test.each(differentValues)(
        "detects a changed %s",
        (property, differentValue) => {
            const differentItem = {
                ...baseItem,
                [property]: differentValue,
            } as TabsItem;

            expect(areItemsEqual(baseItem, differentItem)).toBe(false);
        },
    );
});
