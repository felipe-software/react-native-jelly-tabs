import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { JellyPressable, type TabBarColors } from "react-native-jelly-tabs";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface GelatinButtonsProps {
    colors: TabBarColors;
    touchFeedbackColor: string;
}

/**
 * `JellyPressable` next to the tab bar — same press glow, scale and stretchy
 * drag, no navigation attached. Drag one sideways: it stretches towards your
 * finger instead of inflating from the middle.
 */
export const GelatinButtons = ({
    colors,
    touchFeedbackColor,
}: GelatinButtonsProps) => {
    const [pressed, setPressed] = useState<string | null>(null);

    const circle = {
        backgroundColor: colors.surface,
        borderColor: colors.inactiveContent,
    };

    return (
        <View style={styles.root}>
            <View style={styles.row}>
                <JellyPressable
                    accessibilityLabel="Send"
                    style={[
                        styles.pill,
                        { backgroundColor: colors.selectedSurface },
                    ]}
                    touchFeedbackColor={touchFeedbackColor}
                    onPress={() => setPressed("Send")}
                >
                    <MaterialIcons
                        color={colors.activeContent}
                        name="send"
                        size={20}
                    />
                    <Text
                        style={[
                            styles.pillLabel,
                            { color: colors.activeContent },
                        ]}
                    >
                        Send
                    </Text>
                </JellyPressable>

                <JellyPressable
                    accessibilityLabel="Favourite"
                    style={[styles.circle, circle]}
                    touchFeedbackColor={touchFeedbackColor}
                    onPress={() => setPressed("Favourite")}
                >
                    <MaterialIcons
                        color={colors.selectedSurface}
                        name="favorite"
                        size={22}
                    />
                </JellyPressable>

                <JellyPressable
                    accessibilityLabel="Share"
                    style={[styles.circle, circle]}
                    touchFeedbackColor={touchFeedbackColor}
                    onPress={() => setPressed("Share")}
                >
                    <MaterialIcons
                        color={colors.inactiveContent}
                        name="ios-share"
                        size={22}
                    />
                </JellyPressable>
            </View>

            <Text style={styles.hint}>
                {pressed
                    ? `JellyPressable onPress → ${pressed}`
                    : "JellyPressable — tap, or drag to stretch"}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        alignItems: "center",
        gap: 8,
    },
    row: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
    },
    pill: {
        alignItems: "center",
        borderRadius: 26,
        flexDirection: "row",
        gap: 10,
        height: 52,
        justifyContent: "center",
        overflow: "hidden",
        paddingHorizontal: 26,
    },
    pillLabel: {
        fontSize: 16,
        fontWeight: "700",
    },
    circle: {
        alignItems: "center",
        borderRadius: 26,
        borderWidth: 1,
        height: 52,
        justifyContent: "center",
        overflow: "hidden",
        width: 52,
    },
    hint: {
        color: "rgba(250,250,249,0.7)",
        fontSize: 12,
    },
});
