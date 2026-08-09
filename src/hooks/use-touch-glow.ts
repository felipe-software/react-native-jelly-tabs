import {
    cancelAnimation,
    useSharedValue,
    type WithSpringConfig,
    withSpring,
} from "react-native-reanimated";

/**
 * A radial highlight that fades in under the pointer and stays parked where the
 * caller puts it. Shared by the tab bar (`useDistortion`) and the standalone
 * gelatin pressable (`useGelatin`).
 *
 * The center is exposed as shared values rather than moved through a setter so
 * a caller can reuse it as a transform pivot — the tab bar distorts around the
 * same point the glow sits on.
 */
export const useTouchGlow = (spring: WithSpringConfig, radius = 0) => {
    const centerX = useSharedValue(0);
    const centerY = useSharedValue(0);
    const opacity = useSharedValue(0);

    const show = (x: number, y: number) => {
        "worklet";

        cancelAnimation(opacity);
        centerX.value = x;
        centerY.value = y;
        opacity.value = withSpring(1, spring);
    };

    const hide = () => {
        "worklet";

        opacity.value = withSpring(0, spring);
    };

    /**
     * Returned as a plain worklet instead of an animated style: one animated
     * style object cannot drive two views, and the tab bar paints this glow
     * twice — once under the track and once inside the pill.
     */
    const getStyle = () => {
        "worklet";

        return {
            opacity: opacity.value,
            transform: [
                { translateX: centerX.value - radius },
                { translateY: centerY.value - radius },
            ],
        };
    };

    return { centerX, centerY, getStyle, hide, opacity, show };
};
