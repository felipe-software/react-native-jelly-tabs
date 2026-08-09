import { sharedStyles } from "./shared";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export interface SurfaceLayerProps {
    backdrop: ReactNode;
    color: string;
    opacity: number;
    radius: number;
}

export const SurfaceLayer = ({
    backdrop,
    color,
    opacity,
    radius,
}: SurfaceLayerProps) => (
    <View style={[sharedStyles.clip, { borderRadius: radius }]}>
        {backdrop}
        <View
            style={[
                StyleSheet.absoluteFill,
                { backgroundColor: color, opacity },
            ]}
        />
    </View>
);
