import type { JellyIconSource } from "../icons";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface IconSourceProps {
    color: string;
    size: number;
    source: JellyIconSource;
}

export const IconSource = ({ color, size, source }: IconSourceProps) => {
    if (source.kind === "path") {
        return (
            <Svg
                height={size}
                viewBox={`0 0 ${source.viewBox} ${source.viewBox}`}
                width={size}
            >
                <Path d={source.path} fill={color} />
            </Svg>
        );
    }

    return (
        <View style={[styles.glyphBox, { height: size, width: size }]}>
            <Text
                allowFontScaling={false}
                selectable={false}
                style={[
                    styles.glyph,
                    { color, fontFamily: source.fontFamily, fontSize: size },
                ]}
            >
                {source.glyph}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    glyphBox: {
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    },
    glyph: {
        fontStyle: "normal",
        fontWeight: "normal",
        textAlign: "center",
    },
});
