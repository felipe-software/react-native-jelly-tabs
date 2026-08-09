import type { TabBarConfig } from "../constants";
import { getPointerOrigin, rubberBand } from "../utils/animation";
import { useTouchGlow } from "./use-touch-glow";
import {
    cancelAnimation,
    clamp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

export const useDistortion = (
    config: TabBarConfig,
    displayScale = 1,
    touchFeedbackRadius = 0,
) => {
    const geometryScale = displayScale > 0 ? displayScale : 1;
    const { distortion, layout } = config;
    const trackHeight = layout.trackHeight * geometryScale;
    const distanceForMaxDistortion =
        distortion.verticalDrag.distanceForMaxDistortion * geometryScale;

    const trackWidth = useSharedValue(0);
    const translateY = useSharedValue(0);
    const dragOriginY = useSharedValue(0);
    const scaleX = useSharedValue(1);
    const pressedScale = useSharedValue(1);

    // The glow center doubles as the horizontal pivot: the tabbar distorts
    // around the exact point the highlight sits on. `centerY` is kept in
    // tabbar-local coordinates so the parent transform moves and distorts the
    // glow together with the surface.
    const glow = useTouchGlow(distortion.spring, touchFeedbackRadius);
    const transformOriginX = glow.centerX;

    const pointerInitialLocalX = useSharedValue(0);
    const pointerInitialAbsoluteX = useSharedValue(0);

    const begin = (localX: number, localY: number, absoluteX: number) => {
        "worklet";

        cancelAnimation(translateY);
        cancelAnimation(scaleX);
        cancelAnimation(pressedScale);

        dragOriginY.value = translateY.value;
        pressedScale.value = withSpring(
            distortion.pressedScale,
            distortion.spring,
        );
        pointerInitialLocalX.value = localX;
        pointerInitialAbsoluteX.value = absoluteX;
        glow.show(
            clamp(localX, 0, trackWidth.value),
            clamp(localY, 0, trackHeight),
        );
    };

    const update = (
        verticalTranslation: number,
        absoluteX: number,
        localX: number | null = null,
    ) => {
        "worklet";

        const appliedTranslation =
            rubberBand(
                verticalTranslation,
                trackHeight,
                distortion.verticalDrag.rubberBand,
            ) * distortion.verticalDrag.follow;
        const progress = Math.min(
            Math.abs(verticalTranslation) /
                Math.max(distanceForMaxDistortion, 0.0001),
            1,
        );

        translateY.value = dragOriginY.value + appliedTranslation;
        scaleX.value = 1 - progress * distortion.verticalDrag.distortion;
        transformOriginX.value =
            localX === null
                ? getPointerOrigin(
                      absoluteX,
                      trackWidth.value,
                      pointerInitialAbsoluteX.value,
                      pointerInitialLocalX.value,
                  )
                : clamp(localX, 0, trackWidth.value);
    };

    const end = () => {
        "worklet";

        translateY.value = withSpring(0, distortion.spring);
        scaleX.value = withSpring(1, distortion.spring, (finished) => {
            if (finished) {
                transformOriginX.value = trackWidth.value / 2;
            }
        });
        pressedScale.value = withSpring(1, distortion.spring);
        glow.hide();
    };

    const setTrackWidth = (width: number) => {
        trackWidth.value = width;
        transformOriginX.value = width / 2;
    };

    // Reanimated Web does not reliably commit animated transformOrigin
    // updates. A centered CSS origin plus paired translations produces the
    // same moving pivot and works consistently on every platform.
    const tabbarStyle = useAnimatedStyle(() => ({
        transformOrigin: ["50%", trackHeight / 2, 0] as [
            string,
            number,
            number,
        ],
        transform: [
            {
                translateX: transformOriginX.value - trackWidth.value / 2,
            },
            { translateY: translateY.value },
            { scaleX: scaleX.value },
            {
                translateX: trackWidth.value / 2 - transformOriginX.value,
            },
        ],
    }));

    const pressedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressedScale.value }],
    }));

    // Two views paint the same glow — under the track and inside the pill — so
    // each needs its own animated style object.
    const touchFeedbackStyle = useAnimatedStyle(glow.getStyle);
    const selectedTouchFeedbackStyle = useAnimatedStyle(glow.getStyle);

    return {
        begin,
        end,
        pressedStyle,
        selectedTouchFeedbackStyle,
        setTrackWidth,
        tabbarStyle,
        touchFeedbackStyle,
        update,
    };
};
