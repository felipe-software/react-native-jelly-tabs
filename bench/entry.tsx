import { registerRootComponent } from "expo";
import * as SplashScreen from "expo-splash-screen";
import { type ComponentType, useEffect, useState } from "react";
import { Linking, StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    Easing,
    type SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Gallery } from "./gallery";
import { ICONS, LABELS } from "./icons";

type BarProps = {
    onSelect: (index: number) => void;
    selectedIndex: number;
};

type PageProps = {
    color: string;
    index: number;
    position: SharedValue<number>;
};

const COLORS = {
    activeContent: "#451A03",
    inactiveContent: "#A8A29E",
    selectedSurface: "#F59E0B",
    surface: "#1C1917",
};
const PAGE_COLORS = ["#FBF5F6", "#F1EDF7", "#EEF6F1", "#F7F3EA"];
const PAGE_TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

function svgIcon(path: string) {
    return function BarIcon({ color, size }: { color: string; size: number }) {
        return (
            <Svg fill={color} height={size} viewBox="0 0 24 24" width={size}>
                <Path d={path} />
            </Svg>
        );
    };
}

function loadLegacyBar(): ComponentType<BarProps> {
    const { JellyTabBarHeadless } = require("./.legacy/src");
    const items = LABELS.map((label, index) => ({
        accessibilityLabel: label,
        activeIcon: svgIcon(ICONS[index]),
        inactiveIcon: svgIcon(ICONS[index]),
        key: label,
        label,
        testID: `tab-${index}`,
    }));

    return function LegacyBar({ onSelect, selectedIndex }) {
        return (
            <JellyTabBarHeadless
                colors={COLORS}
                items={items}
                maxWidth={10_000}
                onTabPress={({ index }: { index: number }) => {
                    onSelect(index);
                    return true;
                }}
                selectedIndex={selectedIndex}
            />
        );
    };
}

function loadNativeBar(): ComponentType<BarProps> {
    const {
        JellyTabBarHeadless,
        pathIcon,
    } = require("react-native-jelly-tabs");
    const items = LABELS.map((label, index) => {
        const icon = pathIcon(ICONS[index]);
        return {
            accessibilityLabel: label,
            activeIcon: icon,
            inactiveIcon: icon,
            key: label,
            label,
            testID: `tab-${index}`,
        };
    });

    return function NativeBar({ onSelect, selectedIndex }) {
        return (
            <JellyTabBarHeadless
                colors={COLORS}
                items={items}
                maxWidth={10_000}
                onTabPress={({ index }: { index: number }) => {
                    onSelect(index);
                    return true;
                }}
                selectedIndex={selectedIndex}
            />
        );
    };
}

const BARS: Record<string, () => ComponentType<BarProps>> = {
    legacy: loadLegacyBar,
    native: loadNativeBar,
};

function Page({ color, index, position }: PageProps) {
    const { width } = useWindowDimensions();
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: (index - position.get()) * width }],
    }));

    return (
        <Animated.View
            style={[styles.page, { backgroundColor: color }, animatedStyle]}
        />
    );
}

function Bench({ Bar }: { Bar: ComponentType<BarProps> }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const position = useSharedValue(0);

    useEffect(() => {
        position.set(withTiming(selectedIndex, PAGE_TIMING));
    }, [position, selectedIndex]);

    return (
        <GestureHandlerRootView style={styles.root}>
            {PAGE_COLORS.map((color, index) => (
                <Page
                    color={color}
                    index={index}
                    key={color}
                    position={position}
                />
            ))}
            <View pointerEvents="box-none" style={styles.track}>
                <Bar
                    onSelect={setSelectedIndex}
                    selectedIndex={selectedIndex}
                />
            </View>
        </GestureHandlerRootView>
    );
}

function readParam(url: string | null, name: string) {
    return url?.match(new RegExp(`[?&]${name}=([a-z]+)`))?.[1];
}

function BenchRoot() {
    const [url, setUrl] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        void Linking.getInitialURL().then((initialUrl) => {
            setUrl(initialUrl);
            SplashScreen.hide();
        });
    }, []);

    if (url === undefined) {
        return <View style={styles.root} />;
    }
    if (readParam(url, "scene") === "gallery") {
        return (
            <GestureHandlerRootView style={styles.root}>
                <Gallery />
            </GestureHandlerRootView>
        );
    }

    const Bar = (BARS[readParam(url, "bar") ?? "legacy"] ?? loadLegacyBar)();
    return <Bench Bar={Bar} />;
}

registerRootComponent(BenchRoot);

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: PAGE_COLORS[0],
    },
    page: {
        ...StyleSheet.absoluteFill,
    },
    track: {
        position: "absolute",
        bottom: 96,
        height: 64,
        left: 16,
        right: 16,
    },
});
