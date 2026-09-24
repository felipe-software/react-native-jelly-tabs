import { Platform } from "react-native";

/**
 * Whether the pill is clipped by a statically sized rounded box (moved with
 * transforms only, with the content counter-transformed so it stays anchored to
 * the track) instead of by a `MaskedView`.
 *
 * Web has no `MaskedView` implementation at all, so it always took this path.
 * Android joins it because the community `MaskedView` re-rasterises its mask
 * element into a freshly allocated `ARGB_8888` bitmap inside `dispatchDraw`, on
 * the UI thread, every time the mask invalidates — which for an animated mask
 * means every single frame.
 *
 * iOS stays on `MaskedView`: there the mask is a `CALayer.mask` applied by the
 * compositor, so it never touches the CPU per frame.
 */
const computeUsesClipBox = () =>
    Platform.OS === "web" || Platform.OS === "android";

const computeIsWeb = () => Platform.OS === "web";

/**
 * Render-time checks. These re-read `Platform` on every call, which costs
 * nothing outside the frame loop and lets the test suite swap platforms between
 * cases without reloading the module graph.
 */
export const usesClipBox = computeUsesClipBox;
export const isWeb = computeIsWeb;

/**
 * The same answers frozen at module load, for use *inside worklets*. A worklet
 * captures the plain values it closes over, so these have to be booleans rather
 * than calls — and the platform never changes at runtime in a real app.
 */
export const USES_CLIP_BOX = computeUsesClipBox();
export const IS_WEB = computeIsWeb();
