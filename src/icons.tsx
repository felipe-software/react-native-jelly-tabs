import { IconSource } from "./components/icon-source";
import type { ReactElement } from "react";

const JELLY_ICON = Symbol.for("react-native-jelly-tabs.icon");

export interface JellyPathIconSource {
    kind: "path";
    path: string;
    viewBox: number;
}

export interface JellyGlyphIconSource {
    kind: "glyph";
    fontFamily: string;
    glyph: string;
}

export type JellyIconSource = JellyPathIconSource | JellyGlyphIconSource;

export interface JellyIconProps {
    color: string;
    focused?: boolean;
    size: number;
}

interface JellyIconSources {
    active: JellyIconSource;
    inactive: JellyIconSource;
}

export type JellyIcon = ((props: JellyIconProps) => ReactElement) & {
    readonly [JELLY_ICON]: JellyIconSources;
};

export interface PathIconOptions {
    inactivePath?: string;
    viewBox?: number;
}

export interface GlyphIconOptions {
    inactiveGlyph?: string | number;
}

const DEFAULT_VIEW_BOX = 24;

const toGlyph = (glyph: string | number) =>
    typeof glyph === "number" ? String.fromCodePoint(glyph) : glyph;

const createIcon = (active: JellyIconSource, inactive: JellyIconSource) => {
    const Icon = ({ color, focused, size }: JellyIconProps) => (
        <IconSource
            color={color}
            size={size}
            source={focused === false ? inactive : active}
        />
    );

    return Object.assign(Icon, {
        [JELLY_ICON]: { active, inactive },
    }) as JellyIcon;
};

export const pathIcon = (
    path: string,
    { inactivePath, viewBox = DEFAULT_VIEW_BOX }: PathIconOptions = {},
): JellyIcon =>
    createIcon(
        { kind: "path", path, viewBox },
        { kind: "path", path: inactivePath ?? path, viewBox },
    );

export const glyphIcon = (
    fontFamily: string,
    glyph: string | number,
    { inactiveGlyph }: GlyphIconOptions = {},
): JellyIcon =>
    createIcon(
        { fontFamily, glyph: toGlyph(glyph), kind: "glyph" },
        {
            fontFamily,
            glyph: toGlyph(inactiveGlyph ?? glyph),
            kind: "glyph",
        },
    );

export const getIconSources = (icon: unknown): JellyIconSources | undefined =>
    typeof icon === "function"
        ? (icon as Partial<JellyIcon>)[JELLY_ICON]
        : undefined;

export const withIconSources = <T extends object>(target: T, icon: unknown) => {
    const sources = getIconSources(icon);
    return sources ? Object.assign(target, { [JELLY_ICON]: sources }) : target;
};
