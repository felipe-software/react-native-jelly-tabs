import { TabBadge } from "./tab-badge";
import type { TabBarColors } from "../constants";
import type { TabsIcon } from "../types";
import { isNativeIcon } from "../utils/native-tab-bar";
import { type StyleProp, StyleSheet, type TextStyle, View } from "react-native";

export interface NativeTabSlotProps {
    activeBadgeStyle?: StyleProp<TextStyle>;
    badge?: number | string;
    badgeStyle?: StyleProp<TextStyle>;
    color: string;
    colors: Readonly<TabBarColors>;
    displayScale: number;
    focused: boolean;
    icon: TabsIcon;
    iconSize: number;
    opacity: number;
}

export const NativeTabSlot = ({
    activeBadgeStyle,
    badge,
    badgeStyle,
    color,
    colors,
    displayScale,
    focused,
    icon: Icon,
    iconSize,
    opacity,
}: NativeTabSlotProps) => {
    const isBaked = isNativeIcon(Icon, focused ? "active" : "inactive");

    return (
        <View
            collapsable={false}
            pointerEvents="none"
            style={[
                styles.slot,
                isBaked && { height: iconSize, width: iconSize },
                { opacity },
            ]}
        >
            {!isBaked && (
                <Icon
                    color={color}
                    colors={colors}
                    focused={focused}
                    opacity={opacity}
                    size={iconSize}
                />
            )}
            {badge !== undefined && (
                <TabBadge
                    activeBadgeStyle={activeBadgeStyle}
                    badge={badge}
                    badgeStyle={badgeStyle}
                    displayScale={displayScale}
                    isActive={focused}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    slot: {
        left: 0,
        position: "absolute",
        top: 0,
    },
});
