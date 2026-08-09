/**
 * Elastic drag math ported from the Gelatin SwiftUI package
 * (https://github.com/Polarizz/Gelatin).
 *
 * A drag is first flattened by a power easing so the view lags far behind the
 * finger, and that eased distance then drives both how far the view travels and
 * how much it stretches along each axis.
 */

export interface GelatinDragConfig {
    /** Eased distance (px) that produces the full stretch. */
    distanceForMaxStretch: number;
    /** Exponent applied to the raw drag distance. Lower means more gradual. */
    easingExponent: number;
    /** Scales the eased offset without touching the stretch. */
    follow: number;
    /** Stretch added at full deformation, before amplification. */
    maxStretch: number;
    /**
     * How far the transform origin slides to the trailing edge, so the surface
     * grows towards the finger instead of both ways. `0` always scales about
     * the centre, `1` pins the edge you are dragging away from.
     */
    stretchAnchor: number;
    /** Multiplier that amplifies the stretch. */
    stretchAmplification: number;
}

export interface GelatinTransform {
    offsetX: number;
    offsetY: number;
    /** Transform origin as a fraction of the view's width. `0.5` is centred. */
    originX: number;
    /** Transform origin as a fraction of the view's height. */
    originY: number;
    scaleX: number;
    scaleY: number;
}

/**
 * Flattens a raw drag distance with a signed power curve, so the first pixels
 * move the view a lot and later ones barely at all.
 */
export const applyElasticEasing = (distance: number, exponent: number) => {
    "worklet";

    if (distance === 0) {
        return 0;
    }

    return Math.sign(distance) * Math.pow(Math.abs(distance), exponent);
};

/** Turns an eased distance into a scale factor (1 = no stretch). */
export const getStretchFactor = (
    easedDistance: number,
    config: GelatinDragConfig,
) => {
    "worklet";

    if (config.distanceForMaxStretch <= 0) {
        return 1;
    }

    const progress = Math.min(
        Math.abs(easedDistance) / config.distanceForMaxStretch,
        1,
    );

    return 1 + config.maxStretch * progress * config.stretchAmplification;
};

/**
 * Where the stretch should grow from, as a fraction of the view's size.
 *
 * Scaling about the centre pushes a view out both ways, which reads as the
 * surface inflating rather than being pulled. Anchoring the origin on the
 * trailing edge instead keeps that edge still, so the whole deformation
 * travels towards the finger.
 *
 * Unlike the stretch, this ramps over the **raw** drag distance: direction has
 * to read immediately, and the eased distance saturates so slowly that the
 * origin would still be near the centre after a very long drag.
 */
export const getStretchOrigin = (
    distance: number,
    config: GelatinDragConfig,
) => {
    "worklet";

    if (config.distanceForMaxStretch <= 0) {
        return 0.5;
    }

    const progress = Math.max(
        -1,
        Math.min(distance / config.distanceForMaxStretch, 1),
    );

    return 0.5 - 0.5 * progress * config.stretchAnchor;
};

/**
 * The whole deformation for one drag sample. `follow` only moves the view;
 * the stretch always comes from the unscaled eased distance so the two can be
 * tuned independently.
 */
export const getGelatinTransform = (
    translationX: number,
    translationY: number,
    config: GelatinDragConfig,
): GelatinTransform => {
    "worklet";

    const easedX = applyElasticEasing(translationX, config.easingExponent);
    const easedY = applyElasticEasing(translationY, config.easingExponent);

    return {
        offsetX: easedX * config.follow,
        offsetY: easedY * config.follow,
        originX: getStretchOrigin(translationX, config),
        originY: getStretchOrigin(translationY, config),
        scaleX: getStretchFactor(easedX, config),
        scaleY: getStretchFactor(easedY, config),
    };
};
