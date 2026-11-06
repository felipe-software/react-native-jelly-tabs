package software.felipe.jellytabs

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Build
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.text.style.MetricAffectingSpan
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.graphics.PathParser
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.text.ReactTypefaceUtils
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToInt

private const val PRESSED_RASTER_MIN_SCALE = 1.001f

internal class JellyMask(private val rest: Bitmap, private val pressed: Bitmap?, val width: Int, val height: Int) {
  private val bounds = RectF()

  fun draw(canvas: Canvas, left: Int, top: Int, paint: Paint, usePressedRaster: Boolean) {
    val pressedBitmap = pressed
    if (usePressedRaster && pressedBitmap != null) {
      bounds.set(left.toFloat(), top.toFloat(), (left + width).toFloat(), (top + height).toFloat())
      canvas.drawBitmap(pressedBitmap, null, bounds, paint)
    } else {
      canvas.drawBitmap(rest, left.toFloat(), top.toFloat(), paint)
    }
  }
}

private fun bakeMask(width: Int, height: Int, rasterScale: Float, draw: (Canvas) -> Unit): JellyMask? {
  if (width <= 0 || height <= 0) return null
  val rest = Bitmap.createBitmap(width, height, Bitmap.Config.ALPHA_8)
  draw(Canvas(rest))
  val pressed = if (rasterScale > PRESSED_RASTER_MIN_SCALE) {
    val pressedWidth = ceil(width * rasterScale).toInt()
    val pressedHeight = ceil(height * rasterScale).toInt()
    Bitmap.createBitmap(pressedWidth, pressedHeight, Bitmap.Config.ALPHA_8).also { bitmap ->
      val canvas = Canvas(bitmap)
      canvas.scale(pressedWidth / width.toFloat(), pressedHeight / height.toFloat())
      draw(canvas)
    }
  } else {
    null
  }
  return JellyMask(rest, pressed, width, height)
}

private fun parsePath(pathData: String): Path? =
  try {
    PathParser.createPathFromPathData(pathData)
  } catch (_: RuntimeException) {
    null
  }

