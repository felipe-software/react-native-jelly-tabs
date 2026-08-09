import type { Meta, StoryObj } from "@storybook/react";
import { GelatinPreview } from "../preview/GelatinPreview";

const meta = {
    title: "Gelatin/Pressable",
    component: GelatinPreview,
    parameters: { layout: "fullscreen" },
    argTypes: {
        config: { control: "object" },
        touchFeedbackColor: { control: "color" },
        touchFeedbackOpacity: {
            control: { type: "range", min: 0, max: 1, step: 0.01 },
        },
        touchFeedbackScale: {
            control: { type: "range", min: 0.1, max: 3, step: 0.05 },
        },
    },
} satisfies Meta<typeof GelatinPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The defaults, ported from the Gelatin SwiftUI package. Press to inflate and
 * light the glow, drag to stretch, release to bounce back.
 */
export const Default: Story = {};

/**
 * `drag.follow` only scales how far the surface travels — the stretch is
 * untouched, so the button chases your finger without going gooier.
 */
export const FollowsTheFinger: Story = {
    args: { config: { drag: { follow: 6 } } },
};

/**
 * `drag.stretchAnchor: 0` scales about the centre instead of pinning the
 * trailing edge. Drag sideways and compare with the default above — the
 * surface inflates both ways rather than being pulled.
 */
export const CentredStretch: Story = {
    args: { config: { drag: { stretchAnchor: 0 } } },
};

/** More amplification and a shorter full-stretch distance: proper goo. */
export const VeryStretchy: Story = {
    args: {
        config: {
            drag: {
                distanceForMaxStretch: 18,
                maxStretch: 1.4,
                stretchAmplification: 4,
            },
        },
    },
};

/** No stretch at all — just the press inflation and the glow. */
export const ScaleOnly: Story = {
    args: {
        config: {
            pressedScale: 1.16,
            drag: { follow: 0, maxStretch: 0 },
        },
    },
};

/** A slack release spring: the surface wobbles for a while after you let go. */
export const Wobbly: Story = {
    args: {
        config: {
            springs: { release: { dampingRatio: 0.25, duration: 900 } },
        },
    },
};

/** Critically damped everywhere — the deformation settles without overshoot. */
export const Snappy: Story = {
    args: {
        config: {
            springs: {
                drag: { dampingRatio: 1, duration: 160 },
                press: { dampingRatio: 1, duration: 120 },
                release: { dampingRatio: 1, duration: 220 },
            },
        },
    },
};

/** A wide, tinted highlight that tracks the pointer inside the surface. */
export const TintedGlow: Story = {
    args: {
        single: true,
        touchFeedbackColor: "#38BDF8",
        touchFeedbackOpacity: 0.6,
        touchFeedbackScale: 1.6,
    },
};

/** Opt out of the highlight entirely. */
export const NoGlow: Story = {
    args: { touchFeedbackEnabled: false },
};
