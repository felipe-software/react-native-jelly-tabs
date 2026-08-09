import { JellyPreview } from "./JellyPreview";
import { PALETTES } from "./presets";

// Flat args → one <JellyPreview>. Storybook controls are nicer when flat
// (a color picker per token, a range per number) than a nested object editor.
// Every color arg is optional: leave it empty and the selected palette wins.
export interface PlaygroundArgs {
    palette: keyof typeof PALETTES;
    surface?: string;
    selectedSurface?: string;
    activeContent?: string;
    inactiveContent?: string;
    surfaceOpacity: number;
    showBlur: boolean;
    blurTrack: number;
    blurPill: number;
    trackHeight: number;
    itemHeight: number;
    iconSize: number;
    trackInset: number;
    maxWidth: number;
    showBadges: boolean;
    badgeBackground: string;
    activeBadgeBackground: string;
    activeBadgeColor: string;
    touchFeedbackEnabled: boolean;
    touchFeedbackColor?: string;
    touchFeedbackOpacity: number;
    touchFeedbackScale: number;
}

const range = (min: number, max: number, step = 1) =>
    ({ control: { type: "range", min, max, step } }) as const;

export const PLAYGROUND_ARG_TYPES = {
    palette: { control: "select", options: Object.keys(PALETTES) },
    surface: { control: "color" },
    selectedSurface: { control: "color" },
    activeContent: { control: "color" },
    inactiveContent: { control: "color" },
    surfaceOpacity: range(0, 1, 0.05),
    showBlur: { control: "boolean" },
    blurTrack: range(0, 100),
    blurPill: range(0, 100),
    trackHeight: range(48, 96),
    itemHeight: range(36, 88),
    iconSize: range(16, 40),
    trackInset: range(0, 16),
    maxWidth: range(260, 520, 10),
    showBadges: { control: "boolean" },
    badgeBackground: { control: "color" },
    activeBadgeBackground: { control: "color" },
    activeBadgeColor: { control: "color" },
    touchFeedbackEnabled: { control: "boolean" },
    touchFeedbackColor: { control: "color" },
    touchFeedbackOpacity: range(0, 1, 0.01),
    touchFeedbackScale: range(0.5, 4, 0.1),
} as const;

export const PLAYGROUND_DEFAULT_ARGS: PlaygroundArgs = {
    palette: "Amber",
    surfaceOpacity: 1,
    showBlur: true,
    blurTrack: 35,
    blurPill: 20,
    trackHeight: 64,
    itemHeight: 56,
    iconSize: 28,
    trackInset: 4,
    maxWidth: 400,
    showBadges: false,
    badgeBackground: "#FF3B30",
    activeBadgeBackground: "#451A03",
    activeBadgeColor: "#F59E0B",
    touchFeedbackEnabled: true,
    touchFeedbackOpacity: 0.15,
    touchFeedbackScale: 2,
};

export const Playground = (args: PlaygroundArgs) => {
    const palette = PALETTES[args.palette];

    return (
        <JellyPreview
            colors={{
                surface: args.surface ?? palette.surface,
                selectedSurface: args.selectedSurface ?? palette.selectedSurface,
                activeContent: args.activeContent ?? palette.activeContent,
                inactiveContent: args.inactiveContent ?? palette.inactiveContent,
            }}
            opacity={{ surface: args.surfaceOpacity }}
            config={{
                layout: {
                    trackHeight: args.trackHeight,
                    itemHeight: args.itemHeight,
                    iconSize: args.iconSize,
                    trackInset: args.trackInset,
                },
            }}
            showBadges={args.showBadges}
            badgeStyle={{ backgroundColor: args.badgeBackground }}
            activeBadgeStyle={{
                backgroundColor: args.activeBadgeBackground,
                color: args.activeBadgeColor,
            }}
            showBlur={args.showBlur}
            blurTrack={args.blurTrack}
            blurPill={args.blurPill}
            maxWidth={args.maxWidth}
            touchFeedbackColor={args.touchFeedbackColor}
            touchFeedbackEnabled={args.touchFeedbackEnabled}
            touchFeedbackOpacity={args.touchFeedbackOpacity}
            touchFeedbackScale={args.touchFeedbackScale}
        />
    );
};