internal class JellyTabFaceView(context: Context) : ViewGroup(context) {
  private val density = resources.displayMetrics.density
  val slot = JellyLayerView(context)
  private var slotChild: View? = null
  private val slotLayoutListener = View.OnLayoutChangeListener { _, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
    if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) arrangeContent()
  }

  private val iconPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  private val bakePaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  private val textPaint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)

  private var label = ""
  private var icon = JellyIcon()
  private var labelStyle = JellyLabelStyle()
  private var metrics = JellyMetrics()
  private var rasterScale = 1f
  private var contentColor = Color.BLACK
  private var opacity = 1f

  private var iconMask: JellyMask? = null
  private var labelMask: JellyMask? = null
  private var masksStale = true
  private var iconLeft = 0
  private var iconTop = 0
  private var labelLeft = 0
  private var labelTop = 0
  private var isPressedRaster = false

  init {
    setWillNotDraw(false)
    clipChildren = false
    clipToPadding = false
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    addView(slot)
  }

  fun bind(nextLabel: String, nextIcon: JellyIcon, nextLabelStyle: JellyLabelStyle, nextMetrics: JellyMetrics, nextRasterScale: Float) {
    if (nextLabel == label && nextIcon == icon && nextLabelStyle == labelStyle && nextMetrics == metrics && nextRasterScale == rasterScale) return
    label = nextLabel
    icon = nextIcon
    labelStyle = nextLabelStyle
    metrics = nextMetrics
    rasterScale = nextRasterScale
    masksStale = true
    applyPaintColors()
    arrangeContent()
  }

  fun setContentColor(color: Int, nextOpacity: Float) {
    if (color == contentColor && nextOpacity == opacity) return
    contentColor = color
    opacity = nextOpacity
    applyPaintColors()
    invalidate()
  }

  fun place(left: Int, top: Int, width: Int, height: Int) {
    val resized = width != this.width || height != this.height
    layout(left, top, left + width, top + height)
    if (resized) {
      masksStale = true
      arrangeContent()
    }
  }

  fun setPressedRaster(isPressed: Boolean) {
    if (isPressedRaster == isPressed) return
    isPressedRaster = isPressed
    invalidate()
  }

  fun syncSlotChild() {
    val next = if (slot.childCount > 0) slot.getChildAt(0) else null
    if (next === slotChild) return
    slotChild?.removeOnLayoutChangeListener(slotLayoutListener)
    slotChild = next
    next?.addOnLayoutChangeListener(slotLayoutListener)
    arrangeContent()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

  override fun hasOverlappingRendering() = false

  override fun onDraw(canvas: Canvas) {
    iconMask?.draw(canvas, iconLeft, iconTop, iconPaint, isPressedRaster)
    labelMask?.draw(canvas, labelLeft, labelTop, labelPaint, isPressedRaster)
  }

  private fun applyPaintColors() {
    iconPaint.color = contentColor
    iconPaint.alpha = scaledAlpha(contentColor)
    val labelColor = labelStyle.color ?: contentColor
    labelPaint.color = labelColor
    labelPaint.alpha = scaledAlpha(labelColor)
  }

  private fun scaledAlpha(color: Int) = (Color.alpha(color) * opacity.coerceIn(0f, 1f)).roundToInt()

  private fun arrangeContent() {
    if (width == 0 || height == 0) return
    val iconSize = (metrics.iconSize * density).roundToInt()
    val labelPadding = (metrics.labelPadding * density).roundToInt()
    val textLayout = if (label.isEmpty()) null else buildLabelLayout(max(0, width - labelPadding * 2))
    if (masksStale) {
      masksStale = false
      iconMask = if (icon.isBaked) bakeMask(iconSize, iconSize, rasterScale) { canvas -> drawIcon(canvas, iconSize) } else null
      labelMask = textLayout?.let { layout ->
        bakeMask(layout.width, layout.height, rasterScale) { canvas -> layout.draw(canvas) }
      }
    }

    val child = slotChild
    val iconBoxWidth = if (icon.isBaked || child == null) iconSize else child.width
    val iconBoxHeight = if (icon.isBaked) iconSize else child?.height ?: 0
    val gap = if (textLayout == null) 0f else metrics.iconLabelGap * density
    val labelHeight = textLayout?.height ?: 0
    val contentTop = (height - iconBoxHeight - gap - labelHeight) / 2f
    iconLeft = ((width - iconBoxWidth) / 2f).roundToInt()
    iconTop = contentTop.roundToInt()
    labelLeft = labelPadding
    labelTop = (contentTop + iconBoxHeight + gap).roundToInt()
    slot.layout(iconLeft, iconTop, iconLeft + max(width, 1), iconTop + max(height, 1))
    invalidate()
  }

  private fun drawIcon(canvas: Canvas, size: Int) {
    when (icon.kind) {
      ICON_KIND_PATH -> drawPathIcon(canvas, size)
      ICON_KIND_GLYPH -> drawGlyphIcon(canvas, size)
    }
  }

  private fun drawPathIcon(canvas: Canvas, size: Int) {
    val path = parsePath(icon.path ?: return) ?: return
    val viewBox = if (icon.viewBox > 0f) icon.viewBox else 24f
    val restoreCount = canvas.save()
    canvas.scale(size / viewBox, size / viewBox)
    canvas.drawPath(path, bakePaint)
    canvas.restoreToCount(restoreCount)
  }

  private fun drawGlyphIcon(canvas: Canvas, size: Int) {
    val glyph = icon.glyph ?: return
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply {
      textAlign = Paint.Align.CENTER
      textSize = size.toFloat()
      typeface = icon.fontFamily?.let { family ->
        ReactFontManager.getInstance().getTypeface(family, Typeface.NORMAL, context.assets)
      } ?: Typeface.DEFAULT
    }
    val metrics = paint.fontMetrics
    val baseline = (size - (metrics.bottom - metrics.top)) / 2f - metrics.top
    canvas.drawText(glyph, size / 2f, baseline, paint)
  }

  private fun buildLabelLayout(layoutWidth: Int): Layout {
    val fontSize = ceil(PixelUtil.toPixelFromSP(labelStyle.fontSize))
    val span = LabelStyleSpan(
      size = fontSize,
      face = labelTypeface(context, labelStyle),
      letterSpacing = if (fontSize > 0f) PixelUtil.toPixelFromSP(labelStyle.letterSpacing) / fontSize else 0f,
    )
    val text = SpannableString(label)
    text.setSpan(span, 0, label.length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
    val builder = StaticLayout.Builder.obtain(text, 0, text.length, textPaint, layoutWidth)
      .setAlignment(Layout.Alignment.ALIGN_CENTER)
      .setLineSpacing(0f, 1f)
      .setIncludePad(false)
      .setEllipsize(TextUtils.TruncateAt.END)
      .setEllipsizedWidth(layoutWidth)
      .setMaxLines(1)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      builder.setUseLineSpacingFromFallbacks(true)
    }
    return builder.build()
  }
}

private fun labelTypeface(context: Context, style: JellyLabelStyle): Typeface =
  ReactTypefaceUtils.applyStyles(
    TextView(context).typeface,
    if (style.italic) Typeface.ITALIC else Typeface.NORMAL,
    style.fontWeight,
    style.fontFamily,
    context.assets,
  )

private class LabelStyleSpan(
  private val size: Float,
  private val face: Typeface,
  private val letterSpacing: Float,
) : MetricAffectingSpan() {
  override fun updateDrawState(paint: TextPaint) = apply(paint)

  override fun updateMeasureState(paint: TextPaint) = apply(paint)

  private fun apply(paint: TextPaint) {
    paint.textSize = size
    paint.typeface = face
    paint.letterSpacing = letterSpacing
    paint.isSubpixelText = true
    paint.isLinearText = true
  }
}
