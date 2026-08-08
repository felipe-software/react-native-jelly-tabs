import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

const GITHUB_URL = "https://github.com/felipe-software/react-native-jelly-tabs";

const config: Config = {
    title: "Jelly Tabs",
    tagline: "A playful, jelly-like animated tab bar for React Native",
    favicon: "img/favicon.svg",

    // Update `url` to the final host when the site is deployed (Cloudflare).
    url: "https://react-native-jelly-tabs.pages.dev",
    baseUrl: "/",

    organizationName: "felipe-software",
    projectName: "react-native-jelly-tabs",

    onBrokenLinks: "throw",
    markdown: { hooks: { onBrokenMarkdownLinks: "warn" } },

    i18n: { defaultLocale: "en", locales: ["en"] },

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    editUrl: `${GITHUB_URL}/tree/main/docs`,
                },
                blog: false,
                theme: { customCss: "./src/css/custom.css" },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        colorMode: { defaultMode: "dark", respectPrefersColorScheme: true },
        navbar: {
            title: "Jelly Tabs",
            logo: { alt: "Jelly Tabs", src: "img/logo.svg" },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "docs",
                    position: "left",
                    label: "Docs",
                },
                {
                    to: "pathname:///storybook/index.html",
                    label: "Storybook",
                    position: "left",
                    target: "_blank",
                },
                { href: GITHUB_URL, label: "GitHub", position: "right" },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        { label: "Getting Started", to: "/docs/intro" },
                        { label: "Installation", to: "/docs/installation" },
                        { label: "Customization", to: "/docs/customization/theming" },
                    ],
                },
                {
                    title: "More",
                    items: [
                        { label: "Storybook", to: "pathname:///storybook/index.html" },
                        { label: "GitHub", href: GITHUB_URL },
                    ],
                },
            ],
            copyright: `MIT © ${new Date().getFullYear()} react-native-jelly-tabs`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            additionalLanguages: ["bash", "json", "tsx", "diff"],
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
