#!/usr/bin/env python3
import json
import os
import re
import statistics as st
import subprocess
import sys
import time

PKG = "com.castororquestre.ohmytabs"
SERIAL = os.environ["BENCH_SERIAL"]
OUT = os.environ.get("BENCH_OUT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"))
LABEL = os.environ.get("BENCH_LABEL", "run")
ADB = [os.environ.get("ADB", os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")), "-s", SERIAL]
TAB_COUNT = 4
TRACK_SIDE_DP, TRACK_BOTTOM_DP, TRACK_HEIGHT_DP, TRACK_INSET_DP = 16, 96, 64, 4
GESTURES = 4
LAUNCH_WAIT_SECONDS = 3.5
IDLE_SECONDS = 8
FINGER_JAR = "/data/local/tmp/jellyfinger.jar"
THREADS = {"main": PKG[-15:], "render": "RenderThread", "js": "mqt_v_js"}
FRAME_KEYS = ("fps", "jank_pct", "p50", "p90", "p99")
CPU_KEYS = ("main", "render", "js", "all")


def shell(cmd):
    return subprocess.run(ADB + ["shell", cmd], capture_output=True, text=True, errors="replace").stdout


def screen():
    size = re.search(r"(\d+)x(\d+)", shell("wm size").splitlines()[-1])
    density = re.search(r"(\d+)", shell("wm density").splitlines()[-1])
    return int(size.group(1)), int(size.group(2)), int(density.group(1)) / 160


def finger_points():
    width, height, density = screen()
    track_left = TRACK_SIDE_DP * density
    track_width = width - 2 * track_left
    tab_width = (track_width - 2 * TRACK_INSET_DP * density) / TAB_COUNT
    first = track_left + TRACK_INSET_DP * density + tab_width / 2
    last = first + tab_width * (TAB_COUNT - 1)
    y = height - (TRACK_BOTTOM_DP + TRACK_HEIGHT_DP / 2) * density
    return round(first), round(last), round(int(os.environ.get("BENCH_Y", y)))


def thread_cpu(pid):
    out = shell(f"cd /proc/{pid}/task && for t in *; do echo \"$(cat $t/comm)|$(cut -d' ' -f1 $t/schedstat)\"; done")
    times = {}
    for line in out.strip().splitlines():
        if "|" not in line:
            continue
        name, value = line.rsplit("|", 1)
        if value.strip().isdigit():
            times[name] = times.get(name, 0) + int(value)
    times["all"] = sum(times.values())
    return times


def frame_stats():
    out = shell(f"dumpsys gfxinfo {PKG}")

    def read(pattern):
        match = re.search(pattern, out)
        return int(match.group(1)) if match else 0

    return {
        "frames": read(r"Total frames rendered:\s*(\d+)"),
        "janky": read(r"Janky frames:\s*(\d+)"),
        "p50": read(r"50th percentile:\s*(\d+)ms"),
        "p90": read(r"90th percentile:\s*(\d+)ms"),
        "p99": read(r"99th percentile:\s*(\d+)ms"),
    }


def run_once(variant, points):
    bar, _, mode = variant.partition(":")
    shell(f"am force-stop {PKG}")
    shell(f"am start -a android.intent.action.VIEW -d 'ohmytabs://bench?bar={bar}' {PKG} >/dev/null")
    time.sleep(LAUNCH_WAIT_SECONDS)
    pid = shell(f"pidof {PKG}").strip().split()[0]
    shell(f"dumpsys gfxinfo {PKG} reset >/dev/null")
    before = thread_cpu(pid)
    started = time.time()
    if mode == "idle":
        time.sleep(IDLE_SECONDS)
    else:
        left, right, y = points
        shell(f"CLASSPATH={FINGER_JAR} app_process / JellyFinger {left} {right} {y} {GESTURES}")
    seconds = time.time() - started
    after = thread_cpu(pid)
    frames = frame_stats()
    alive = shell(f"pidof {PKG}").strip() == pid
    result = {"seconds": round(seconds, 2), "alive": alive, "frames": frames["frames"], "janky": frames["janky"]}
    result["fps"] = round(frames["frames"] / seconds, 1)
    result["jank_pct"] = round(100 * frames["janky"] / max(frames["frames"], 1), 1)
    for key in ("p50", "p90", "p99"):
        result[key] = frames[key]
    for key, name in THREADS.items():
        result[key] = round((after.get(name, 0) - before.get(name, 0)) / 1e6 / seconds, 1)
    result["all"] = round((after["all"] - before["all"]) / 1e6 / seconds, 1)
    return result


def main():
    reps = int(sys.argv[1])
    variants = sys.argv[2:]
    if os.environ.get("BENCH_INSTALL") == "1":
        print(subprocess.run(ADB + ["install", "-r", f"{OUT}/bench.apk"], capture_output=True, text=True).stdout.strip().splitlines()[-1], flush=True)
        subprocess.run(ADB + ["push", f"{OUT}/jellyfinger.jar", FINGER_JAR], capture_output=True)
        print("compile:", shell(f"cmd package compile -m speed -f {PKG}").strip()[:40], flush=True)
    points = finger_points()
    print("finger:", points, flush=True)
    results = {variant: [] for variant in variants}
    started = time.time()
    for rep in range(reps):
        for variant in variants:
            result = run_once(variant, points)
            results[variant].append(result)
            print(f"r{rep} {variant:14}", {k: result[k] for k in ("alive", "frames", "fps", "jank_pct", "p90", "p99") + CPU_KEYS}, flush=True)
    device = shell("getprop ro.product.model").strip() + " / Android " + shell("getprop ro.build.version.release").strip()
    print(f"--- {reps} reps in {time.time() - started:.0f}s on {device}, {shell('dumpsys battery | grep temperature').strip()}")
    columns = FRAME_KEYS + CPU_KEYS
    print(f"{'variant':15}" + "".join(f"{c:>9}" for c in columns))
    for variant in variants:
        print(f"{variant:15}" + "".join(f"{st.median(r[c] for r in results[variant]):9.1f}" for c in columns))
    os.makedirs(OUT, exist_ok=True)
    with open(f"{OUT}/{LABEL}.json", "w") as handle:
        json.dump({"device": device, "reps": reps, "results": results}, handle, indent=1)


main()
