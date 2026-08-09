# Simple example

A minimal Expo app with three pages (`Home`, `Search`, `Profile`) driven by **Expo Router**, using `JellyTabBar` as a drop-in custom bottom tab bar.

## How it works

`app/_layout.tsx` renders Expo Router's `<Tabs>` layout with a custom `tabBar`:

```tsx
<Tabs tabBar={(props) => <JellyTabBar {...props} floating />}>
  <Tabs.Screen name="index" options={{ title: "Home" }} />
  <Tabs.Screen name="search" options={{ title: "Search", tabBarBadge: 3 }} />
  <Tabs.Screen name="profile" options={{ title: "Profile", tabBarBadge: "9+" }} />
</Tabs>
```

`JellyTabBar` reads the routes, labels, icons, badges and selected index directly from Expo Router's tab state. Badges use Expo Router's standard `tabBarBadge` and `tabBarBadgeStyle` screen options. There is no duplicated item array or manual `navigation.navigate()` bridge, and route changes from deep links, hardware back or imperative navigation keep the pill synchronized.

This example enables `floating`, so the screens fill behind the absolutely positioned bar. The bar itself is centered with the library's default `maxWidth` of `400`.

## Run

This example consumes the library from its **build (`dist/`)** through a Bun symlink (`bun link`) — no root copy, no tarball. First time, from the **repository root**:

```sh
bun install
bun run build      # generate dist/
bun link           # register react-native-jelly-tabs as a global Bun link
```

Then, inside `example-simple/`:

```sh
bun install        # resolves "link:react-native-jelly-tabs" (symlink → built dist)
bun run start      # or: bun run android / ios / web
```

## Why it doesn't duplicate the library

`package.json` references the library as `"react-native-jelly-tabs": "link:react-native-jelly-tabs"`. Bun creates a **symlink** to the repository root instead of copying, so the target is only the package files (`file:..` would copy the whole root — `example/`, `references/` — inflating the store by gigabytes).

Because the root `package.json` no longer exposes a `react-native: ./src` field, resolution falls back to `dist/` (the published artifact), just like a real npm consumer. After changing the library, rebuild:

```sh
bun run build      # at the root — or `bun run dev` to watch; the symlink reflects it live
```

The example never imports from `src/` directly: it only consumes the public package name.
