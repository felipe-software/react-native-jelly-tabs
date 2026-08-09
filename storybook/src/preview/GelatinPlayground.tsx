import { GelatinPreview } from "./GelatinPreview";

// Flat args → one <GelatinPreview>. Storybook controls read much better as a
// range per number than as a nested object editor.
export interface GelatinPlaygroundArgs {
    pressedScale: number;
    easingExponent: number;
    follow: number;
    maxStretch: number;
    stretchAmplification: number;
    distanceForMaxStretch: number;
    stretchAnchor: number;
    dragDuration: number;
    releaseDuration: number;
    releaseBounce: number;
    pressDuration: number;
    showBlur: boolean;
    touchFeedbackEnabled: boolean;
    touchFeedbackColor: string;
    touchFeedbackOpacity: number;
    touchFeedbackScale: number;
}

const range = (min: number, max: number, step = 1) =>
    ({ control: { type: "range", min, max, step } }) as const;

export const GELATIN_ARG_TYPES = {
    pressedScale: range(1, 1.6, 0.01),
    easingExponent: range(0.1, 1, 0.01),
    follow: range(0, 6, 0.1),
    maxStretch: range(0, 2, 0.05),
    stretchAmplification: range(0, 6, 0.1),
    distanceForMaxStretch: range(8, 300, 4),
    stretchAnchor: range(0, 1, 0.05),
    dragDuration: range(60, 1_000, 10),
    releaseDuration: range(100, 1_500, 10),
    releaseBounce: range(0, 1, 0.05),
    pressDuration: range(60, 1_000, 10),
    showBlur: { control: "boolean" },
    touchFeedbackEnabled: { control: "boolean" },
    touchFeedbackColor: { control: "color" },
    touchFeedbackOpacity: range(0, 1, 0.01),
    touchFeedbackScale: range(0.1, 3, 0.05),
} as const;

export const GELATIN_DEFAULT_ARGS: GelatinPlaygroundArgs = {
    pressedScale: 1.1,
    easingExponent: 1 / 3,
    follow: 2,
    maxStretch: 0.9,
    stretchAmplification: 3,
    distanceForMaxStretch: 32,
    stretchAnchor: 1,
    dragDuration: 390,
    releaseDuration: 500,
    // `dampingRatio` counts down from 1, so the slider reads as "bounce".
    releaseBounce: 0.5,
    pressDuration: 300,
    showBlur: true,
    touchFeedbackEnabled: true,
    touchFeedbackColor: "#FFFFFF",
    touchFeedbackOpacity: 0.35,
    touchFeedbackScale: 1,
};

export const GelatinPlayground = (args: GelatinPlaygroundArgs) => (
    <GelatinPreview
        config={{
            pressedScale: args.pressedScale,
            drag: {
                distanceForMaxStretch: args.distanceForMaxStretch,
                easingExponent: args.easingExponent,
                follow: args.follow,
                maxStretch: args.maxStretch,
                stretchAnchor: args.stretchAnchor,
                stretchAmplification: args.stretchAmplification,
            },
            springs: {
                drag: { dampingRatio: 1, duration: args.dragDuration },
                press: { dampingRatio: 0.5, duration: args.pressDuration },
                release: {
                    dampingRatio: 1 - args.releaseBounce,
                    duration: args.releaseDuration,
                },
            },
        }}
        showBlur={args.showBlur}
        touchFeedbackColor={args.touchFeedbackColor}
        touchFeedbackEnabled={args.touchFeedbackEnabled}
        touchFeedbackOpacity={args.touchFeedbackOpacity}
        touchFeedbackScale={args.touchFeedbackScale}
    />
);
