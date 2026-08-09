import type { TabItemProps } from "../tab-item";
import { cloneElement, type ReactElement } from "react";
import {
    type StyleProp,
    StyleSheet,
    type ViewStyle,
} from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";

export type AnimatedViewStyle = StyleProp<AnimatedStyle<ViewStyle>>;

export type TabElements = readonly ReactElement<TabItemProps>[];

/** Layout scalars already multiplied by `displayScale`. */
export interface TabBarGeometry {
    itemHeight: number;
    maskOverscanX: number;
    maskOverscanY: number;
    trackHeight: number;
    trackInset: number;
}

export interface TouchFeedbackVisuals {
    centerOpacity: number;
    color: string;
    diameter: number;
    middleOpacity: number;
    radius: number;
}

export const cloneTabs = (
    tabs: TabElements,
    keyPrefix: string,
    activeStyle?: AnimatedViewStyle,
) =>
    tabs.map((tab, index) =>
        cloneElement(
            tab,
            activeStyle
                ? {
                      animatedStyle: activeStyle,
                      isActive: true,
                      key: `${keyPrefix}-${index}`,
                  }
                : { key: `${keyPrefix}-${index}` },
        ),
    );

// Spread this, never `StyleSheet.absoluteFill`: react-native-web compiles the
// latter into an opaque object, so spreading it yields an empty rule.
export const ABSOLUTE_FILL = {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
} as const satisfies ViewStyle;

export const sharedStyles = StyleSheet.create({
    clip: {
        ...ABSOLUTE_FILL,
        overflow: "hidden",
    },
});
