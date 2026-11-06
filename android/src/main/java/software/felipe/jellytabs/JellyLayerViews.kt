package software.felipe.jellytabs

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import kotlin.math.min
import kotlin.math.roundToInt

private const val GLOW_MIDDLE_STOP = 0.45f

internal open class JellyLayerView(context: Context) : ViewGroup(context) {
  init {
    clipChildren = false
    clipToPadding = false
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

  override fun hasOverlappingRendering() = false

  fun clipToPill() {
    outlineProvider = PillOutlineProvider
    clipToOutline = true
  }
}

private object PillOutlineProvider : ViewOutlineProvider() {
  override fun getOutline(view: View, outline: Outline) {
    outline.setRoundRect(0, 0, view.width, view.height, min(view.width, view.height) / 2f)
  }
}

internal class JellyFillView(context: Context) : View(context) {
  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  fun setFill(color: Int, opacity: Float) {
    setBackgroundColor(color)
    alpha = opacity.coerceIn(0f, 1f)
  }

  override fun hasOverlappingRendering() = false
}

internal class JellyGlowView(context: Context) : View(context) {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  var radius = 0f
    private set
  private var appearance: JellyTouchFeedback? = null

  init {
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    alpha = 0f
  }

  fun setAppearance(next: JellyTouchFeedback, radiusPx: Float) {
    if (next == appearance && radiusPx == radius) return
    appearance = next
    radius = radiusPx
    if (radiusPx <= 0f) {
      paint.shader = null
    } else {
      val baseAlpha = Color.alpha(next.color) / 255f
      paint.shader = RadialGradient(
        radiusPx,
        radiusPx,
        radiusPx,
        intArrayOf(
          withAlpha(next.color, baseAlpha * next.centerOpacity),
          withAlpha(next.color, baseAlpha * next.middleOpacity),
          withAlpha(next.color, 0f),
        ),
        floatArrayOf(0f, GLOW_MIDDLE_STOP, 1f),
        Shader.TileMode.CLAMP,
      )
    }
    invalidate()
  }

  override fun onDraw(canvas: Canvas) {
    if (radius > 0f) canvas.drawRect(0f, 0f, radius * 2f, radius * 2f, paint)
  }

  override fun hasOverlappingRendering() = false

  private fun withAlpha(color: Int, alpha: Float) =
    Color.argb((alpha.coerceIn(0f, 1f) * 255f).roundToInt(), Color.red(color), Color.green(color), Color.blue(color))
}
