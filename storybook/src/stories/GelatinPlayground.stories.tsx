import type { Meta, StoryObj } from "@storybook/react";
import {
    GELATIN_ARG_TYPES,
    GELATIN_DEFAULT_ARGS,
    GelatinPlayground,
} from "../preview/GelatinPlayground";

const meta = {
    title: "Gelatin/Playground",
    component: GelatinPlayground,
    parameters: { layout: "fullscreen" },
    argTypes: GELATIN_ARG_TYPES,
    args: GELATIN_DEFAULT_ARGS,
} satisfies Meta<typeof GelatinPlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every gelatin dial in one place — drag the buttons while you tune them. */
export const Default: Story = {};
