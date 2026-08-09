import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    JellyPressable,
    type DeepPartial,
    type GelatinConfig,
} from "react-native-jelly-tabs";
import { CameraIcon, HeartIcon, SearchIcon, SendIcon, SettingsIcon } from "./icons";
import { PreviewBlur, Stage } from "./Stage";

const AMBER = "#F59E0B";
const INK = "#451A03";

export interface GelatinPreviewProps {
    config?: DeepPartial<GelatinConfig>;
    /** Frosts the surfaces so the stage photo bleeds through them. */
    showBlur?: boolean;
    /** Renders a single wide button instead of the full sampler. */
    single?: boolean;
    touchFeedbackColor?: string;
    touchFeedbackEnabled?: boolean;
    touchFeedbackOpacity?: number;
    touchFeedbackScale?: number;
}

/**
 * A sampler of `JellyPressable` surfaces on the same stage the tab bar
 * previews use. Press and hold any of them, then drag to stretch.
 */
export const GelatinPreview = ({
    config,
    showBlur = true,
    single = false,
    touchFeedbackColor = "#FFFFFF",
    touchFeedbackEnabled = true,
    touchFeedbackOpacity,
    touchFeedbackScale,
}: GelatinPreviewProps) => {
    const [pressed, setPressed] = useState<string | null>(null);

    const shared = {
        config,
        touchFeedbackColor,
        touchFeedbackEnabled,
        touchFeedbackOpacity,
        touchFeedbackScale,
    };

    return (
        <GestureHandlerRootView style={styles.root}>
            <Stage>
                <View style={styles.column}>
                    <JellyPressable
                        {...shared}
                        accessibilityLabel="Primary action"
                        style={[styles.primary, single && styles.wide]}
                        onPress={() => setPressed("Primary")}
                    >
                        {showBlur && <PreviewBlur intensity={20} tint="light" />}
                        <SendIcon
                            color={INK}
                            colors={ICON_COLORS}
                            opacity={1}
                            size={20}
                        />
                        <Text style={styles.primaryLabel}>Press and drag</Text>
                    </JellyPressable>

                    {!single && (
                        <View style={styles.row}>
                            <JellyPressable
                                {...shared}
                                accessibilityLabel="Search"
                                style={styles.ghost}
                                onPress={() => setPressed("Search")}
                            >
                                {showBlur && (
                                    <PreviewBlur intensity={35} tint="dark" />
                                )}
                                <SearchIcon
                                    color="#FAFAF9"
                                    colors={ICON_COLORS}
                                    opacity={1}
                                    size={18}
                                />
                                <Text style={styles.ghostLabel}>Search</Text>
                            </JellyPressable>

                            <JellyPressable
                                {...shared}
                                accessibilityLabel="Favourite"
                                style={styles.circle}
                                onPress={() => setPressed("Favourite")}
                            >
                                {showBlur && (
                                    <PreviewBlur intensity={35} tint="dark" />
                                )}
                                <HeartIcon
                                    color={AMBER}
                                    colors={ICON_COLORS}
                                    opacity={1}
                                    size={22}
                                />
                            </JellyPressable>

                            <JellyPressable
                                {...shared}
                                accessibilityLabel="Camera"
                                style={styles.circle}
                                onPress={() => setPressed("Camera")}
                            >
                                {showBlur && (
                                    <PreviewBlur intensity={35} tint="dark" />
                                )}
                                <CameraIcon
                                    color="#FAFAF9"
                                    colors={ICON_COLORS}
                                    opacity={1}
                                    size={22}
                                />
                            </JellyPressable>

                            <JellyPressable
                                {...shared}
                                accessibilityLabel="Settings, disabled"
                                disabled
                                style={[styles.circle, styles.disabled]}
                            >
                                <SettingsIcon
                                    color="#78716C"
                                    colors={ICON_COLORS}
                                    opacity={1}
                                    size={22}
                                />
                            </JellyPressable>
                        </View>
                    )}

                    <Text style={styles.log}>
                        {pressed
                            ? `onPress → ${pressed}`
                            : "Tap to fire onPress, drag past 8px to cancel it"}
                    </Text>
                </View>
            </Stage>
        </GestureHandlerRootView>
    );
};

// The icons take the tab bar's color record; the pressable has no palette of
// its own, so the preview supplies a matching one.
const ICON_COLORS = {
    activeContent: INK,
    inactiveContent: "#A8A29E",
    selectedSurface: AMBER,
    surface: "#1C1917",
} as const;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        width: "100%",
    },
    column: {
        alignItems: "center",
        gap: 16,
    },
    row: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
    },
    primary: {
        alignItems: "center",
        backgroundColor: AMBER,
        borderRadius: 28,
        flexDirection: "row",
        gap: 10,
        height: 56,
        justifyContent: "center",
        overflow: "hidden",
        paddingHorizontal: 28,
    },
    wide: {
        paddingHorizontal: 64,
    },
    primaryLabel: {
        color: INK,
        fontSize: 16,
        fontWeight: "700",
    },
    ghost: {
        alignItems: "center",
        backgroundColor: "rgba(28,25,23,0.55)",
        borderColor: "rgba(250,250,249,0.16)",
        borderRadius: 24,
        borderWidth: 1,
        flexDirection: "row",
        gap: 8,
        height: 48,
        justifyContent: "center",
        overflow: "hidden",
        paddingHorizontal: 18,
    },
    ghostLabel: {
        color: "#FAFAF9",
        fontSize: 14,
        fontWeight: "600",
    },
    circle: {
        alignItems: "center",
        backgroundColor: "rgba(28,25,23,0.55)",
        borderColor: "rgba(250,250,249,0.16)",
        borderRadius: 24,
        borderWidth: 1,
        height: 48,
        justifyContent: "center",
        overflow: "hidden",
        width: 48,
    },
    disabled: {
        opacity: 0.45,
    },
    log: {
        color: "rgba(250,250,249,0.7)",
        fontSize: 12,
        marginTop: 4,
    },
});
