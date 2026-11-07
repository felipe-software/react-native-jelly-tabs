# Android benchmark

Compares the current native Android renderer with the previous Reanimated renderer
on a real device. Both bars run in the same release APK, so the native code, fonts and
Hermes bytecode are identical; only the JavaScript bundle chooses the bar.

The scene is a four-tab bar over four pages. A finger injected through
`app_process` presses the first tab, drags to the last one along a slight arc, holds,
releases, and drags back, four times. Each run reports frames, jank and frame-time
percentiles from `dumpsys gfxinfo`, and per-thread CPU time from
`/proc/<pid>/task/*/schedstat`, in milliseconds of CPU per second of run.

## Run it

```sh
# 1. A release build of the example app (any ABI the device needs)
cd example && npx expo prebuild --platform android
cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a

# 2. Swap in the benchmark bundle and build the finger injector
cd ../.. && ./bench/build.sh

# 3. Install, compile ahead of time, and run interleaved repetitions
BENCH_SERIAL=<adb serial> BENCH_INSTALL=1 BENCH_LABEL=gesture python3 bench/run.py 8 legacy native
BENCH_SERIAL=<adb serial> BENCH_LABEL=idle python3 bench/run.py 3 legacy:idle native:idle
```

`LEGACY_COMMIT` (default `dcc5a33`, the last Reanimated-only release) picks the
renderer the native one is compared with. Results land in `bench/out/<label>.json`.

`ohmytabs://bench?scene=gallery` opens a gallery of the Android-specific paths: React,
path and glyph icons, badges, label styles, press veto, long press, backdrops, no
selection, `displayScale` and the navigation adapter.
