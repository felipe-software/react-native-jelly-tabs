import { NativeTabBar } from "./native-tab-bar";
import { ReanimatedTabBar } from "./reanimated-tab-bar";
import type { JellyTabBarHeadlessProps } from "../types";
import { Platform } from "react-native";

export const JellyTabBarHeadless = (props: JellyTabBarHeadlessProps) =>
    Platform.OS === "android" ? (
        <NativeTabBar {...props} />
    ) : (
        <ReanimatedTabBar {...props} />
    );

/** @deprecated Use JellyTabBarHeadless instead. */
export const JellyTabs = JellyTabBarHeadless;
