import { ABSOLUTE_FILL } from "./shared";
import type { TabsItem } from "../../types";
import { StyleSheet, View } from "react-native";

const ACTIVATE_ACCESSIBILITY_ACTION = [{ name: "activate" }] as const;
const TAB_ACCESSIBILITY_ACTIONS = [
    { name: "activate" },
    { name: "longpress" },
] as const;

interface AccessibilityTabProps {
    index: number;
    item: TabsItem;
    onActivate: (index: number) => void;
    onLongPress?: (index: number) => void;
    selected: boolean;
}

const AccessibilityTab = ({
    index,
    item,
    onActivate,
    onLongPress,
    selected,
}: AccessibilityTabProps) => (
    <View
        accessibilityActions={
            onLongPress
                ? TAB_ACCESSIBILITY_ACTIONS
                : ACTIVATE_ACCESSIBILITY_ACTION
        }
        accessibilityLabel={item.accessibilityLabel ?? item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessible
        pointerEvents="none"
        style={styles.accessibilityTab}
        testID={item.testID}
        onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "activate") {
                onActivate(index);
            } else if (event.nativeEvent.actionName === "longpress") {
                onLongPress?.(index);
            }
        }}
    />
);

export interface AccessibilityTabsRowProps {
    items: readonly TabsItem[];
    onActivate: (index: number) => void;
    onLongPress?: (index: number) => void;
    selectedIndex: number | null;
    trackInset: number;
}

/** Carries the a11y contract: every visual layer below is hidden from it. */
export const AccessibilityTabsRow = ({
    items,
    onActivate,
    onLongPress,
    selectedIndex,
    trackInset,
}: AccessibilityTabsRowProps) => (
    <View
        pointerEvents="box-none"
        style={[styles.accessibilityTabsRow, { paddingHorizontal: trackInset }]}
    >
        {items.map((item, index) => (
            <AccessibilityTab
                index={index}
                item={item}
                key={`accessible-${item.key}`}
                onActivate={onActivate}
                onLongPress={onLongPress}
                selected={selectedIndex === index}
            />
        ))}
    </View>
);

const styles = StyleSheet.create({
    accessibilityTabsRow: {
        ...ABSOLUTE_FILL,
        flexDirection: "row",
        zIndex: 3,
    },
    accessibilityTab: {
        flex: 1,
    },
});
