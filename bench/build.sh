#!/usr/bin/env bash
set -euo pipefail
BENCH_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$BENCH_DIR/.." && pwd)
OUT=${OUT:-$BENCH_DIR/out}
ANDROID_SDK=${ANDROID_HOME:-$HOME/Library/Android/sdk}
BUILD_TOOLS=$(ls -d "$ANDROID_SDK"/build-tools/* | tail -1)
PLATFORM_JAR=$(ls -d "$ANDROID_SDK"/platforms/android-* | tail -1)/android.jar
LEGACY_COMMIT=${LEGACY_COMMIT:-dcc5a33}
APK=${APK:-$ROOT/example/android/app/build/outputs/apk/release/app-release.apk}
KEYSTORE=${KEYSTORE:-$ROOT/example/android/app/debug.keystore}

rm -rf "$BENCH_DIR/.legacy"
mkdir -p "$BENCH_DIR/.legacy" "$OUT/stage/assets"
git -C "$ROOT" archive "$LEGACY_COMMIT" src | tar -x -C "$BENCH_DIR/.legacy"

cd "$ROOT/example"
HERMES_COMPILER=$(node -p "const path = require('path'); path.dirname(require.resolve('hermes-compiler/package.json', { paths: [path.dirname(require.resolve('react-native/package.json'))] }))")
case "$(uname -s)" in
  Darwin) HERMESC="$HERMES_COMPILER/hermesc/osx-bin/hermesc" ;;
  *) HERMESC="$HERMES_COMPILER/hermesc/linux64-bin/hermesc" ;;
esac

EXPO_NO_TELEMETRY=1 CI=1 bunx expo export:embed \
  --platform android --dev false \
  --entry-file ../bench/entry.tsx \
  --bundle-output "$OUT/bench.bundle" --assets-dest "$OUT/res" 2>&1 | tail -2
"$HERMESC" -w -emit-binary -max-diagnostic-width=80 -O \
  -out "$OUT/stage/assets/index.android.bundle" "$OUT/bench.bundle"

cp "$APK" "$OUT/raw.apk"
zip -q -d "$OUT/raw.apk" assets/index.android.bundle
(cd "$OUT/stage" && zip -q -X -0 ../raw.apk assets/index.android.bundle)
"$BUILD_TOOLS/zipalign" -f -p 4 "$OUT/raw.apk" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" sign --ks "$KEYSTORE" --ks-pass pass:android \
  --ks-key-alias androiddebugkey --key-pass pass:android --out "$OUT/bench.apk" "$OUT/aligned.apk"
rm -f "$OUT/raw.apk" "$OUT/aligned.apk" "$OUT/bench.apk.idsig"

FINGER="$OUT/finger"
mkdir -p "$FINGER"
javac -nowarn -source 8 -target 8 -cp "$PLATFORM_JAR" \
  -d "$FINGER" "$BENCH_DIR/finger/JellyFinger.java" 2>/dev/null
"$BUILD_TOOLS/d8" --min-api 24 --lib "$PLATFORM_JAR" \
  --output "$OUT/jellyfinger.jar" "$FINGER"/*.class
ls -la "$OUT/bench.apk" "$OUT/jellyfinger.jar"
