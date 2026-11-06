import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import glyphMap from "@react-native-vector-icons/material-icons/glyphmaps/MaterialIcons.json";
import { type ReactNode, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
    glyphIcon,
    JellyTabBar,
    JellyTabBarHeadless,
    pathIcon,
    type TabsItem,
} from "react-native-jelly-tabs";

import { ICONS, LABELS } from "./icons";

type GlyphName = keyof typeof glyphMap;

const materialIcon =
    (name: GlyphName): TabsItem["activeIcon"] =>
    ({ color, size }) => (
        <MaterialIcons color={color} name={name} size={size} />
    );

const glyph = (name: GlyphName, inactive?: GlyphName) =>
    glyphIcon("MaterialIcons", glyphMap[name], {
        inactiveGlyph: inactive === undefined ? undefined : glyphMap[inactive],
    });

const REACT_ITEMS: TabsItem[] = [
    {
        activeIcon: materialIcon("home"),
        inactiveIcon: materialIcon("home"),
        key: "home",
        label: "Home",
    },
    {
        activeIcon: materialIcon("search"),
        badge: 3,
        badgeStyle: { backgroundColor: "#F59E0B", color: "#451A03" },
        inactiveIcon: materialIcon("search"),
        key: "search",
        label: "Search",
    },
    {
        activeBadgeStyle: { backgroundColor: "#451A03", color: "#F59E0B" },
        activeIcon: materialIcon("person"),
        badge: "9+",
        inactiveIcon: materialIcon("person"),
        key: "profile",
        label: "Profile",
    },
];

const PATH_ITEMS: TabsItem[] = LABELS.map((label, index) => ({
    activeIcon: pathIcon(ICONS[index]),
    inactiveIcon: pathIcon(ICONS[index]),
    key: label,
    label,
    labelStyle: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
}));

const GLYPH_ITEMS: TabsItem[] = [
    {
        activeIcon: glyph("home"),
        inactiveIcon: glyph("home"),
        key: "home",
        label: "Home",
    },
    {
        activeIcon: glyph("favorite"),
        inactiveIcon: glyph("favorite-border"),
        key: "likes",
        label: "Likes",
    },
    {
        activeIcon: glyph("notifications"),
        inactiveIcon: glyph("notifications"),
        key: "alerts",
        label: "Alerts",
    },
    {
        activeIcon: glyph("settings"),
        inactiveIcon: glyph("settings"),
        key: "settings",
        label: "",
    },
];

const STRIPES = ["#2563EB", "#DB2777", "#16A34A", "#F59E0B"];

const Stripes = ({ reverse = false }: { reverse?: boolean }) => (
    <View style={[StyleSheet.absoluteFill, styles.stripes]}>
        {(reverse ? [...STRIPES].reverse() : STRIPES).map((color) => (
            <View
                key={color}
                style={[styles.stripe, { backgroundColor: color }]}
            />
        ))}
    </View>
);

const NAVIGATION_ROUTES = [
    { key: "home-key", name: "home" },
    { key: "search-key", name: "search" },
    { key: "hidden-key", name: "hidden" },
    { key: "profile-key", name: "profile" },
];

const NAVIGATION_DESCRIPTORS = {
    "hidden-key": { options: { href: null, title: "Hidden" } },
    "home-key": { options: { tabBarIcon: pathIcon(ICONS[0]), title: "Home" } },
    "profile-key": {
        options: { tabBarIcon: glyph("person"), title: "Profile" },
    },
    "search-key": {
        options: {
            tabBarBadge: 3,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <MaterialIcons color={color} name="search" size={size} />
            ),
            title: "Search",
        },
    },
};

const Section = ({
    children,
    title,
}: {
    children: ReactNode;
    title: string;
}) => (
    <View style={styles.section}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.bar}>{children}</View>
    </View>
);

export function Gallery() {
    const [log, setLog] = useState("ready");
    const [pathIndex, setPathIndex] = useState(0);
    const [nullableIndex, setNullableIndex] = useState<number | null>(null);
    const [routeIndex, setRouteIndex] = useState(0);
    const navigation = {
        dispatch: (action: { payload: { name: string } }) => {
            setRouteIndex(
                NAVIGATION_ROUTES.findIndex(
                    (route) => route.name === action.payload.name,
                ),
            );
        },
        emit: (event: { target: string; type: string }) => {
            setLog(`${event.type} ${event.target}`);
            return { defaultPrevented: false };
        },
    };

    return (
        <ScrollView contentContainerStyle={styles.screen}>
            <Text style={styles.log} testID="gallery-log">
                {log}
            </Text>

            <Section title="React icons + badges">
                <JellyTabBarHeadless
                    items={REACT_ITEMS}
                    onTabChange={({ item }) => setLog(`change ${item.key}`)}
                />
            </Section>

            <Section title="Path icons + label style + veto (Walls)">
                <JellyTabBarHeadless
                    colors={{
                        activeContent: "#F8FAFC",
                        inactiveContent: "#64748B",
                        selectedSurface: "#2563EB",
                        surface: "#E2E8F0",
                    }}
                    items={PATH_ITEMS}
                    onTabPress={({ index, item }) => {
                        if (item.key === "Walls") {
                            setLog("rejected Walls");
                            return false;
                        }
                        setPathIndex(index);
                        setLog(`press ${item.key}`);
                        return true;
                    }}
                    selectedIndex={pathIndex}
                />
            </Section>

            <Section title="Glyph icons + long press + no feedback">
                <JellyTabBarHeadless
                    colors={{
                        activeContent: "#FFFFFF",
                        inactiveContent: "#FBCFE8",
                        selectedSurface: "#DB2777",
                        surface: "#500724",
                    }}
                    items={GLYPH_ITEMS}
                    onTabLongPress={({ item }) =>
                        setLog(`long press ${item.key}`)
                    }
                    opacity={{ inactiveContent: 0.7 }}
                    touchFeedbackEnabled={false}
                />
            </Section>

            <Section title="Backdrops + translucent surfaces">
                <JellyTabBarHeadless
                    backdrop={<Stripes />}
                    items={GLYPH_ITEMS.slice(0, 3)}
                    opacity={{ selectedSurface: 0.55, surface: 0.35 }}
                    selectedBackdrop={<Stripes reverse />}
                />
            </Section>

            <Section title="No selection + displayScale 0.8">
                <JellyTabBarHeadless
                    displayScale={0.8}
                    items={PATH_ITEMS.slice(0, 3)}
                    onTabPress={({ index }) => {
                        setNullableIndex(index);
                        return true;
                    }}
                    selectedIndex={nullableIndex}
                />
            </Section>

            <Section title="Navigation adapter (hidden route)">
                <JellyTabBar
                    containerStyle={styles.navigation}
                    descriptors={NAVIGATION_DESCRIPTORS}
                    insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
                    navigation={navigation}
                    state={{
                        index: routeIndex,
                        key: "tabs",
                        routes: NAVIGATION_ROUTES,
                    }}
                />
            </Section>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bar: {
        height: 64,
        justifyContent: "center",
    },
    log: {
        color: "#E7E5E4",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    navigation: {
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0,
    },
    screen: {
        backgroundColor: "#11100F",
        gap: 10,
        paddingBottom: 120,
        paddingHorizontal: 16,
        paddingTop: 56,
    },
    section: {
        gap: 4,
    },
    stripe: {
        flex: 1,
    },
    stripes: {
        flexDirection: "row",
    },
    title: {
        color: "#A8A29E",
        fontSize: 12,
    },
});
