import type { Meta, StoryObj } from "@storybook/react";
import { JellyPreview } from "../preview/JellyPreview";
import { PALETTES, type PaletteName } from "../preview/presets";

const meta = {
    title: "Customization/Theming",
    component: JellyPreview,
    parameters: { layout: "fullscreen" },
} satisfies Meta<typeof JellyPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

const palette = (name: PaletteName): Story["args"] => ({
    colors: PALETTES[name],
});

/**
 * `colors` is four tokens. Switch the palette from the controls panel, or tweak
 * a single token — partial objects merge over the defaults.
 */
export const Palette: Story = {
    args: palette("Amber"),
    argTypes: {
        colors: { control: "object" },
    },
};

/** Light pill on a dark track: high contrast, no accent hue. */
export const Mono: Story = { args: palette("Mono") };

/** `opacity` fades each layer independently — the pill's clip shape stays solid. */
export const Opacity: Story = {
    args: {
        ...palette("Cyan"),
        opacity: { surface: 0.55, inactiveContent: 0.7 },
    },
    argTypes: { opacity: { control: "object" } },
};

/**
 * `backdrop` and `selectedBackdrop` render below the color layers, so a blur
 * view frosts whatever is behind the bar. Provider-agnostic: pass your own node.
 */
export const Blur: Story = {
    args: { showBlur: true, blurTrack: 35, blurPill: 20 },
    argTypes: {
        blurTrack: { control: { type: "range", min: 0, max: 100, step: 1 } },
        blurPill: { control: { type: "range", min: 0, max: 100, step: 1 } },
    },
};

/** No backdrop node — the solid `surface` color carries the bar. */
export const Solid: Story = { args: { showBlur: false } };
