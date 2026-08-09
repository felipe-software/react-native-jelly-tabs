import { mock } from "bun:test";
import {
    createElement,
    forwardRef,
    useImperativeHandle,
    useRef,
} from "react";

const mockModule = (
    specifier: string,
    factory: () => Record<string, unknown>,
) => {
    const resolved = import.meta.resolve(specifier);
    mock.module(specifier, factory);
    mock.module(resolved, factory);
    if (resolved.startsWith("file:")) {
        mock.module(new URL(resolved).pathname, factory);
    }
};

export const platform = {
    OS: "ios",
    select<T>(specifics: {
        android?: T;
        default?: T;
        ios?: T;
        native?: T;
        web?: T;
    }) {
        return specifics[this.OS as "android" | "ios" | "web"] ??
            specifics.native ??
            specifics.default;
    },
};

export const absoluteFill = {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
} as const;

const flattenStyle = (style: unknown): unknown => {
    if (Array.isArray(style)) {
        return style.reduce<Record<string, unknown>>((result, value) => {
            const flattened = flattenStyle(value);
            return flattened && typeof flattened === "object"
                ? { ...result, ...flattened }
                : result;
        }, {});
    }

    return style;
};

const MockAnimatedView = forwardRef<
    {
        measureInWindow: (
            callback: (x: number, y: number) => void,
        ) => void;
    },
    Record<string, unknown>
>((props, ref) => {
    useImperativeHandle(ref, () => ({
        measureInWindow,
    }), []);

    return createElement("Animated.View", props);
});

export const measureInWindow = mock(
    (callback: (x: number, y: number) => void) => {
        callback(24, 12);
    },
);

type DimensionsChangeListener = () => void;
const dimensionsChangeListeners = new Set<DimensionsChangeListener>();

export const dimensions = {
    addEventListener(_type: "change", listener: DimensionsChangeListener) {
        dimensionsChangeListeners.add(listener);
        return {
            remove() {
                dimensionsChangeListeners.delete(listener);
            },
        };
    },
    emitChange() {
        for (const listener of dimensionsChangeListeners) {
            listener();
        }
    },
};

mockModule("react-native", () => ({
    Dimensions: dimensions,
    Platform: platform,
    StyleSheet: {
        absoluteFill,
        create<T>(styles: T) {
            return styles;
        },
        flatten: flattenStyle,
    },
    Text: "Text",
    View: "View",
}));

mockModule("react-native-reanimated", () => ({
    cancelAnimation() {},
    clamp(value: number, lowerBound: number, upperBound: number) {
        return Math.min(Math.max(value, lowerBound), upperBound);
    },
    default: { View: MockAnimatedView },
    runOnJS<T extends (...args: never[]) => unknown>(callback: T) {
        return callback;
    },
    useAnimatedStyle<T>(updater: () => T) {
        return updater();
    },
    useDerivedValue<T>(updater: () => T) {
        return {
            get value() {
                return updater();
            },
        };
    },
    useFrameCallback() {
        return useRef({ setActive() {} }).current;
    },
    useSharedValue<T>(initialValue: T) {
        return useRef({ value: initialValue }).current;
    },
    withSpring<T>(value: T) {
        return value;
    },
}));

const gestureBuilder = () => {
    let builder: Record<string, unknown>;
    builder = new Proxy(
        {},
        {
            get() {
                return () => builder;
            },
        },
    );
    return builder;
};

mockModule("react-native-gesture-handler", () => ({
    Gesture: {
        LongPress: gestureBuilder,
        Pan: gestureBuilder,
        Simultaneous: (...gestures: unknown[]) => ({ gestures }),
    },
    GestureDetector: "GestureDetector",
}));

mockModule("@react-native-masked-view/masked-view", () => ({
    default: "MaskedView",
}));

mockModule("react-native-svg", () => ({
    default: "Svg",
    Defs: "Defs",
    RadialGradient: "RadialGradient",
    Rect: "Rect",
    Stop: "Stop",
}));
