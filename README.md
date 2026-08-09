# react-native-jelly-tabs

[![npm version](https://img.shields.io/npm/v/react-native-jelly-tabs?style=flat-square)](https://www.npmjs.com/package/react-native-jelly-tabs)  [![license](https://img.shields.io/npm/l/react-native-jelly-tabs?style=flat-square)](https://www.npmjs.com/package/react-native-jelly-tabs)
[![React Native >=0.76](https://img.shields.io/badge/React%20Native-%3E%3D0.76-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev/) [![Reanimated 3–4](https://img.shields.io/badge/Reanimated-3%20%E2%80%93%204-8A2BE2?style=flat-square)](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) [![Gesture Handler 2–3](https://img.shields.io/badge/Gesture%20Handler-2%20%E2%80%93%203-005BBB?style=flat-square)](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation/) [![Runs with Expo](https://img.shields.io/badge/Runs%20with%20Expo-4630EB?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/) [![Expo Router](https://img.shields.io/badge/Expo%20Router-compatible-000020?style=flat-square&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)<br>
[![Platforms: Android, iOS and Web](https://img.shields.io/badge/platforms-Android%20%7C%20iOS%20%7C%20Web-34A853?style=flat-square)](#features) 

A jelly-like animated tab bar for React Native, built with Reanimated, Gesture Handler and Masked View

<video src="https://github.com/user-attachments/assets/51101532-fdac-44bb-9ad0-e75f9c3b0171" autoplay muted controls></video>

Demo at: https://jelly.felipe.software/

Docs at: https://jelly-docs.felipe.software

> Still under development. Supports Android, iOS and React Native Web.

## Features

- ⭐️ Runs on Android, iOS and React Native Web.
- ⭐️ Drop-in integration with Expo Router and React Navigation bottom tabs.
- ⭐️ Compatible with Expo and bare React Native projects.
- Smooth jelly snapping, dragging and press interactions powered by Reanimated and Gesture Handler.
- Navigation-aware selection that follows deep links, hardware back and programmatic navigation.
- Expo Router hidden tabs through `href: null`, including hidden focused routes with no false selection.
- Per-tab accessibility semantics for VoiceOver and TalkBack, including selected state and activation actions.
- Navigation badges, test IDs, accessibility labels, label styles and `tabLongPress` events.
- Badges that can restyle themselves as the pill wipes over them (`activeBadgeStyle`).
- Headless component for custom routers and fully controlled tab state.
- Custom icons, colors, opacity, sizing, springs, distortion, backdrops and touch feedback.
- Compatible with Reanimated 3–4 and Gesture Handler 2–3 within the supported React Native ranges below.
- Written in TypeScript with bundled type declarations.

## Installation

```sh
npm install react-native-jelly-tabs
```

##### Dependencies

Using Expo install
```sh
npx expo install @react-native-masked-view/masked-view react-native-gesture-handler react-native-reanimated react-native-svg
```

Without expo install
```sh
npm install @react-native-masked-view/masked-view react-native-gesture-handler react-native-reanimated react-native-svg
``` 


Then rebuild the native app — `npx expo prebuild` on Expo, or `pod install` + a fresh build on bare React Native. Aside from that command, Expo and bare React Native are identical here.

<details>
<summary>Reanimated & Gesture Handler setup</summary> 

**React Native Gesture Handler v2** needs extra steps to finalize its [installation instructions](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation). 
Please **make sure** to wrap your App with `GestureHandlerRootView` when you've upgraded to React Native Gesture Handler ^2.

**React Native Reanimated v3** needs extra steps to finalize its installation: [installation instructions](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started).
</details>

### Compatible versions

Jelly Tabs works across a couple of major versions of each native dependency, so you can match whatever your app already uses:

| Package | Supported range |
| --- | --- |
| React Native | `>=0.76` |
| Gesture Handler | `>=2.25 <4` (Gesture Handler 3 needs React Native `>=0.82`) |
| Reanimated | `>=3.16 <5` |

## Usage with Expo Router or React Navigation

```tsx
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { Tabs } from "expo-router";
import { JellyTabBar } from "react-native-jelly-tabs";

export default function TabLayout() {
    return (
        <Tabs tabBar={(props) => <JellyTabBar {...props} floating />}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons color={color} name="home" size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons color={color} name="settings" size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
```

`JellyTabBar` is compatible with the `tabBar` prop from Expo Router's JavaScript tabs and React Navigation's bottom tabs. 

Pass `floating` to position the bar over the screen instead of reserving layout space. The screen will then fill behind the bar. Scrollable screens should add enough bottom content padding for their last item to remain reachable above the floating bar.

### Router-independent component

Use `JellyTabBarHeadless` when you want the animated component without any navigation integration:

```tsx
<JellyTabBarHeadless
    items={items}
    selectedIndex={selectedIndex}
    onTabPress={({ index }) => setSelectedIndex(index)}
/>
```

Each item takes an `activeIcon` and an `inactiveIcon` render function. 

`JellyTabBarHeadless` adds no safe-area inset of its own. Give it a wrapper whose height matches `config.layout.trackHeight` (default `64`) times `displayScale`. 

Colors, opacity, layout, jelly springs, distortion, backdrops, badges and the touch-feedback gradient are all configurable.

## Documentation

**https://jelly-docs.felipe.software** — guides and live, interactive previews. Every
example is a real Storybook story rendered through React Native Web, so what you read is
what runs, and each preview has a **Copy props** button that hands you the current setup
as JSX or as a plain config object.

**[PROPS.md](./PROPS.md)** is the flat reference: every prop, type and default in one file.

The site lives in [`docs/`](./docs) (Docusaurus) and the stories in [`storybook/`](./storybook).

```sh
bun run docs:previews   # build Storybook into docs/static/storybook
bun run docs            # start the docs site (previews must be built first)
bun run storybook       # open Storybook on its own (port 7007)
bun run docs:build      # full static build (previews + docs) → docs/build
```

`docs/build` is a plain static bundle, ready to deploy to Cloudflare Workers
(see [`docs/wrangler.jsonc`](./docs/wrangler.jsonc)).

## Development

The reusable package lives in `src/`. The Expo playground, generated background, and color laboratory live in `example/`.

```sh
bun install
bun run build
bun run example:web
```

Other useful commands:

```sh
bun run dev
bun run typecheck
bun run example:android
bun run example:ios
```

Don't be afraid to open issues or Pull Requests, especially for documentation! :)
