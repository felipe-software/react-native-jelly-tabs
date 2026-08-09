import { TABBAR_LAYOUT, type TabBarColors } from "../constants";
import type { TabsIcon } from "../types";
import {
    type StyleProp,
    StyleSheet,
    Text,
    type TextStyle,
    View,
    type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

export interface TabItemProps {
    activeBadgeStyle?: StyleProp<TextStyle>;
    activeColor?: string;
    activeOpacity?: number;
    badge?: number | string;
    badgeStyle?: StyleProp<TextStyle>;
    displayScale?: number;
    colors: Readonly<TabBarColors>;
    activeIcon: TabsIcon;
    inactiveIcon: TabsIcon;
    iconSize?: number;
    inactiveColor?: string;
    inactiveOpacity?: number;
    itemHeight?: number;
    labelStyle?: StyleProp<TextStyle>;
    text: string;
    isActive?: boolean;
    animatedStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
}

export const TabItem = ({
    activeBadgeStyle,
    activeColor = "#000000",
    activeOpacity = 1,
    badge,
    badgeStyle,
    colors,
    displayScale = 1,
    activeIcon,
    inactiveIcon,
    iconSize,
    inactiveColor = "#afafaf",
    inactiveOpacity = 1,
    itemHeight = TABBAR_LAYOUT.itemHeight * displayScale,
    labelStyle,
    text,
    isActive = false,
    animatedStyle,
}: TabItemProps) => {
    const color = isActive ? activeColor : inactiveColor;
    const opacity = isActive ? activeOpacity : inactiveOpacity;
    const Icon = isActive ? activeIcon : inactiveIcon;

    return (
        <Animated.View
            style={[
                styles.item,
                {
                    height: itemHeight,
                },
                animatedStyle,
            ]}
        >
            <View style={[styles.content, { opacity }]}>
                <View
                    style={[
                        styles.icon,
                        {
                            transform: [{ translateY: 2 * displayScale }],
                        },
                    ]}
                >
                    <Icon
                        color={color}
                        colors={colors}
                        opacity={opacity}
                        size={iconSize ?? TABBAR_LAYOUT.iconSize * displayScale}
                    />
                    {badge !== undefined && (
                        <Text
                            numberOfLines={1}
                            selectable={false}
                            style={[
                                styles.badge,
                                {
                                    borderRadius: 8 * displayScale,
                                    fontSize: 10 * displayScale,
                                    height: 16 * displayScale,
                                    lineHeight: 16 * displayScale,
                                    minWidth: 16 * displayScale,
                                    paddingHorizontal: 4 * displayScale,
                                    right: -10 * displayScale,
                                    top: -5 * displayScale,
                                },
                                badgeStyle,
                                isActive && activeBadgeStyle,
                            ]}
                        >
                            {badge}
                        </Text>
                    )}
                </View>
                <Text
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    selectable={false}
                    style={[
                        styles.label,
                        {
                            color,
                            fontSize: 13 * displayScale,
                            fontWeight: isActive ? "700" : "400",
                            paddingHorizontal: 4 * displayScale,
                        },
                        labelStyle,
                    ]}
                >
                    {text}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    item: {
        flex: 1,
        zIndex: 1,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        position: "relative",
    },
    badge: {
        backgroundColor: "#FF3B30",
        color: "#FFFFFF",
        fontWeight: "700",
        overflow: "hidden",
        position: "absolute",
        textAlign: "center",
    },
    label: {
        alignSelf: "stretch",
        flexShrink: 1,
        textAlign: "center",
    },
});
