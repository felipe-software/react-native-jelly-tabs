import { useEffect, useState, type CSSProperties } from "react";
import {
    buildJsonSnippet,
    buildJsxSnippet,
    type SnippetInput,
} from "./props-snippet";

type Format = "jsx" | "json";

const copyText = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Clipboard API needs a secure context; fall back to a throwaway
        // textarea so the button still works over plain http.
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
    }
};

/**
 * Floating "copy the props behind this preview" control. Renders the same
 * snippet in two shapes: pasteable JSX, or the plain config object.
 */
export const CopyPropsPanel = ({ input }: { input: SnippetInput }) => {
    const [format, setFormat] = useState<Format>("jsx");
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const snippet =
        format === "jsx" ? buildJsxSnippet(input) : buildJsonSnippet(input);

    useEffect(() => {
        if (!copied) {
            return;
        }

        const timeout = setTimeout(() => setCopied(false), 1600);
        return () => clearTimeout(timeout);
    }, [copied]);

    return (
        <div style={styles.root}>
            <div style={styles.bar}>
                <div style={styles.segmented}>
                    {(["jsx", "json"] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            style={{
                                ...styles.segment,
                                ...(format === value
                                    ? styles.segmentActive
                                    : null),
                            }}
                            onClick={() => setFormat(value)}
                        >
                            {value.toUpperCase()}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    style={styles.action}
                    onClick={async () => setCopied(await copyText(snippet))}
                >
                    {copied ? "Copied ✓" : "Copy props"}
                </button>
                <button
                    aria-label={expanded ? "Hide snippet" : "Show snippet"}
                    type="button"
                    style={styles.action}
                    onClick={() => setExpanded((open) => !open)}
                >
                    {expanded ? "Hide" : "Show"}
                </button>
            </div>
            {expanded && <pre style={styles.code}>{snippet}</pre>}
        </div>
    );
};

const styles = {
    root: {
        position: "absolute",
        top: 12,
        right: 12,
        left: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        zIndex: 5,
        // Only the controls themselves should intercept the pointer; the rest
        // of the strip must stay transparent to the tab bar's drag gesture.
        pointerEvents: "none",
        fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    },
    bar: {
        display: "flex",
        alignItems: "center",
        pointerEvents: "auto",
        gap: 6,
        padding: 4,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(17,16,15,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
    },
    segmented: {
        display: "flex",
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
    },
    segment: {
        appearance: "none",
        border: 0,
        background: "transparent",
        color: "rgba(250,250,249,0.55)",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.6,
        padding: "5px 9px",
    },
    segmentActive: {
        background: "#F59E0B",
        color: "#1C1917",
    },
    action: {
        appearance: "none",
        border: 0,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        color: "#FAFAF9",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 600,
        padding: "6px 12px",
        whiteSpace: "nowrap",
    },
    code: {
        margin: 0,
        maxHeight: 220,
        overflow: "auto",
        pointerEvents: "auto",
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(12,11,10,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#E7E5E4",
        fontSize: 11,
        lineHeight: 1.55,
        textAlign: "left",
        whiteSpace: "pre",
    },
} satisfies Record<string, CSSProperties>;
