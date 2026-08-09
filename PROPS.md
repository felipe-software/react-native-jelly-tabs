# Props reference

Every prop and config value of `react-native-jelly-tabs`, taken from the exported
TypeScript types. This file is the flat reference; the guides, defaults in context
and live interactive examples live at **https://jelly.felipe.software/docs** —
every preview there has a **Copy props** button that emits this same shape as JSX
or JSON.

All props are optional except `items`. `JellyTabBar` accepts the same visual props
while sourcing its items and selection from the navigator.

## `<JellyTabBarHeadless />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `TabsItem[]` | — | The tabs to render (**required**). |
| `maxWidth` | `DimensionValue` | `400` | Maximum track width; stays centered in wider parents. |
| `selectedIndex` | `number \| null` | uncontrolled | Controlled index. `null`/negative renders no pill. |
| `onTabPress` | `(e: TabsChangeEvent) => boolean \| void` | — | After every completed tap or drag, including the already selected tab. Return `false` to reject. |
| `onTabLongPress` | `(e: TabsChangeEvent) => void` | — | When a tab is held, including the `longpress` accessibility action. |
| `onTabChange` | `(e: TabsChangeEvent) => void` | — | After an accepted change only. |
| `colors` | `Partial<TabBarColors>` | see below | Solid color per layer. |
| `opacity` | `Partial<TabBarOpacity>` | all `1` | Per-layer opacity, clamped `0`–`1`. |
| `config` | `DeepPartial<TabBarConfig>` | see below | Layout, jelly and distortion overrides. |
| `backdrop` | `ReactNode` | — | Node below the track color layer. |
| `selectedBackdrop` | `ReactNode` | — | Node below the selected-pill color layer. |
| `displayScale` | `number` | `1` | Scales every layout dimension. |
| `touchFeedbackEnabled` | `boolean` | `true` | Toggles the radial touch feedback. |
| `touchFeedbackColor` | `string` | `colors.selectedSurface` | Feedback gradient color. |
| `touchFeedbackOpacity` | `number` | `0.15` | Opacity of the gradient's center stop. |
| `touchFeedbackScale` | `number` | `2` | Multiplier applied to the radius. |
| `recording` | `boolean` | `false` | Deterministic mode for clean captures. |

`JellyTabs` remains available as a deprecated alias for `JellyTabBarHeadless`.

## `<JellyTabBar />`

Pass it to the navigator's `tabBar` callback; the navigator supplies `state`,
`descriptors`, `navigation` and `insets`.

| Prop | Type | Description |
| --- | --- | --- |
| `floating` | `boolean` | Absolutely position the bar over the screen. |
| `containerStyle` | `StyleProp<ViewStyle>` | Wrapper overrides. |

Recognised screen options: `title`, string `tabBarLabel`, `tabBarLabelStyle`,
`tabBarIcon`, `tabBarShowLabel`, `tabBarBadge`, `tabBarBadgeStyle`,
`tabBarActiveBadgeStyle`, `tabBarAccessibilityLabel`, `tabBarButtonTestID`,
`tabBarActiveTintColor`, `tabBarInactiveTintColor`,
`tabBarActiveBackgroundColor`, `tabBarInactiveBackgroundColor`,
`tabBarBackground`, `tabBarStyle`, and Expo Router's `href: null`. It emits
`tabPress` and `tabLongPress`. Function-valued `tabBarLabel` and custom tab
buttons are not rendered by the Jelly layout.

## `TabsItem`

```ts
interface TabsItem {
    key: string;
    label: string;
    activeIcon: TabsIcon; // revealed through the pill mask
    inactiveIcon: TabsIcon; // drawn in the track
    accessibilityLabel?: string;
    labelStyle?: StyleProp<TextStyle>;
    badge?: number | string;
    badgeStyle?: StyleProp<TextStyle>; // both copies of the tab
    activeBadgeStyle?: StyleProp<TextStyle>; // layered over it inside the mask
    testID?: string;
}
```

The tab row is rendered twice — in the track, and inside the pill mask.
`activeBadgeStyle` applies only to the masked copy, so a badge can carry one color
outside the pill and another inside it. Labels are limited to one line and
truncate with a trailing ellipsis.

```ts
interface TabsChangeEvent {
    index: number;
    item: TabsItem;
}

interface TabsIconProps {
    color: string; // resolved active/inactive content color
    colors: Readonly<TabBarColors>; // full palette
    size: number; // resolved icon size
    opacity: number; // resolved layer opacity
}
```

## `colors` / `opacity`

```ts
interface TabBarColors {
    surface: string;
    selectedSurface: string;
    activeContent: string;
    inactiveContent: string;
}
```

| Key | Color default | Opacity default | Role |
| --- | --- | --- | --- |
| `surface` | `#22211f` | `1` | Track background |
| `selectedSurface` | `#f2eee7` | `1` | Selected pill |
| `activeContent` | `#11100f` | `1` | Selected icon / label |
| `inactiveContent` | `#b8b4ad` | `1` | Unselected icon / label |

Opacity applies to the rendered content rather than the mask, so the animated pill
keeps a fully opaque clipping shape.

## `config`

`config` is a deep-partial of `TabBarConfig` — pass only the nested keys you want.
`resolveTabBarConfig(partial?)` returns a complete, mutable object.

### `config.layout`

| Key | Default | Description |
| --- | --- | --- |
| `iconSize` | `28` | Base icon size passed to each icon. |
| `itemHeight` | `56` | Height of a single tab / the selected pill. |
| `trackHeight` | `64` | Height of the track. |
| `trackInset` | `4` | Padding between the track edge and items. |
| `maskOverscanX` | `48` | Horizontal overscan for the pill mask. |
| `maskOverscanY` | `16` | Vertical overscan for the pill mask. |

