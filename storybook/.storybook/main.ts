import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-native-web-vite";

// Consume the library straight from source so previews always reflect the
// current code (no build step) and our worklets get transpiled by the same
// react-native-worklets babel plugin configured below.
const librarySrc = fileURLToPath(new URL("../../src/index.ts", import.meta.url));

const config: StorybookConfig = {
    stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
    addons: ["@storybook/addon-docs"],
    // react-docgen chokes on the Flow syntax inside react-native's source; we
    // author argTypes by hand, so prop autodetection is not needed.
    typescript: { reactDocgen: false },
    framework: {
        name: "@storybook/react-native-web-vite",
        options: {
            modulesToTranspile: [
                "react-native-reanimated",
                "react-native-worklets",
                "react-native-gesture-handler",
            ],
            pluginReactOptions: {
                babel: {
                    plugins: ["react-native-worklets/plugin"],
                },
            },
        },
    },
    viteFinal: async (viteConfig) => {
        viteConfig.resolve = viteConfig.resolve ?? {};
        viteConfig.resolve.alias = {
            ...(viteConfig.resolve.alias ?? {}),
            "react-native-jelly-tabs": librarySrc,
        };
        return viteConfig;
    },
};

export default config;
