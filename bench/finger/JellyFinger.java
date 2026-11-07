import android.os.SystemClock;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.MotionEvent;
import java.lang.reflect.Method;

public final class JellyFinger {
    private static final int START_DELAY_MS = 400;
    private static final int PRESS_MS = 90;
    private static final int TRAVEL_MS = 340;
    private static final int HOLD_MS = 650;
    private static final int SETTLE_MS = 800;
    private static final int SAMPLE_MS = 8;
    private static final float ARC_PX = 14f;
    private static final int INJECT_ASYNC = 0;

    private static Object inputManager;
    private static Method inject;
    private static final MotionEvent.PointerProperties[] PROPERTIES = { new MotionEvent.PointerProperties() };
    private static final MotionEvent.PointerCoords[] COORDS = { new MotionEvent.PointerCoords() };

    private static void send(long downTime, int action, float x, float y) throws Exception {
        COORDS[0].x = x;
        COORDS[0].y = y;
        COORDS[0].pressure = 1f;
        COORDS[0].size = 0.05f;
        MotionEvent event = MotionEvent.obtain(
            downTime, SystemClock.uptimeMillis(), action, 1, PROPERTIES, COORDS, 0, 0, 1f, 1f, 0, 0,
            InputDevice.SOURCE_TOUCHSCREEN, 0);
        inject.invoke(inputManager, (InputEvent) event, INJECT_ASYNC);
        event.recycle();
    }

    private static float minimumJerk(float t) {
        return t * t * t * (10f + t * (-15f + 6f * t));
    }

    private static void sleepUntil(long uptime) {
        long remaining = uptime - SystemClock.uptimeMillis();
        if (remaining > 0) SystemClock.sleep(remaining);
    }

    private static void gesture(float fromX, float toX, float y) throws Exception {
        long down = SystemClock.uptimeMillis();
        send(down, MotionEvent.ACTION_DOWN, fromX, y);
        long moveStart = down + PRESS_MS;
        sleepUntil(moveStart);
        for (int elapsed = SAMPLE_MS; elapsed <= TRAVEL_MS; elapsed += SAMPLE_MS) {
            float t = elapsed / (float) TRAVEL_MS;
            float x = fromX + (toX - fromX) * minimumJerk(t);
            float lift = ARC_PX * (float) Math.sin(Math.PI * t);
            send(down, MotionEvent.ACTION_MOVE, x, y - lift);
            sleepUntil(moveStart + elapsed + SAMPLE_MS);
        }
        send(down, MotionEvent.ACTION_MOVE, toX, y);
        sleepUntil(moveStart + TRAVEL_MS + HOLD_MS);
        send(down, MotionEvent.ACTION_UP, toX, y);
        sleepUntil(moveStart + TRAVEL_MS + HOLD_MS + SETTLE_MS);
    }

    public static void main(String[] args) throws Exception {
        float leftX = Float.parseFloat(args[0]);
        float rightX = Float.parseFloat(args[1]);
        float y = Float.parseFloat(args[2]);
        int gestures = Integer.parseInt(args[3]);

        PROPERTIES[0].id = 0;
        PROPERTIES[0].toolType = MotionEvent.TOOL_TYPE_FINGER;
        Class<?> managerClass;
        try {
            managerClass = Class.forName("android.hardware.input.InputManagerGlobal");
        } catch (ClassNotFoundException olderThanAndroid14) {
            managerClass = Class.forName("android.hardware.input.InputManager");
        }
        inputManager = managerClass.getMethod("getInstance").invoke(null);
        inject = managerClass.getMethod("injectInputEvent", InputEvent.class, int.class);

        SystemClock.sleep(START_DELAY_MS);
        for (int index = 0; index < gestures; index++) {
            boolean goingRight = index % 2 == 0;
            gesture(goingRight ? leftX : rightX, goingRight ? rightX : leftX, y);
        }
    }
}
