import type { Meta, StoryObj } from "@storybook/react";
import {
    DEFAULT_PREVIEW_ITEMS,
    JellyPreview,
} from "../preview/JellyPreview";
import { PALETTES } from "../preview/presets";

const ICON_ONLY_ITEMS = DEFAULT_PREVIEW_ITEMS.map((item) => ({
    ...item,
    accessibilityLabel: item.label,
    label: "",
}));

const meta = {
    title: "Customization/Layout",
    component: JellyPreview,
    parameters: { layout: "fullscreen" },
    argTypes: {
        config: { control: "object" },
        maxWidth: { control: { type: "range", min: 260, max: 1000, step: 20 } },
    },
} satisfies Meta<typeof JellyPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Defaults: 64pt track, 56pt items, 28pt icons, 4pt inset. */
export const Default: Story = {};

/** Icons only, with the original labels preserved for accessibility. */
export const IconOnly: Story = {
    args: {
        colors: PALETTES.Emerald,
        config: { layout: { trackHeight: 60, itemHeight: 52, iconSize: 28 } },
        items: ICON_ONLY_ITEMS,
        maxWidth: 360,
    },
};

/** A taller bar with larger glyphs and more breathing room. */
export const Tall: Story = {
    args: {
        colors: PALETTES.Indigo,
        config: {
            layout: {
                trackHeight: 84,
                itemHeight: 72,
                iconSize: 34,
                trackInset: 8,
            },
        },
    },
};

/** A deliberately wide violet track that makes the `maxWidth` cap obvious. */
export const FullWidth: Story = {
    args: {
        colors: PALETTES.Violet,
        maxWidth: 960,
    },
};
