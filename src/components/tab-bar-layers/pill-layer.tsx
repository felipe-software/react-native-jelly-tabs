import {
    type AnimatedViewStyle,
    cloneTabs,
    type TabBarGeometry,
    type TabElements,
    type TouchFeedbackVisuals,
} from "./shared";
import { PillMaskedView } from "../pill-masked-view";
import { TouchFeedback } from "../touch-feedback";
import { getTabWidth } from "../../utils/animation";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export interface PillLayerProps {
    activeItemStyle: AnimatedViewStyle;
    clipStyle: AnimatedViewStyle;
    contentStyle: AnimatedViewStyle;
    geometry: TabBarGeometry;
    maskStyle: AnimatedViewStyle;
    selectedBackdrop: ReactNode;
    selectedSurfaceColor: string;
    selectedSurfaceOpacity: number;
    tabCount: number;
    tabs: TabElements;
    touchFeedback?: TouchFeedbackVisuals;
    touchFeedbackStyle: AnimatedViewStyle;
    visible: boolean;
    webTrackWidth: number;
}

export const PillLayer = ({
    activeItemStyle,
    clipStyle,
    contentStyle,
    geometry,
    maskStyle,
    selectedBackdrop,
    selectedSurfaceColor,
    selectedSurfaceOpacity,
    tabCount,
    tabs,
    touchFeedback,
    touchFeedbackStyle,
    visible,
    webTrackWidth,
}: PillLayerProps) => {
    const { itemHeight, maskOverscanX, maskOverscanY, trackHeight, trackInset } =
        geometry;
    const contentLeft = maskOverscanX + trackInset;
    const contentTop = maskOverscanY + trackInset;

    return (
        <View
            style={[
                styles.maskOverscan,
                {
                    bottom: -maskOverscanY,
                    left: -maskOverscanX,
                    right: -maskOverscanX,
                    top: -maskOverscanY,
                },
                !visible && styles.hidden,
            ]}
        >
            <PillMaskedView
                animatedStyle={maskStyle}
                clipStyle={clipStyle}
                contentHeight={trackHeight + maskOverscanY * 2}
                contentStyle={contentStyle}
                contentWidth={webTrackWidth + maskOverscanX * 2}
                height={itemHeight}
                left={contentLeft}
                tabWidth={getTabWidth(webTrackWidth, trackInset, tabCount)}
                top={contentTop}
            >
                <View style={StyleSheet.absoluteFill}>
                    {selectedBackdrop}
                    <View
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: selectedSurfaceColor,
                                opacity: selectedSurfaceOpacity,
                            },
                        ]}
                    />
                </View>

                {touchFeedback && (
                    <TouchFeedback
                        {...touchFeedback}
                        animatedStyle={touchFeedbackStyle}
                        gradientId="selected-tab-touch-feedback"
                        offsetX={maskOverscanX}
                        offsetY={maskOverscanY}
                    />
                )}

                <View
                    style={[
                        styles.selectedTabsRow,
                        {
                            height: itemHeight,
                            left: contentLeft,
                            right: contentLeft,
                            top: contentTop,
                        },
                    ]}
                >
                    {cloneTabs(tabs, "active", activeItemStyle)}
                </View>
            </PillMaskedView>
        </View>
    );
};

const styles = StyleSheet.create({
    maskOverscan: {
        position: "absolute",
        zIndex: 2,
    },
    hidden: {
        display: "none",
    },
    selectedTabsRow: {
        position: "absolute",
        alignItems: "center",
        flexDirection: "row",
        zIndex: 1,
    },
});
