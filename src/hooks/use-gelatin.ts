import type { GelatinConfig } from "../constants";
import { getGelatinTransform } from "../utils/gelatin-animation";
import { useTouchGlow } from "./use-touch-glow";
import {
    cancelAnimation,
    clamp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

/**
 * The elastic press/drag effect behind `JellyPressable`, exposed on its own so
 * it can be wired to a custom gesture or a component the library does not ship.
 *
 * Call `setSize` from `onLayout`, then `begin` / `update` / `end` from a
 * gesture, and spread `gelatinStyle` on the view you want to deform.
 */
export const useGelatin = (config: GelatinConfig, touchFeedbackRadius = 0) => {
    const { drag, pressedScale, springs } = config;
    const glow = useTouchGlow(springs.press, touchFeedbackRadius);

    const width = useSharedValue(0);
    const height = useSharedValue(0);
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const stretchX = useSharedValue(1);
    const stretchY = useSharedValue(1);
    const pressScale = useSharedValue(1);
    // Fractions of the view's size, so they survive a resize mid-gesture.
    const originX = useSharedValue(0.5);
    const originY = useSharedValue(0.5);

    /** Keeps the glow inside the view even when the finger travels past it. */
    const moveGlow = (localX: number, localY: number) => {
        "worklet";

        glow.centerX.value = clamp(localX, 0, width.value);
        glow.centerY.value = clamp(localY, 0, height.value);
    };

    const begin = (localX: number, localY: number) => {
        "worklet";

        cancelAnimation(offsetX);
        cancelAnimation(offsetY);
        cancelAnimation(stretchX);
        cancelAnimation(stretchY);
        cancelAnimation(pressScale);
        cancelAnimation(originX);
        cancelAnimation(originY);

        glow.show(
            clamp(localX, 0, width.value),
            clamp(localY, 0, height.value),
        );
        pressScale.value = withSpring(pressedScale, springs.press);
    };

    const update = (
        translationX: number,
        translationY: number,
        localX: number,
        localY: number,
    ) => {
        "worklet";

        // Re-springing towards a fresh target on every frame is what produces
        // the lag: the view is always chasing where the finger just was.
        const next = getGelatinTransform(translationX, translationY, drag);

        offsetX.value = withSpring(next.offsetX, springs.drag);
        offsetY.value = withSpring(next.offsetY, springs.drag);
        stretchX.value = withSpring(next.scaleX, springs.drag);
        stretchY.value = withSpring(next.scaleY, springs.drag);
        originX.value = withSpring(next.originX, springs.drag);
        originY.value = withSpring(next.originY, springs.drag);
        moveGlow(localX, localY);
    };

    const end = () => {
        "worklet";

        offsetX.value = withSpring(0, springs.release);
        offsetY.value = withSpring(0, springs.release);
        stretchX.value = withSpring(1, springs.release);
        stretchY.value = withSpring(1, springs.release);
        // The origin recentres on the same spring as the stretch, so both
        // reach rest together and the surface never slides at the end.
        originX.value = withSpring(0.5, springs.release);
        originY.value = withSpring(0.5, springs.release);
        pressScale.value = withSpring(1, springs.press);
        glow.hide();
    };

    const setSize = (nextWidth: number, nextHeight: number) => {
        width.value = nextWidth;
        height.value = nextHeight;

        // Only re-center while the glow is invisible, so a layout pass during
        // a press cannot yank the highlight away from the finger.
        if (glow.opacity.value === 0) {
            glow.centerX.value = nextWidth / 2;
            glow.centerY.value = nextHeight / 2;
        }
    };

    // Reanimated Web does not reliably commit animated `transformOrigin`
    // updates, so the pivot is built from paired translations instead:
    // translate(P - C) · scale · translate(C - P) scales about P on every
    // platform. The same trick drives the tab bar's distortion.
    const gelatinStyle = useAnimatedStyle(() => {
        const pivotX = (originX.value - 0.5) * width.value;
        const pivotY = (originY.value - 0.5) * height.value;

        return {
            transform: [
                { translateX: offsetX.value + pivotX },
                { translateY: offsetY.value + pivotY },
                { scaleX: stretchX.value * pressScale.value },
                { scaleY: stretchY.value * pressScale.value },
                { translateX: -pivotX },
                { translateY: -pivotY },
            ],
        };
    });

    const touchFeedbackStyle = useAnimatedStyle(glow.getStyle);

    return {
        begin,
        end,
        gelatinStyle,
        setSize,
        touchFeedbackStyle,
        update,
    };
};
