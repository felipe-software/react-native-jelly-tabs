import type {
    DeepPartial,
    TabBarColors,
    TabBarConfig,
    TabBarOpacity,
} from "./constants";
import type { ComponentType, ReactNode } from "react";
import type {
    DimensionValue,
    StyleProp,
    TextStyle,
    ViewStyle,
} from "react-native";

export interface TabsIconProps {
    color: string;
    colors: Readonly<TabBarColors>;
    opacity: number;
    size: number;
}

export type TabsIcon = ComponentType<TabsIconProps>;

export interface TabsItem {
    accessibilityLabel?: string;
    key: string;
    label: string;
    labelStyle?: StyleProp<TextStyle>;
    activeIcon: TabsIcon;
    inactiveIcon: TabsIcon;
    badge?: number | string;
    badgeStyle?: StyleProp<TextStyle>;
    /**
     * Layered over `badgeStyle` for the tab copy revealed through the pill
     * mask, so a badge can read differently once the pill covers it.
     */
    activeBadgeStyle?: StyleProp<TextStyle>;
    testID?: string;
}

export interface TabsChangeEvent {
    index: number;
    item: TabsItem;
}

export interface JellyTabBarHeadlessProps {
    backdrop?: ReactNode;
    colors?: Partial<TabBarColors>;
    config?: DeepPartial<TabBarConfig>;
    displayScale?: number;
    maxWidth?: DimensionValue;
    recording?: boolean;
    items: readonly TabsItem[];
    onTabChange?: (event: TabsChangeEvent) => void;
    onTabLongPress?: (event: TabsChangeEvent) => void;
    onTabPress?: (event: TabsChangeEvent) => boolean | void;
    opacity?: Partial<TabBarOpacity>;
    selectedIndex?: number | null;
    selectedBackdrop?: ReactNode;
    touchFeedbackEnabled?: boolean;
    touchFeedbackColor?: string;
    touchFeedbackOpacity?: number;
    touchFeedbackScale?: number;
}

/** @deprecated Use JellyTabBarHeadlessProps instead. */
export type TabsProps = JellyTabBarHeadlessProps;

export interface JellyNavigationRoute {
    key: string;
    name: string;
    params?: object;
    path?: string;
}

export interface JellyNavigationState {
    index: number;
    key: string;
    routes: readonly JellyNavigationRoute[];
}

export interface JellyNavigationOptions {
    href?: unknown;
    tabBarAccessibilityLabel?: string;
    tabBarActiveBackgroundColor?: unknown;
    tabBarActiveBadgeStyle?: StyleProp<TextStyle>;
    tabBarActiveTintColor?: unknown;
    tabBarBackground?: () => ReactNode;
    tabBarBadge?: number | string;
    tabBarBadgeStyle?: StyleProp<TextStyle>;
    tabBarButtonTestID?: string;
    tabBarIcon?: (props: {
        color: string;
        focused: boolean;
        size: number;
    }) => ReactNode;
    tabBarInactiveBackgroundColor?: unknown;
    tabBarInactiveTintColor?: unknown;
    tabBarItemStyle?: StyleProp<ViewStyle>;
    tabBarLabel?: unknown;
    tabBarLabelStyle?: StyleProp<TextStyle>;
    tabBarShowLabel?: boolean;
    tabBarStyle?: unknown;
    title?: string;
}

export interface JellyNavigationDescriptor {
    options: JellyNavigationOptions;
}

export interface JellyNavigationEvent {
    canPreventDefault?: boolean;
    target: string;
    type: "tabPress" | "tabLongPress";
}

export interface JellyNavigationHelpers {
    dispatch(action: {
        payload: {
            name: string;
            params?: object;
            path?: string;
        };
        target: string;
        type: "NAVIGATE";
    }): void;
    emit(event: JellyNavigationEvent): unknown;
}

export interface JellyTabBarProps extends Omit<
    JellyTabBarHeadlessProps,
    "items" | "onTabChange" | "onTabLongPress" | "onTabPress" | "selectedIndex"
> {
    containerStyle?: StyleProp<ViewStyle>;
    descriptors: Readonly<Record<string, JellyNavigationDescriptor>>;
    floating?: boolean;
    insets: {
        bottom: number;
        left: number;
        right: number;
        top: number;
    };
    navigation: JellyNavigationHelpers;
    state: JellyNavigationState;
}
