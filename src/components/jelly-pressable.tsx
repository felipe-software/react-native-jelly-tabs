import { resolveGelatinConfig } from "../constants";
import { useGelatin } from "../hooks/use-gelatin";
import { getLocalCoordinate, useWebOrigin } from "../hooks/use-web-origin";
import type { JellyPressableProps } from "../types";
import { TouchFeedback } from "./touch-feedback";
import { useId, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue } from "react-native-reanimated";

/** A gesture that never travelled further than this counts as a tap. */
const PRESS_SLOP = 8;
const LONG_PRESS_DURATION = 500;

const ACTIVATE_ACCESSIBILITY_ACTION = [{ name: "activate" }] as const;
const PRESSABLE_ACCESSIBILITY_ACTIONS = [
    { name: "activate" },
    { name: "longpress" },
] as const;

const clampUnit = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * A pressable that behaves like a blob of gelatin: it inflates under the
 * finger, lights up a radial glow where you touched it, and stretches
 * elastically as you drag before bouncing back on release.
 *
 * Standalone by design — it shares hooks with `JellyTabBar` but none of its
 * layout or configuration.
 */
export const JellyPressable = ({
    accessibilityHint,
    accessibilityLabel,
    accessibilityRole = "button",
    accessibilityState,
    borderRadius,
    children,
    config,
    disabled = false,
    onLongPress,
    onPress,
    style,
    testID,
    touchFeedbackColor = "#ffffff",
    touchFeedbackEnabled = true,
    touchFeedbackOpacity,
    touchFeedbackScale,
}: JellyPressableProps) => {
    const isWeb = Platform.OS === "web";
    const gradientId = useId();
    const origin = useWebOrigin();
    const resolvedConfig = useMemo(() => resolveGelatinConfig(config), [config]);

    const centerOpacity = clampUnit(
        touchFeedbackOpacity ?? resolvedConfig.touchFeedback.opacity,
    );
    const radius =
        resolvedConfig.touchFeedback.radius *
        Math.max(touchFeedbackScale ?? resolvedConfig.touchFeedback.scale, 0);
    const diameter = radius * 2;
    const middleOpacity =
        centerOpacity * resolvedConfig.touchFeedback.middleOpacityRatio;

    const gelatin = useGelatin(resolvedConfig, radius);
    const movedDistance = useSharedValue(0);
    const longPressFired = useSharedValue(false);

    // Keeps the glow inside a rounded surface without asking for the radius
    // twice when it is already declared on `style`.
    const glowRadius =
        borderRadius ?? StyleSheet.flatten(style)?.borderRadius ?? 0;

    const panGesture = Gesture.Pan()
        .enabled(!disabled)
        .minDistance(0)
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .onTouchesDown((event) => {
            const touch = event.changedTouches[0] ?? event.allTouches[0];
            if (!touch) {
                return;
            }

            movedDistance.value = 0;
            longPressFired.value = false;
            gelatin.begin(
                getLocalCoordinate(
                    touch.absoluteX,
                    touch.x,
                    origin.pageX.value,
                    isWeb,
                ),
                getLocalCoordinate(
                    touch.absoluteY,
                    touch.y,
                    origin.pageY.value,
                    isWeb,
                ),
            );
        })
        .onUpdate((event) => {
            gelatin.update(
                event.translationX,
                event.translationY,
                getLocalCoordinate(
                    event.absoluteX,
                    event.x,
                    origin.pageX.value,
                    isWeb,
                ),
                getLocalCoordinate(
                    event.absoluteY,
                    event.y,
                    origin.pageY.value,
                    isWeb,
                ),
            );
            movedDistance.value = Math.max(
                movedDistance.value,
                Math.abs(event.translationX),
                Math.abs(event.translationY),
            );
        })
        .onFinalize(() => {
            gelatin.end();

            // A hold that already fired `onLongPress` is not also a tap.
            if (
                onPress &&
                !longPressFired.value &&
                movedDistance.value < PRESS_SLOP
            ) {
                runOnJS(onPress)();
            }
        });

    const longPressGesture = Gesture.LongPress()
        .enabled(!disabled && Boolean(onLongPress))
        .minDuration(LONG_PRESS_DURATION)
        .maxDistance(PRESS_SLOP)
        .onStart(() => {
            longPressFired.value = true;
            if (onLongPress) {
                runOnJS(onLongPress)();
            }
        });

    const gesture = onLongPress
        ? Gesture.Simultaneous(panGesture, longPressGesture)
        : panGesture;

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                collapsable={false}
                // The surface itself must be the hit-test target, not a child:
                // Gesture Handler on web captures the pointer on whatever the
                // touch landed on, and a moving target means a release outside
                // the button never reaches the gesture.
                pointerEvents="box-only"
                ref={origin.ref}
                style={[styles.root, style, gelatin.gelatinStyle]}
                testID={testID}
                onLayout={(event) => {
                    const { height, width } = event.nativeEvent.layout;
                    gelatin.setSize(width, height);
                    origin.measure();
                }}
            >
                {touchFeedbackEnabled && (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.glowClip,
                            { borderRadius: glowRadius },
                        ]}
                    >
                        <TouchFeedback
                            animatedStyle={gelatin.touchFeedbackStyle}
                            centerOpacity={centerOpacity}
                            color={touchFeedbackColor}
                            diameter={diameter}
                            gradientId={`jelly-pressable-glow-${gradientId}`}
                            middleOpacity={middleOpacity}
                            radius={radius}
                        />
                    </View>
                )}
                {children}

                {/*
                 * The semantics live on their own inert layer rather than on
                 * the surface above. Gesture Handler skips web pointer capture
                 * whenever its own view carries `role="button"`, which would
                 * cost us every release that lands outside the button.
                 */}
                <View
                    accessibilityActions={
                        onLongPress
                            ? PRESSABLE_ACCESSIBILITY_ACTIONS
                            : ACTIVATE_ACCESSIBILITY_ACTION
                    }
                    accessibilityHint={accessibilityHint}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole={accessibilityRole}
                    accessibilityState={{ disabled, ...accessibilityState }}
                    accessible
                    pointerEvents="none"
                    style={styles.semantics}
                    onAccessibilityAction={(event) => {
                        if (disabled) {
                            return;
                        }
                        if (event.nativeEvent.actionName === "activate") {
                            onPress?.();
                        } else if (
                            event.nativeEvent.actionName === "longpress"
                        ) {
                            onLongPress?.();
                        }
                    }}
                />
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    root: {
        // Containing block for the absolutely positioned glow layer.
        position: "relative",
        // Stop the label glyphs from being text-selected on web; harmless on native.
        userSelect: "none",
    },
    semantics: {
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
    },
    glowClip: {
        bottom: 0,
        left: 0,
        overflow: "hidden",
        position: "absolute",
        right: 0,
        top: 0,
    },
});
