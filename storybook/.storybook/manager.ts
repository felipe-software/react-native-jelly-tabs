import { addons } from "storybook/manager-api";

const DEFAULT_SIDEBAR_WIDTH = 380;

addons.setConfig({
    layout: {
        navSize: DEFAULT_SIDEBAR_WIDTH,
    },
});

addons.register("jelly-tabs/sidebar-width", (api) => {
    api.setSizes({ navSize: DEFAULT_SIDEBAR_WIDTH });
});
