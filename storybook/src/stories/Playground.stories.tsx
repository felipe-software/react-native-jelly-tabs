import type { Meta, StoryObj } from "@storybook/react";
import {
    Playground,
    PLAYGROUND_ARG_TYPES,
    PLAYGROUND_DEFAULT_ARGS,
} from "../preview/Playground";

const meta = {
    title: "Getting Started/Playground",
    component: Playground,
    parameters: { layout: "fullscreen" },
    argTypes: PLAYGROUND_ARG_TYPES,
    args: PLAYGROUND_DEFAULT_ARGS,
} satisfies Meta<typeof Playground>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Every knob in one place — palette, blur, layout, badges and touch feedback.
 * Hit **Copy props** on the preview to take the current state into your code.
 */
export const Default: Story = {};
