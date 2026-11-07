import { TabBadge } from "./tab-badge";
import {
    resolveLabelTypography,
    TABBAR_LAYOUT,
    type TabBarColors,
} from "../constants";
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
    // `resolveLabel` returns "" for `tabBarShowLabel: false`, so an absent
    // label reaches this component as an empty string rather than undefined.
    const hasLabel = text !== "";
    const typography = resolveLabelTypography();
    const labelWeight = isActive
        ? typography.activeWeight
        : typography.inactiveWeight;

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
                            transform: [
                                { translateY: hasLabel ? 2 * displayScale : 0 },
                            ],
                        },
                    ]}
                >
                    <Icon
                        color={color}
                        colors={colors}
                        focused={isActive}
                        opacity={opacity}
                        size={iconSize ?? TABBAR_LAYOUT.iconSize * displayScale}
                    />
                    {badge !== undefined && (
                        <TabBadge
                            activeBadgeStyle={activeBadgeStyle}
                            badge={badge}
                            badgeStyle={badgeStyle}
                            displayScale={displayScale}
                            isActive={isActive}
                        />
                    )}
                </View>
                {hasLabel && (
                    <Text
                        ellipsizeMode="tail"
                        numberOfLines={1}
                        selectable={false}
                        style={[
                            styles.label,
                            {
                                color,
                                fontSize: typography.fontSize * displayScale,
                                fontWeight: String(
                                    labelWeight,
                                ) as TextStyle["fontWeight"],
                                paddingHorizontal: 4 * displayScale,
                            },
                            labelStyle,
                        ]}
                    >
                        {text}
                    </Text>
                )}
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
    label: {
        alignSelf: "stretch",
        flexShrink: 1,
        textAlign: "center",
    },
});
