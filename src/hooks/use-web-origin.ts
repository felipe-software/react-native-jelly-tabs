import { useCallback, useEffect, useRef } from "react";
import { Dimensions, Platform, type View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

/**
 * Tracks a view's window position so touch coordinates can be derived from the
 * absolute pointer position.
 *
 * Gesture Handler on web mounts a `display: contents` wrapper and can report
 * `event.x` relative to it instead of the view, which makes local coordinates
 * unusable. Subtracting this origin from an absolute touch fixes that. Native
 * already reports local coordinates, so nothing here is consumed there.
 */
export const useWebOrigin = () => {
    const ref = useRef<View>(null);
    const pageX = useSharedValue(Number.NaN);
    const pageY = useSharedValue(Number.NaN);

    const measure = useCallback(() => {
        ref.current?.measureInWindow((x, y) => {
            if (Number.isFinite(x)) {
                pageX.value = x;
            }
            if (Number.isFinite(y)) {
                pageY.value = y;
            }
        });
    }, [pageX, pageY]);

    useEffect(() => {
        if (Platform.OS !== "web") {
            return;
        }

        // A centered view can move when the viewport is resized without
        // changing its own size, so onLayout alone will not run again.
        const subscription = Dimensions.addEventListener("change", measure);

        return () => subscription.remove();
    }, [measure]);

    return { measure, pageX, pageY, ref };
};

/**
 * Picks the trustworthy local coordinate for the current platform: the measured
 * origin on web, the gesture's own local value everywhere else.
 */
export const getLocalCoordinate = (
    absolute: number,
    local: number,
    origin: number,
    isWeb: boolean,
) => {
    "worklet";

    return isWeb && Number.isFinite(origin) ? absolute - origin : local;
};
