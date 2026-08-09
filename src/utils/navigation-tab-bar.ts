import type { JellyNavigationRoute, TabsItem } from "../types";

export const asColorString = (value: unknown) =>
    typeof value === "string" ? value : undefined;

export const areRoutesEqual = (
    a: JellyNavigationRoute,
    b: JellyNavigationRoute,
) => a === b;

export const areItemsEqual = (a: TabsItem, b: TabsItem) =>
    a.key === b.key &&
    a.label === b.label &&
    a.labelStyle === b.labelStyle &&
    a.activeIcon === b.activeIcon &&
    a.inactiveIcon === b.inactiveIcon &&
    a.badge === b.badge &&
    a.badgeStyle === b.badgeStyle &&
    a.activeBadgeStyle === b.activeBadgeStyle &&
    a.accessibilityLabel === b.accessibilityLabel &&
    a.testID === b.testID;
