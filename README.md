# react-native-jelly-tabs

[![npm version](https://img.shields.io/npm/v/react-native-jelly-tabs?style=flat-square)](https://www.npmjs.com/package/react-native-jelly-tabs)  [![license](https://img.shields.io/npm/l/react-native-jelly-tabs?style=flat-square)](https://www.npmjs.com/package/react-native-jelly-tabs)
[![React Native >=0.76](https://img.shields.io/badge/React%20Native-%3E%3D0.76-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev/) [![Reanimated 3–4](https://img.shields.io/badge/Reanimated-3%20%E2%80%93%204-8A2BE2?style=flat-square)](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) [![Gesture Handler 2–3](https://img.shields.io/badge/Gesture%20Handler-2%20%E2%80%93%203-005BBB?style=flat-square)](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation/) [![Runs with Expo](https://img.shields.io/badge/Runs%20with%20Expo-4630EB?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/) [![Expo Router](https://img.shields.io/badge/Expo%20Router-compatible-000020?style=flat-square&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)<br>
[![Platforms: Android, iOS and Web](https://img.shields.io/badge/platforms-Android%20%7C%20iOS%20%7C%20Web-34A853?style=flat-square)](#features) 

A jelly-like animated tab bar for React Native. On Android it renders natively (Kotlin, through an Expo module); on iOS and the web it is built with Reanimated, Gesture Handler and Masked View.

<video src="https://github.com/user-attachments/assets/51101532-fdac-44bb-9ad0-e75f9c3b0171" autoplay muted controls></video>

Demo at: https://jelly.felipe.software/

Docs at: https://jelly-docs.felipe.software

> Still under development. Supports Android, iOS and React Native Web.

## Features

- ⭐️ Runs on Android, iOS and React Native Web.
- ⭐️ Drop-in integration with Expo Router and React Navigation bottom tabs.
- ⭐️ Compatible with Expo and bare React Native projects (bare projects need Expo Modules).
- ⭐️ Native Android renderer: the jelly springs, touch handling and drawing run in Kotlin, off the JavaScript and Reanimated pipelines.
- Smooth jelly snapping, dragging and press interactions powered by Reanimated and Gesture Handler.
- Navigation-aware selection that follows deep links, hardware back and programmatic navigation.
- Expo Router hidden tabs through `href: null`, including hidden focused routes with no false selection.
- Per-tab accessibility semantics for VoiceOver and TalkBack, including selected state and activation actions.
- Navigation badges, test IDs, accessibility labels, label styles and `tabLongPress` events.
- Badges that can restyle themselves as the pill wipes over them (`activeBadgeStyle`).
- Headless component for custom routers and fully controlled tab state.
- Icons as React components, SVG paths (`pathIcon`) or icon-font glyphs (`glyphIcon`); paths and glyphs are drawn natively on Android.
- Custom colors, opacity, sizing, springs, distortion, backdrops and touch feedback.
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


Jelly Tabs ships native Android code as an Expo module, so the app needs the `expo` package. Expo apps already have it. Bare React Native apps add it once:

```sh
npx install-expo-modules@latest
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
| Expo | `>=52` (tested with SDK 57) |
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

Each item takes an `activeIcon` and an `inactiveIcon` (see [Icons](#icons)). 

`JellyTabBarHeadless` adds no safe-area inset of its own. Give it a wrapper whose height matches `config.layout.trackHeight` (default `64`) times `displayScale`. 

Colors, opacity, layout, jelly springs, distortion, backdrops, badges and the touch-feedback gradient are all configurable.

## Icons

An icon can be any React component that receives `{ color, size, focused }`, so `tabBarIcon` render functions and icon-library components keep working. On Android they are hosted inside the native bar as React views.

For the lightest Android rendering, build icons with the two helpers. They return regular icon components (so they also work on iOS, on the web, and as `tabBarIcon`), and on Android they are drawn natively:

```tsx
import { glyphIcon, pathIcon } from "react-native-jelly-tabs";
import { mdiHome, mdiHomeOutline } from "@mdi/js";
import glyphMap from "@react-native-vector-icons/material-icons/glyphmaps/MaterialIcons.json";

// SVG path data, 24×24 viewBox by default
const HomeIcon = pathIcon(mdiHome, { inactivePath: mdiHomeOutline });

// A glyph from an icon font that is already loaded in the app
const SettingsIcon = glyphIcon("MaterialIcons", glyphMap.settings);

<Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: HomeIcon }} />;
```

`glyphIcon` takes the font family name the font is registered under on Android (the file name for fonts bundled in `assets/fonts`, or the name given to `expo-font`) and a glyph string or code point.

## Upgrading from 0.x

- Android now renders natively. Rebuild the app after upgrading, and add Expo Modules to bare React Native apps (see [Installation](#installation)).
- Android has its own defaults: 11 pt labels (weights 600/500), a pill 8 pt wider than its tab so tabs sit closer, a 1 pt icon-label gap, and stronger presses (pill 1.2×, track 1.1×). Pass `config` or `labelStyle` to change them; `layout.iconLabelGap` and `layout.pillOverhang` are new.
- `expo` is a new peer dependency.
- Icon components receive a `focused` prop (`true` for the copy revealed through the selected pill).
- On Android, `labelStyle` / `tabBarLabelStyle` apply `color`, `fontFamily`, `fontSize`, `fontStyle`, `fontWeight`, `letterSpacing` and `textTransform`; other text style keys are ignored there.

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

The reusable package lives in `src/`, and the native Android renderer in `android/`. The Expo playground, generated background, and color laboratory live in `example/`. `bench/` holds the Android benchmark (see [`bench/README.md`](./bench/README.md)).

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
