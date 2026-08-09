import {
    DEFAULT_TAB_BAR_CONFIG,
    DEFAULT_TAB_BAR_OPACITY,
    type DeepPartial,
    type TabBarColors,
    type TabBarConfig,
    type TabBarOpacity,
} from "react-native-jelly-tabs";

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Keeps only the leaves of `value` that differ from `base`, in their nested
 * shape, so a copied `config` carries the knobs you moved and nothing else.
 * Returns `undefined` when nothing differs.
 */
const diffAgainst = (value: unknown, base: unknown): unknown => {
    if (!isPlainObject(value) || !isPlainObject(base)) {
        return Object.is(value, base) ? undefined : value;
    }

    const changed: PlainObject = {};
    for (const [key, nested] of Object.entries(value)) {
        const nestedDiff = diffAgainst(nested, base[key]);
        if (nestedDiff !== undefined) {
            changed[key] = nestedDiff;
        }
    }

    return Object.keys(changed).length > 0 ? changed : undefined;
};

const INDENT = "    ";

/** `quoteKeys` switches between a JS object literal and strict JSON. */
const formatValue = (
    value: unknown,
    depth: number,
    quoteKeys: boolean,
): string => {
    if (Array.isArray(value)) {
        const pad = INDENT.repeat(depth + 1);
        const entries = value.map(
            (entry) => `${pad}${formatValue(entry, depth + 1, quoteKeys)}`,
        );
        return `[\n${entries.join(",\n")}\n${INDENT.repeat(depth)}]`;
    }

    if (isPlainObject(value)) {
        const pad = INDENT.repeat(depth + 1);
        const entries = Object.entries(value).map(([key, nested]) => {
            const name = quoteKeys ? JSON.stringify(key) : key;
            return `${pad}${name}: ${formatValue(nested, depth + 1, quoteKeys)}`;
        });
        return `{\n${entries.join(",\n")}\n${INDENT.repeat(depth)}}`;
    }

    return JSON.stringify(value ?? null);
};

/** A `TabsItem` worth showing when a story customizes its badge. */
export interface SnippetItem {
    key: string;
    label: string;
    badge?: number | string;
    badgeStyle?: PlainObject;
    activeBadgeStyle?: PlainObject;
}

export interface SnippetInput {
    colors: TabBarColors;
    config?: DeepPartial<TabBarConfig>;
    opacity?: Partial<TabBarOpacity>;
    maxWidth?: number;
    touchFeedbackEnabled?: boolean;
    touchFeedbackColor?: string;
    touchFeedbackOpacity?: number;
    touchFeedbackScale?: number;
    /** Blur intensities behind the track and the pill, or `null` for no backdrop. */
    blur?: { track: number; pill: number } | null;
    item?: SnippetItem;
}

const DEFAULT_MAX_WIDTH = 400;

/**
 * The props a story is actually passing, minus everything left at its default.
 * `backdrop` / `selectedBackdrop` are React nodes and only appear in the JSX
 * form, where they can be written out as real JSX.
 */
const collectProps = (input: SnippetInput): PlainObject => {
    const props: PlainObject = { colors: input.colors };

    const config = diffAgainst(input.config ?? {}, DEFAULT_TAB_BAR_CONFIG);
    if (config !== undefined) {
        props.config = config;
    }

    const opacity = diffAgainst(input.opacity ?? {}, DEFAULT_TAB_BAR_OPACITY);
    if (opacity !== undefined) {
        props.opacity = opacity;
    }

    if (input.maxWidth !== undefined && input.maxWidth !== DEFAULT_MAX_WIDTH) {
        props.maxWidth = input.maxWidth;
    }
    if (input.touchFeedbackEnabled === false) {
        props.touchFeedbackEnabled = false;
    }
    if (input.touchFeedbackColor) {
        props.touchFeedbackColor = input.touchFeedbackColor;
    }
    const { opacity: defaultOpacity, scale: defaultScale } =
        DEFAULT_TAB_BAR_CONFIG.distortion.touchFeedback;
    if (
        input.touchFeedbackOpacity !== undefined &&
        input.touchFeedbackOpacity !== defaultOpacity
    ) {
        props.touchFeedbackOpacity = input.touchFeedbackOpacity;
    }
    if (
        input.touchFeedbackScale !== undefined &&
        input.touchFeedbackScale !== defaultScale
    ) {
        props.touchFeedbackScale = input.touchFeedbackScale;
    }

    return props;
};

const formatJsxProp = (name: string, value: unknown) => {
    if (typeof value === "string") {
        return `${INDENT}${name}=${JSON.stringify(value)}`;
    }
    if (isPlainObject(value)) {
        return `${INDENT}${name}={${formatValue(value, 1, false)}}`;
    }
    return `${INDENT}${name}={${String(value)}}`;
};

const toItemShape = (item: SnippetItem) => {
    const shape: PlainObject = {
        key: item.key,
        label: item.label,
    };
    if (item.badge !== undefined) {
        shape.badge = item.badge;
    }
    if (item.badgeStyle) {
        shape.badgeStyle = item.badgeStyle;
    }
    if (item.activeBadgeStyle) {
        shape.activeBadgeStyle = item.activeBadgeStyle;
    }

    return shape;
};

export const buildJsxSnippet = (input: SnippetInput) => {
    const lines = Object.entries(collectProps(input)).map(([name, value]) =>
        formatJsxProp(name, value),
    );

    if (input.blur) {
        lines.push(
            `${INDENT}backdrop={<BlurView intensity={${input.blur.track}} tint="dark" style={StyleSheet.absoluteFill} />}`,
            `${INDENT}selectedBackdrop={<BlurView intensity={${input.blur.pill}} tint="light" style={StyleSheet.absoluteFill} />}`,
        );
    }

    const element = `<JellyTabBar\n${INDENT}{...props}\n${lines.join("\n")}\n/>`;

    if (!input.item) {
        return element;
    }

    return [
        "// One of your items — icons omitted.",
        `const item = ${formatValue(toItemShape(input.item), 0, false)};`,
        "",
        element,
    ].join("\n");
};

export const buildJsonSnippet = (input: SnippetInput) => {
    const props = collectProps(input);

    if (input.item) {
        props.items = [toItemShape(input.item)];
    }

    return formatValue(props, 0, true);
};
