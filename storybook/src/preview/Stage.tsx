import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

// expo-blur's BlurView, reduced to what the web needs: a translucent layer with
// a CSS backdrop-filter so the gradient behind the surface bleeds through.
export const PreviewBlur = ({
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

/** The shared photo-backed panel every preview in this Storybook sits on. */
export const Stage = ({ children }: { children: ReactNode }) => {
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

const styles = StyleSheet.create({
    nativeStage: {
        alignItems: "center",
        backgroundColor: "#11100f",
        borderRadius: 24,
        justifyContent: "center",
        minHeight: 300,
        padding: 28,
    },
});
