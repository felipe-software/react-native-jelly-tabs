import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./StorybookPreview.module.css";

export interface StorybookPreviewProps {
    /** Story id, e.g. `customization-theming--palette`. */
    id: string;
    /** Iframe height in pixels. */
    height?: number;
    /** Optional encoded Storybook args, e.g. `blurTrack:80;blurPill:60`. */
    args?: string;
}

/**
 * Embeds a live Storybook story (built into `static/storybook`) as an
 * interactive preview. The same story powers the Storybook explorer.
 */
export default function StorybookPreview({
    id,
    height = 380,
    args,
}: StorybookPreviewProps) {
    const iframeBase = useBaseUrl("/storybook/iframe.html");
    const query =
        `id=${encodeURIComponent(id)}&viewMode=story` +
        (args ? `&args=${encodeURIComponent(args)}` : "");

    return (
        <div className={styles.wrap}>
            <iframe
                title={id}
                className={styles.frame}
                src={`${iframeBase}?${query}`}
                style={{ height }}
                loading="lazy"
                allow="clipboard-write"
            />
            <div className={styles.footer}>
                <Link
                    className={styles.open}
                    to={`pathname:///storybook/index.html?path=/story/${id}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Open in Storybook ↗
                </Link>
            </div>
        </div>
    );
}
