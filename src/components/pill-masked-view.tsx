import NativeMaskedView from "@react-native-masked-view/masked-view";
import type { PropsWithChildren } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { isWeb, usesClipBox } from "../platform";

export interface PillMaskedViewProps extends PropsWithChildren {
    animatedStyle: StyleProp<AnimatedStyle<ViewStyle>>;
    clipStyle: StyleProp<AnimatedStyle<ViewStyle>>;
    contentHeight: number;
    contentStyle: StyleProp<AnimatedStyle<ViewStyle>>;
    contentWidth: number;
    height: number;
    left: number;
    tabWidth: number;
    top: number;
}

// `width` is a plain style rather than part of `animatedStyle`: it only changes
// when the track is re-measured, and a layout prop inside an animated style
// costs a shadow-tree commit per frame on Fabric.
const PillMaskElement = ({
    animatedStyle,
    height,
    left,
    tabWidth,
    top,
}: Pick<
    PillMaskedViewProps,
    "animatedStyle" | "height" | "left" | "tabWidth" | "top"
>) => (
    <Animated.View
        style={[
            styles.mask,
            { height, left, top, width: tabWidth },
            animatedStyle,
        ]}
    />
);

export const PillMaskedView = ({
    animatedStyle,
    children,
    clipStyle,
    contentHeight,
    contentStyle,
    contentWidth,
    height,
    left,
    tabWidth,
    top,
}: PillMaskedViewProps) => {
    if (usesClipBox()) {
        // The clip box is a statically sized rounded rect moved and scaled
        // only by clipStyle's transform; contentStyle applies the inverse
        // transform so the children stay fixed to the track. Safari drops the
        // rounding of an animated clip-path on stray frames, so the rounded
        // clip must come from border-radius, which is stable.
        return (
            <Animated.View
                style={[
                    styles.clipBox,
                    isWeb() && WEB_CLIP_LAYER,
                    {
                        borderRadius: height / 2,
                        height,
                        left,
                        top,
                        width: tabWidth,
                    },
                    clipStyle,
                ]}
            >
                <Animated.View
                    style={[
                        styles.clipContent,
                        { height: contentHeight, width: contentWidth },
                        contentStyle,
                    ]}
                >
                    {children}
                </Animated.View>
            </Animated.View>
        );
    }

    return (
        <NativeMaskedView
            androidRenderingMode="hardware"
            style={StyleSheet.absoluteFill}
            maskElement={
                <PillMaskElement
                    animatedStyle={animatedStyle}
                    height={height}
                    left={left}
                    tabWidth={tabWidth}
                    top={top}
                />
            }
        >
            {children}
        </NativeMaskedView>
    );
};

// Promote the clip box to its own compositing layer. The static clip-path is a
// second paint boundary for Chromium, where a backdrop-filter child can escape
// borderRadius + overflow:hidden while its transformed parent initializes and
// briefly show a square blur halo. Only the box transform is animated; the clip
// itself remains stable, avoiding Safari's animated clip-path rounding issue.
const WEB_CLIP_LAYER = {
    clipPath: "inset(0 round 999px)",
    willChange: "transform",
} as unknown as ViewStyle;

const styles = StyleSheet.create({
    clipBox: {
        position: "absolute",
        overflow: "hidden",
    },
    clipContent: {
        position: "absolute",
        left: 0,
        top: 0,
    },
    mask: {
        position: "absolute",
        backgroundColor: "#000000",
        borderRadius: 999,
    },
});
