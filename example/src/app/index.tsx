import {
    ColorCustomizer,
    THEME_OPACITY,
    type BlurConfig,
} from "@/components/color-customizer";
import { GelatinButtons } from "@/components/gelatin-buttons";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image, type ImageSource } from "expo-image";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import {
    JellyTabBarHeadless,
    resolveTabBarConfig,
    type TabBarConfig,
    type TabBarColors,
    type TabBarOpacity,
    type TabsItem,
} from "react-native-jelly-tabs";
import { useRef, useState } from "react";
import {
    Dimensions,
    PixelRatio,
    Platform,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RECORDING_MODE =
    process.env.EXPO_PUBLIC_RECORDING_MODE === "1" ||
    process.env.EXPO_PUBLIC_RECORDING_MODE === "true";
const IS_WEB = Platform.OS === "web";
const HORIZONTAL_PADDING = 16;
const WEB_TAB_BAR_MAX_WIDTH = 400;
const LOCAL_BACKGROUND = require("../../assets/images/color-lab-background.png");
const randomBackground = (width: number, height: number): ImageSource => ({
    uri: `https://picsum.photos/${width}/${height}?random=${Math.floor(
        Math.random() * 1_000_000,
    )}`,
});
const randomBackgroundForScreen = (): ImageSource => {
    const { height, width } = Dimensions.get("window");
    const scale = PixelRatio.get();
    return randomBackground(
        Math.round(width * scale),
        Math.round(height * scale),
    );
};
const INITIAL_BLUR: BlurConfig = { pill: 20, track: 35 };
// Default look: same recipe as the "Amber" preset.
const INITIAL_COLORS: TabBarColors = {
    activeContent: "#451A03",
    inactiveContent: "#A8A29E",
    selectedSurface: "#F59E0B",
    surface: "#1C1917",
};
const INITIAL_TOUCH_FEEDBACK_COLOR = INITIAL_COLORS.selectedSurface;
const INITIAL_OPACITY: TabBarOpacity = { ...THEME_OPACITY };

const materialIcon =
    (name: React.ComponentProps<typeof MaterialIcons>["name"]): TabsItem["activeIcon"] =>
    ({ color, size }) =>
        <MaterialIcons color={color} name={name} size={size} />;

const ITEMS: TabsItem[] = [
    {
        key: "home",
        label: "Home",
        activeIcon: materialIcon("home"),
        inactiveIcon: materialIcon("home"),
    },
    {
        key: "camera",
        label: "Camera",
        activeIcon: materialIcon("photo-camera"),
        inactiveIcon: materialIcon("photo-camera"),
    },
    {
        key: "settings",
        label: "Settings",
        activeIcon: materialIcon("settings"),
        inactiveIcon: materialIcon("settings"),
    },
    {
        key: "walls",
        label: "Walls",
        activeIcon: materialIcon("format-paint"),
        inactiveIcon: materialIcon("format-paint"),
    },
];

export default function HomeScreen() {
    const { height, width } = useWindowDimensions();
    const blurTargetRef = useRef<View>(null);
    const [background, setBackground] = useState<ImageSource | number>(
        randomBackgroundForScreen,
    );
    const [blur, setBlur] = useState<BlurConfig>({ ...INITIAL_BLUR });
    const [colors, setColors] = useState<TabBarColors>({
        ...INITIAL_COLORS,
    });
    const [config, setConfig] = useState<TabBarConfig>(() =>
        resolveTabBarConfig(),
    );
    const [opacity, setOpacity] = useState<TabBarOpacity>({
        ...INITIAL_OPACITY,
    });
    const [touchFeedbackColor, setTouchFeedbackColor] = useState(
        INITIAL_TOUCH_FEEDBACK_COLOR,
    );
    const defaultTrackWidth = Math.max(0, width - HORIZONTAL_PADDING * 2);
    const recordingScale =
        defaultTrackWidth > 0
            ? Math.min(
                  height / defaultTrackWidth,
                  width / config.layout.trackHeight,
              )
            : 1;

    const shuffleBackground = () => {
        const scale = PixelRatio.get();
        setBackground(
            randomBackground(
                Math.round(width * scale),
                Math.round(height * scale),
            ),
        );
    };

    const resetCustomization = () => {
        setBackground(LOCAL_BACKGROUND);
        setBlur({ ...INITIAL_BLUR });
        setColors({ ...INITIAL_COLORS });
        setConfig(resolveTabBarConfig());
        setOpacity({ ...INITIAL_OPACITY });
        setTouchFeedbackColor(INITIAL_TOUCH_FEEDBACK_COLOR);
    };

    return (
        <View style={styles.root}>
            <StatusBar hidden={RECORDING_MODE} style="light" />
            <NavigationBar hidden={RECORDING_MODE} />
            <BlurTargetView ref={blurTargetRef} style={StyleSheet.absoluteFill}>
                <Image
                    contentFit="cover"
                    source={background}
                    style={StyleSheet.absoluteFill}
                    transition={300}
                />
            </BlurTargetView>
            <SafeAreaView
                edges={RECORDING_MODE ? [] : ["top", "bottom"]}
                style={styles.safeArea}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.screen,
                        RECORDING_MODE && styles.recordingScreen,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={!RECORDING_MODE}
                    showsVerticalScrollIndicator={false}
                >
                    {!RECORDING_MODE && (
                        <View
                            style={[
                                styles.customizerContainer,
                                IS_WEB && { maxHeight: height - 32 },
                            ]}
                        >
                            <ColorCustomizer
                                blur={blur}
                                colors={colors}
                                config={config}
                                onBlurChange={setBlur}
                                onColorsChange={setColors}
                                onConfigChange={setConfig}
                                onOpacityChange={setOpacity}
                                onReset={resetCustomization}
                                onShuffleBackground={shuffleBackground}
                                onTouchFeedbackColorChange={
                                    setTouchFeedbackColor
                                }
                                opacity={opacity}
                                touchFeedbackColor={touchFeedbackColor}
                            />
                        </View>
                    )}

                    {!RECORDING_MODE && (
                        <GelatinButtons
                            colors={colors}
                            touchFeedbackColor={touchFeedbackColor}
                        />
                    )}

                    <View
                        style={[
                            styles.tabsContainer,
                            { height: config.layout.trackHeight },
                            RECORDING_MODE && {
                                height:
                                    config.layout.trackHeight * recordingScale,
                                width: defaultTrackWidth * recordingScale,
                                transform: [{ rotate: "90deg" }],
                            },
                        ]}
                    >
                        <JellyTabBarHeadless
                            backdrop={
                                <BlurView
                                    blurMethod="dimezisBlurViewSdk31Plus"
                                    blurTarget={blurTargetRef}
                                    intensity={blur.track}
                                    style={StyleSheet.absoluteFill}
                                    tint="dark"
                                />
                            }
                            colors={colors}
                            config={config}
                            displayScale={RECORDING_MODE ? recordingScale : 1}
                            items={ITEMS}
                            onTabChange={({ item }) => {
                                console.info("Selected tab:", item.key);
                            }}
                            opacity={opacity}
                            recording={RECORDING_MODE}
                            selectedBackdrop={
                                <BlurView
                                    blurMethod="dimezisBlurViewSdk31Plus"
                                    blurTarget={blurTargetRef}
                                    intensity={blur.pill}
                                    style={StyleSheet.absoluteFill}
                                    tint="default"
                                />
                            }
                            touchFeedbackColor={touchFeedbackColor}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#11100f",
    },
    safeArea: {
        flex: 1,
    },
    screen: {
        alignItems: "center",
        flexGrow: 1,
        gap: 16,
        justifyContent: "space-between",
        paddingBottom: 12,
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 12,
        ...Platform.select({
            web: {
                justifyContent: "center",
            },
        }),
    },
    customizerContainer: {
        alignItems: "center",
        width: "100%",
        ...Platform.select({
            web: {
                alignItems: "stretch",
                overflow: "auto" as "scroll",
                position: "fixed" as "absolute",
                right: 16,
                top: 16,
                width: 360,
                zIndex: 10,
            },
        }),
    },
    recordingScreen: {
        justifyContent: "center",
        overflow: "hidden",
        paddingHorizontal: 0,
        paddingTop: 0,
    },
    tabsContainer: {
        width: "100%",
        ...Platform.select({
            web: {
                alignSelf: "center",
                maxWidth: WEB_TAB_BAR_MAX_WIDTH,
            },
        }),
    },
});
