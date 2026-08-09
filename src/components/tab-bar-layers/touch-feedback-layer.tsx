import {
    type AnimatedViewStyle,
    sharedStyles,
    type TouchFeedbackVisuals,
} from "./shared";
import { TouchFeedback } from "../touch-feedback";
import { View } from "react-native";

export interface TouchFeedbackLayerProps {
    animatedStyle: AnimatedViewStyle;
    radius: number;
    visuals: TouchFeedbackVisuals;
}

export const TouchFeedbackLayer = ({
    animatedStyle,
    radius,
    visuals,
}: TouchFeedbackLayerProps) => (
    <View style={[sharedStyles.clip, { borderRadius: radius }]}>
        <TouchFeedback
            {...visuals}
            animatedStyle={animatedStyle}
            gradientId="tabbar-touch-feedback"
        />
    </View>
);
