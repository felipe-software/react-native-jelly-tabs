import type { Meta, StoryObj } from "@storybook/react";
import { JellyPreview } from "../preview/JellyPreview";
import { PALETTES } from "../preview/presets";

const meta = {
    title: "Customization/Items",
    component: JellyPreview,
    parameters: { layout: "fullscreen" },
    argTypes: {
        badgeStyle: { control: "object" },
        activeBadgeStyle: { control: "object" },
    },
} satisfies Meta<typeof JellyPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * `badge` takes a number or a string, so a count, an overflow marker (`9+`) and
 * a bare dot all work. Badges ride along with the icon and follow the pill.
 */
export const Badges: Story = {
    args: { colors: PALETTES.Indigo, showBadges: true },
};

/** Restyle every badge at once with `badgeStyle`. */
export const BadgeStyle: Story = {
    args: {
        colors: PALETTES.Emerald,
        showBadges: true,
        badgeStyle: { backgroundColor: "#FDE047", color: "#422006" },
    },
};

/**
 * The tab row is rendered twice — once in the track, once inside the pill mask.
 * `activeBadgeStyle` layers over `badgeStyle` for the masked copy only, so a
 * badge can be red on the dark track and inverted once the pill slides over it.
 * Drag the pill across the tabs to watch the badge swap.
 */
export const BadgeInsideAndOutsideTheMask: Story = {
    args: {
        showBadges: true,
        badgeStyle: { backgroundColor: "#EF4444", color: "#FFFFFF" },
        activeBadgeStyle: { backgroundColor: "#451A03", color: "#F59E0B" },
    },
};
