import { useMemo } from "react";
import {
    processColor,
    type StyleProp,
    StyleSheet,
    type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { isWeb } from "../platform";

export interface TouchFeedbackProps {
    animatedStyle: StyleProp<AnimatedStyle<ViewStyle>>;
    centerOpacity: number;
    color?: string;
    diameter: number;
    middleOpacity: number;
    offsetX?: number;
    offsetY?: number;
    radius: number;
}

/**
 * Resolves any React Native colour string (hex, `rgb()`, `hsl()`, named…) into
 * `rgba()` with `alpha` folded in. `processColor` is the platform's own parser,
 * so this accepts exactly what the rest of the API accepts.
 */
const toRgba = (color: string, alpha: number) => {
    const processed = processColor(color);
    if (typeof processed !== "number") {
        return `rgba(255, 255, 255, ${alpha})`;
    }

    // processColor yields ARGB packed into a (possibly negative) 32-bit int.
    const argb = processed >>> 0;
    const red = (argb >> 16) & 0xff;
    const green = (argb >> 8) & 0xff;
    const blue = argb & 0xff;
    const sourceAlpha = ((argb >> 24) & 0xff) / 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha * sourceAlpha})`;
};

/**
 * The radial glow used to be a `react-native-svg` `<RadialGradient>`. Two of
 * them were mounted permanently — one on the track, one inside the pill — and
 * each `SvgView` re-recorded its display list whenever the animated subtree
 * around it repainted. React Native ships a native radial gradient since 0.80,
 * which is drawn straight into the view's background by the platform, so the
 * whole SVG dependency drops out of this package.
 */
export const TouchFeedback = ({
    animatedStyle,
    centerOpacity,
    color = "#ffffff",
    diameter,
    middleOpacity,
    offsetX = 0,
    offsetY = 0,
}: TouchFeedbackProps) => {
    const gradientStyle = useMemo(() => {
        // `closest-side circle at center` on a square box gives a radius of
        // exactly diameter / 2 — the same circle the SVG gradient described with
        // cx = cy = r = radius over a radius*2 rect.
        const gradient =
            `radial-gradient(circle closest-side at center, ` +
            `${toRgba(color, centerOpacity)} 0%, ` +
            `${toRgba(color, middleOpacity)} 45%, ` +
            `${toRgba(color, 0)} 100%)`;

        return isWeb()
            ? ({ backgroundImage: gradient } as unknown as ViewStyle)
            : ({ experimental_backgroundImage: gradient } as ViewStyle);
    }, [centerOpacity, color, middleOpacity]);

    return (
        <Animated.View
            style={[
                styles.root,
                {
                    height: diameter,
                    left: offsetX,
                    top: offsetY,
                    width: diameter,
                },
                gradientStyle,
                animatedStyle,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    root: {
        position: "absolute",
        left: 0,
        top: 0,
    },
});
