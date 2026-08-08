import { useMemo, type ReactNode } from "react";
import { Platform, StyleSheet, type TextStyle, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    JellyTabBarHeadless,
    type DeepPartial,
    type TabBarColors,
    type TabBarConfig,
    type TabBarOpacity,
    type TabsChangeEvent,
    type TabsItem,
} from "react-native-jelly-tabs";
import { CopyPropsPanel } from "./CopyPropsPanel";
import { CameraIcon, HomeIcon, PaintIcon, SettingsIcon } from "./icons";
import type { SnippetItem } from "./props-snippet";

// The "Amber" preset the example ships as its default look.
export const DEFAULT_PREVIEW_COLORS: TabBarColors = {
    activeContent: "#451A03",
    inactiveContent: "#A8A29E",
    selectedSurface: "#F59E0B",
    surface: "#1C1917",
};

export const DEFAULT_PREVIEW_ITEMS: TabsItem[] = [
    { key: "home", label: "Home", activeIcon: HomeIcon, inactiveIcon: HomeIcon },
    {
        key: "camera",
        label: "Camera",
        activeIcon: CameraIcon,
        inactiveIcon: CameraIcon,
    },
    {
        key: "settings",
        label: "Settings",
        activeIcon: SettingsIcon,
        inactiveIcon: SettingsIcon,
    },
    {
        key: "walls",
        label: "Walls",
        activeIcon: PaintIcon,
        inactiveIcon: PaintIcon,
    },
];

/** Sample badges spread across the default items: a count, an overflow and a dot. */
const SAMPLE_BADGES: Record<string, number | string> = {
    home: 3,
    settings: "9+",
    walls: "•",
};

// expo-blur's BlurView, reduced to what the web needs: a translucent layer with
// a CSS backdrop-filter so the gradient behind the bar bleeds through.
const PreviewBlur = ({
    intensity,
    tint = "dark",
}: {
    intensity: number;
    tint?: "dark" | "light";
}) => {
    const radius = Math.round(intensity * 0.4);
    if (Platform.OS === "web") {
        const backgroundColor =
            tint === "dark" ? "rgba(20,18,16,0.35)" : "rgba(250,250,249,0.12)";
        return (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor,
                    backdropFilter: `blur(${radius}px)`,
                    WebkitBackdropFilter: `blur(${radius}px)`,
                }}
            />
        );
    }
    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                {
                    backgroundColor:
                        tint === "dark"
                            ? "rgba(20,18,16,0.5)"
                            : "rgba(250,250,249,0.16)",
                },
            ]}
        />
    );
};

// Keep the preview self-contained so the background also works in the static
// Storybook build embedded by Docusaurus.
const previewBackground = new URL(
    "../../../example/assets/images/color-lab-background.png",
    import.meta.url,
).href;

const Stage = ({ children }: { children: ReactNode }) => {
    if (Platform.OS === "web") {
        return (
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "100%",
                    padding: 28,
                    boxSizing: "border-box",
                    borderRadius: 24,
                    overflow: "hidden",
                    backgroundColor: "#11100f",
                    backgroundImage: `linear-gradient(rgba(10,9,8,0.25), rgba(10,9,8,0.45)), url(${previewBackground})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {children}
            </div>
        );
    }
    return <View style={styles.nativeStage}>{children}</View>;
};

export interface JellyPreviewProps {
    colors?: Partial<TabBarColors>;
    config?: DeepPartial<TabBarConfig>;
    opacity?: Partial<TabBarOpacity>;
    items?: TabsItem[];
    /** Adds the sample badges to the default items. */
    showBadges?: boolean;
    /** Badge style applied to every badged item, in the track and the pill. */
    badgeStyle?: TextStyle;
    /** Layered over `badgeStyle` for the copy revealed through the pill mask. */
    activeBadgeStyle?: TextStyle;
    showBlur?: boolean;
    blurTrack?: number;
    blurPill?: number;
    maxWidth?: number;
    touchFeedbackColor?: string;
    touchFeedbackEnabled?: boolean;
    touchFeedbackOpacity?: number;
    touchFeedbackScale?: number;
    selectedIndex?: number | null;
    onTabChange?: (event: TabsChangeEvent) => void;
    /** Hide the floating copy-props control (used by thumbnails). */
    showCopyProps?: boolean;
}

export const JellyPreview = ({
    colors,
    config,
    opacity,
    items = DEFAULT_PREVIEW_ITEMS,
    showBadges = false,
    badgeStyle,
    activeBadgeStyle,
    showBlur = true,
    blurTrack = 35,
    blurPill = 20,
    maxWidth = 400,
    touchFeedbackColor,
    touchFeedbackEnabled = true,
    touchFeedbackOpacity,
    touchFeedbackScale,
    selectedIndex,
    onTabChange,
    showCopyProps = true,
}: JellyPreviewProps) => {
    const resolvedColors = { ...DEFAULT_PREVIEW_COLORS, ...colors };

    const resolvedItems = useMemo(
        () =>
            items.map((item) => {
                const badge = showBadges
                    ? (item.badge ?? SAMPLE_BADGES[item.key])
                    : item.badge;

                if (badge === undefined) {
                    return item;
                }

                return {
                    ...item,
                    badge,
                    badgeStyle: badgeStyle ?? item.badgeStyle,
                    activeBadgeStyle: activeBadgeStyle ?? item.activeBadgeStyle,
                };
            }),
        [items, showBadges, badgeStyle, activeBadgeStyle],
    );

    const badgedItem = resolvedItems.find((item) => item.badge !== undefined);
    const snippetItem: SnippetItem | undefined = badgedItem
        ? {
              key: badgedItem.key,
              label: badgedItem.label,
              badge: badgedItem.badge,
              badgeStyle: badgeStyle,
              activeBadgeStyle: activeBadgeStyle,
          }
        : undefined;

    return (
        <GestureHandlerRootView style={styles.root}>
            <Stage>
                {Platform.OS === "web" && showCopyProps && (
                    <CopyPropsPanel
                        input={{
                            colors: resolvedColors,
                            config,
                            opacity,
                            maxWidth,
                            touchFeedbackEnabled,
                            touchFeedbackColor,
                            touchFeedbackOpacity,
                            touchFeedbackScale,
                            blur: showBlur
                                ? { track: blurTrack, pill: blurPill }
                                : null,
                            item: snippetItem,
                        }}
                    />
                )}
                <View style={[styles.barSlot, { maxWidth }]}>
                    <JellyTabBarHeadless
                        backdrop={
                            showBlur ? (
                                <PreviewBlur intensity={blurTrack} tint="dark" />
                            ) : undefined
                        }
                        colors={resolvedColors}
                        config={config}
                        items={resolvedItems}
                        opacity={opacity}
                        selectedIndex={selectedIndex ?? undefined}
                        selectedBackdrop={
                            showBlur ? (
                                <PreviewBlur
                                    intensity={blurPill}
                                    tint="light"
                                />
                            ) : undefined
                        }
                        touchFeedbackColor={
                            touchFeedbackColor ?? resolvedColors.selectedSurface
                        }
                        touchFeedbackEnabled={touchFeedbackEnabled}
                        touchFeedbackOpacity={touchFeedbackOpacity}
                        touchFeedbackScale={touchFeedbackScale}
                        onTabChange={onTabChange}
                    />
                </View>
            </Stage>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        width: "100%",
    },
    nativeStage: {
        alignItems: "center",
        backgroundColor: "#11100f",
        borderRadius: 24,
        justifyContent: "center",
        minHeight: 300,
        padding: 28,
    },
    barSlot: {
        alignSelf: "center",
        width: "100%",
    },
});