### `config.pillJelly`

| Key | Default | Description |
| --- | --- | --- |
| `pressedScale` | `1.3` | How much the pill inflates while pressed. |
| `snapOnPointerDown` | `true` | Snap the indicator toward the touch on press. |
| `frameConfig.releaseDistanceFraction` | `0.025` | Keeps the indicator inflated until it is within this fraction of its snap point. |

Springs are `{ stiffness, dampingRatio }` per channel:

| Spring | `stiffness` | `dampingRatio` | Drives |
| --- | --- | --- | --- |
| `value` | `1000` | `1` | Pill position along the track. |
| `velocity` | `300` | `0.5` | Velocity tracking that feeds the stretch. |
| `scaleX` | `250` | `0.6` | Horizontal stretch. |
| `scaleY` | `250` | `0.7` | Vertical squash. |
| `press` | `1000` | `1` | Press inflation. |
| `panel` | `300` | `1` | Whole-panel follow. |

### `config.distortion`

| Key | Default | Description |
| --- | --- | --- |
| `pressedScale` | `1.025` | Whole-track scale while pressed. |
| `touchFeedback.opacity` | `0.15` | Base opacity of the radial gradient. |
| `touchFeedback.middleOpacityRatio` | `0.43` | Opacity of the gradient's `45%` stop, relative to the base. |
| `touchFeedback.radius` | `150` | Base gradient radius (px). |
| `touchFeedback.scale` | `2` | Multiplier applied to the radius. |
| `spring.damping` | `18` | Distortion spring damping. |
| `spring.mass` | `0.9` | Distortion spring mass. |
| `spring.stiffness` | `240` | Distortion spring stiffness. |
| `verticalDrag.distortion` | `0.08` | How much vertical drag squishes the track width. |
| `verticalDrag.distanceForMaxDistortion` | `700` | Drag distance (px) that reaches max distortion. |
| `verticalDrag.follow` | `0.25` | How much the track follows the finger vertically. |
| `verticalDrag.rubberBand` | `0.14` | Rubber-band resistance on the vertical follow. |

The touch-feedback gradient is drawn twice — once under the whole track and once
inside the pill mask — so it stays visible as it crosses the selected tab.

## `<JellyPressable />`

A standalone elastic button: press scale, focus glow and stretchy drag, with no
tab bar attached. It shares hooks with `JellyTabBar` but none of its config.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Rendered above the glow layer. |
| `onPress` | `() => void` | — | On release, when the gesture travelled less than 8px and no long press fired. |
| `onLongPress` | `() => void` | — | After a 500ms hold; suppresses the following `onPress`. |
| `disabled` | `boolean` | `false` | Disables the gesture and sets `accessibilityState.disabled`. |
| `style` | `StyleProp<ViewStyle>` | — | Styles the surface itself. |
| `borderRadius` | `number` | from `style` | Radius used to clip the glow. |
| `config` | `DeepPartial<GelatinConfig>` | see below | Motion overrides. |
| `touchFeedbackEnabled` | `boolean` | `true` | Toggles the glow. |
| `touchFeedbackColor` | `string` | `"#ffffff"` | Glow color. |
| `touchFeedbackOpacity` | `number` | `0.35` | Center-stop opacity, clamped `0`–`1`. |
| `touchFeedbackScale` | `number` | `1` | Multiplier applied to the glow radius. |
| `accessibilityRole` | `AccessibilityRole` | `"button"` | |
| `accessibilityLabel` / `accessibilityHint` | `string` | — | |
| `accessibilityState` | `AccessibilityState` | — | Merged over the automatic `disabled` state. |
| `testID` | `string` | — | |

It exposes `activate` — and `longpress` when `onLongPress` is set — as
accessibility actions.

### `GelatinConfig`

Deep-partial; `resolveGelatinConfig(partial?)` returns the full object.

| Key | Default | Description |
| --- | --- | --- |
| `pressedScale` | `1.1` | Whole-surface scale while pressed. |
| `drag.easingExponent` | `0.333` | Exponent applied to the raw drag distance. |
| `drag.follow` | `2` | Scales the eased offset; does not change the stretch. |
| `drag.maxStretch` | `0.9` | Stretch at full deformation, before amplification. |
| `drag.stretchAmplification` | `3` | Multiplier on `maxStretch`. |
| `drag.distanceForMaxStretch` | `32` | Eased distance (px) reaching the full stretch. |
| `drag.stretchAnchor` | `1` | How far the transform origin slides to the trailing edge, so the surface grows towards the finger. `0` scales about the centre. |
| `springs.drag` | `{ duration: 390, dampingRatio: 1 }` | Chases the finger during the drag. |
| `springs.press` | `{ duration: 300, dampingRatio: 0.5 }` | Press inflation and glow fade. |
| `springs.release` | `{ duration: 500, dampingRatio: 0.5 }` | Bounce back on release. |
| `touchFeedback.opacity` | `0.35` | Base opacity of the radial gradient. |
| `touchFeedback.middleOpacityRatio` | `0.43` | Opacity of the `45%` stop, relative to the base. |
| `touchFeedback.radius` | `90` | Base gradient radius (px). |
| `touchFeedback.scale` | `1` | Multiplier applied to the radius. |

### Gelatin hooks

`useGelatin(config, touchFeedbackRadius?)` and
`useTouchGlow(spring, radius?)` expose the effect without the component, for
custom surfaces and gestures. The pure worklets `applyElasticEasing`,
`getStretchFactor`, `getStretchOrigin` and `getGelatinTransform` are exported
too.
