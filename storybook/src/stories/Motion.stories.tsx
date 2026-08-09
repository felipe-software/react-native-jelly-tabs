import type { Meta, StoryObj } from "@storybook/react";
import { JellyPreview } from "../preview/JellyPreview";
import { PALETTES } from "../preview/presets";

const meta = {
    title: "Customization/Motion",
    component: JellyPreview,
    parameters: { layout: "fullscreen" },
    argTypes: {
        config: { control: "object" },
        touchFeedbackColor: { control: "color" },
        touchFeedbackOpacity: {
            control: { type: "range", min: 0, max: 1, step: 0.01 },
        },
        touchFeedbackScale: {
            control: { type: "range", min: 0.5, max: 4, step: 0.1 },
        },
    },
} satisfies Meta<typeof JellyPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The defaults. Press, drag sideways, then drag down to feel each group. */
export const Default: Story = { args: { colors: PALETTES.Blue } };

/** Looser springs and a bigger press inflation — more wobble on every snap. */
export const Wobbly: Story = {
    args: {
        colors: PALETTES.Pink,
        config: {
            pillJelly: {
                pressedScale: 1.6,
                frameConfig: {
                    springs: {
                        scaleX: { stiffness: 160, dampingRatio: 0.4 },
                        scaleY: { stiffness: 160, dampingRatio: 0.45 },
                    },
                },
            },
        },
    },
};

/** Critically damped springs and no press inflation — a crisp, flat snap. */
export const Snappy: Story = {
    args: {
        colors: PALETTES.Cyan,
        config: {
            pillJelly: {
                pressedScale: 1,
                snapOnPointerDown: true,
                frameConfig: {
                    springs: {
                        scaleX: { stiffness: 500, dampingRatio: 1 },
                        scaleY: { stiffness: 500, dampingRatio: 1 },
                        value: { stiffness: 1_600, dampingRatio: 1 },
                    },
                },
            },
        },
    },
};

/**
 * `config.distortion.verticalDrag` decides how far the whole track follows your
 * finger downwards and how much it squishes on the way. Turned way up here.
 */
export const HeavyDrag: Story = {
    args: {
        colors: PALETTES.Emerald,
        config: {
            distortion: {
                verticalDrag: {
                    distortion: 0.3,
                    distanceForMaxDistortion: 300,
                    follow: 0.6,
                },
            },
        },
    },
};

/**
 * A radial gradient tracks your finger under the whole bar and again inside the
 * pill. Tinted independently of the pill here — press and hold to see it.
 */
export const TouchFeedback: Story = {
    args: {
        colors: PALETTES.Violet,
        touchFeedbackEnabled: true,
        touchFeedbackColor: "#38BDF8",
        touchFeedbackOpacity: 0.45,
        touchFeedbackScale: 2.4,
    },
};

/** Opt out of the gradient entirely. */
export const NoTouchFeedback: Story = {
    args: { colors: PALETTES.Mono, touchFeedbackEnabled: false },
};
