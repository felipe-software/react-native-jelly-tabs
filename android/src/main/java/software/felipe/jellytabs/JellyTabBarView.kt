package software.felipe.jellytabs

import android.annotation.SuppressLint
import android.content.Context
import android.provider.Settings
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.events.NativeGestureUtil
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.roundToInt

private const val NANOS_PER_SECOND = 1_000_000_000.0
private const val NOMINAL_FRAME_SECONDS = 1.0 / 60.0
private const val PRESSED_RASTER_THRESHOLD = 1.004
private const val PRESSED_RASTER_HEADROOM = 1.1f
private const val LONG_PRESS_MS = 500L
private const val LONG_PRESS_SLOP_DP = 10f
private const val BACKDROP_CHILD = 0
private const val SELECTED_BACKDROP_CHILD = 1
private const val FIRST_TAB_CHILD = 2

@SuppressLint("ViewConstructor")
class JellyTabBarView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext),
  Choreographer.FrameCallback {
  private val onTabPress by EventDispatcher()
  private val onTabLongPress by EventDispatcher()

  private val density = resources.displayMetrics.density
  private val motion = JellyTabBarMotion(
    density = density,
    reducedMotion = Settings.Global.getFloat(context.contentResolver, Settings.Global.TRANSITION_ANIMATION_SCALE, 1f) == 0f,
  )

  private val surfaceClip = JellyLayerView(context).apply { clipToPill() }
  private val backdropHost = JellyLayerView(context)
  private val surfaceFill = JellyFillView(context)
  private val glow = JellyGlowView(context)
  private val inactiveRow = JellyLayerView(context)
  private val pill = JellyLayerView(context).apply { clipToPill() }
  private val selectedBackdropHost = JellyLayerView(context)
  private val selectedFill = JellyFillView(context)
  private val pillContent = JellyLayerView(context)
  private val selectedGlow = JellyGlowView(context)
  private val parking = JellyLayerView(context).apply { visibility = View.INVISIBLE }

  private val inactiveFaces = ArrayList<JellyTabFaceView>()
  private val activeFaces = ArrayList<JellyTabFaceView>()
  private val reactChildren = ArrayList<View>()

  private var tabs = emptyList<JellyTab>()
  private var palette = JellyPalette()
  private var layerOpacity = JellyLayerOpacity()
  private var metrics = JellyMetrics()
  private var motionConfig = JellyMotionConfig()
  private var touchFeedback = JellyTouchFeedback()
  private var recording = false
  private var longPressEnabled = false

  private var requestedIndex = -1
  private var hasSelection = false
  private var isSelectionStale = false

  private var isTracking = false
  private var isPanActive = false
  private var isLongPressFired = false
  private var downAlong = 0f
  private var downAcross = 0f
  private var panStartAlong = 0f
  private var panStartAcross = 0f
  private var lastLocalX = 0f
  private val longPressRunnable = Runnable { fireLongPress() }

  private var isFrameScheduled = false
  private var lastFrameNanos = 0L

  init {
    clipChildren = false
    clipToPadding = false
    importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    surfaceClip.addView(backdropHost)
    surfaceClip.addView(surfaceFill)
    surfaceClip.addView(glow)
    addView(surfaceClip)
    addView(inactiveRow)
    pill.addView(selectedBackdropHost)
    pill.addView(selectedFill)
    pillContent.addView(selectedGlow)
    pill.addView(pillContent)
    addView(pill)
    addView(parking)
  }

  internal fun setTabs(next: List<JellyTab>) {
    tabs = next
  }

  fun setSelectedIndex(index: Int) {
    requestedIndex = index
    isSelectionStale = true
  }

  internal fun setPalette(next: JellyPalette) {
    palette = next
  }

  internal fun setLayerOpacity(next: JellyLayerOpacity) {
    layerOpacity = next
  }

  internal fun setMetrics(next: JellyMetrics) {
    metrics = next
  }

  internal fun setMotionConfig(next: JellyMotionConfig) {
    motionConfig = next
  }

  internal fun setTouchFeedback(next: JellyTouchFeedback) {
    touchFeedback = next
  }

  fun setRecording(next: Boolean) {
    recording = next
  }

  fun setLongPressEnabled(next: Boolean) {
    longPressEnabled = next
    if (!next) removeCallbacks(longPressRunnable)
  }

  fun commit() {
    motion.setConfig(motionConfig)
    syncFaces()
    applyAppearance()
    layoutContent()
    if (isSelectionStale) {
      isSelectionStale = false
      applySelection()
    }
  }

  fun activate(index: Int) {
    motion.activateIndex(index)
    scheduleFrame()
  }

  fun restore(index: Int) {
    motion.selectIndex(index)
    scheduleFrame()
  }

  fun release() {
    cancelFrame()
    removeCallbacks(longPressRunnable)
  }

  val reactChildCount get() = reactChildren.size

  fun reactChildAt(index: Int): View? = reactChildren.getOrNull(index)

  fun addReactChild(child: View, index: Int) {
    reactChildren.add(index.coerceIn(0, reactChildren.size), child)
    routeReactChildren()
  }

  fun removeReactChildAt(index: Int) {
    if (index !in reactChildren.indices) return
    detach(reactChildren.removeAt(index))
    routeReactChildren()
  }

  fun removeReactChild(child: View) {
    if (!reactChildren.remove(child)) return
    detach(child)
    routeReactChildren()
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    if (changed) layoutContent()
  }

  override fun onInterceptTouchEvent(event: MotionEvent) = true

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN -> beginTouch(event)
      MotionEvent.ACTION_MOVE -> if (isTracking) moveTouch(event)
      MotionEvent.ACTION_POINTER_DOWN, MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> finishTouch()
    }
    return true
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (motion.isActive) scheduleFrame()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    cancelFrame()
    removeCallbacks(longPressRunnable)
  }

  override fun doFrame(frameTimeNanos: Long) {
    isFrameScheduled = false
    val previousFrameNanos = lastFrameNanos
    lastFrameNanos = frameTimeNanos
    val deltaSeconds = if (previousFrameNanos == 0L) NOMINAL_FRAME_SECONDS else (frameTimeNanos - previousFrameNanos) / NANOS_PER_SECOND
    motion.step(deltaSeconds)
    applyInteraction()
    if (motion.isActive) {
      scheduleFrame()
    } else {
      lastFrameNanos = 0L
    }
  }

  private fun alongTrack(event: MotionEvent) = if (recording) event.rawY else event.rawX

  private fun acrossTrack(event: MotionEvent) = if (recording) -event.rawX else event.rawY

  private fun beginTouch(event: MotionEvent) {
    isTracking = true
    isPanActive = false
    isLongPressFired = false
    downAlong = alongTrack(event)
    downAcross = acrossTrack(event)
    lastLocalX = event.x
    parent?.requestDisallowInterceptTouchEvent(true)
    NativeGestureUtil.notifyNativeGestureStarted(this, event)
    motion.begin(event.x.toDouble(), event.y.toDouble())
    if (longPressEnabled && tabs.isNotEmpty()) postDelayed(longPressRunnable, LONG_PRESS_MS)
    applyInteraction()
    scheduleFrame()
  }

  private fun moveTouch(event: MotionEvent) {
    val along = alongTrack(event)
    val across = acrossTrack(event)
    if (!isPanActive) {
      isPanActive = true
      panStartAlong = along
      panStartAcross = across
    }
    lastLocalX = event.x
    if (hypot(along - downAlong, across - downAcross) > LONG_PRESS_SLOP_DP * density) {
      removeCallbacks(longPressRunnable)
    }
    motion.drag((along - panStartAlong).toDouble(), (across - panStartAcross).toDouble(), (along - downAlong).toDouble())
    applyInteraction()
    if (motion.isActive) scheduleFrame()
  }

  private fun finishTouch() {
    if (!isTracking) return
    isTracking = false
    removeCallbacks(longPressRunnable)
    parent?.requestDisallowInterceptTouchEvent(false)
    val nextIndex = motion.finish()
    scheduleFrame()
    if (tabs.isNotEmpty()) onTabPress(mapOf("index" to nextIndex))
  }

  private fun fireLongPress() {
    if (!isTracking || isLongPressFired || tabs.isEmpty()) return
    isLongPressFired = true
    onTabLongPress(mapOf("index" to motion.indexAt(lastLocalX.toDouble())))
  }

  private fun scheduleFrame() {
    if (isFrameScheduled) return
    isFrameScheduled = true
    ReactChoreographer.getInstance().postFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this)
  }

  private fun cancelFrame() {
    if (isFrameScheduled) {
      ReactChoreographer.getInstance().removeFrameCallback(ReactChoreographer.CallbackType.DISPATCH_UI, this)
    }
    isFrameScheduled = false
    lastFrameNanos = 0L
  }

  private fun syncFaces() {
    while (inactiveFaces.size < tabs.size) {
      inactiveFaces.add(JellyTabFaceView(context).also { inactiveRow.addView(it) })
      activeFaces.add(JellyTabFaceView(context).also { pillContent.addView(it) })
    }
    var removedFaces = false
    while (inactiveFaces.size > tabs.size) {
      inactiveRow.removeView(inactiveFaces.removeAt(inactiveFaces.lastIndex))
      pillContent.removeView(activeFaces.removeAt(activeFaces.lastIndex))
      removedFaces = true
    }
    val pressedScale = motionConfig.barPressedScale.toFloat().coerceAtLeast(1f)
    val inactiveRaster = pressedScale * PRESSED_RASTER_HEADROOM
    val activeRaster = pressedScale * (1f + ACTIVE_TAB_PRESSED_GROWTH.toFloat()) * PRESSED_RASTER_HEADROOM
    tabs.forEachIndexed { index, tab ->
      inactiveFaces[index].bind(tab.label, tab.inactiveIcon, tab.inactiveLabel, metrics, inactiveRaster)
      activeFaces[index].bind(tab.label, tab.activeIcon, tab.activeLabel, metrics, activeRaster)
    }
    if (removedFaces || reactChildren.isNotEmpty()) routeReactChildren()
  }

  private fun applyAppearance() {
    surfaceFill.setFill(palette.surface, layerOpacity.surface)
    selectedFill.setFill(palette.selectedSurface, layerOpacity.selectedSurface)
    inactiveFaces.forEach { it.setContentColor(palette.inactiveContent, layerOpacity.inactiveContent) }
    activeFaces.forEach { it.setContentColor(palette.activeContent, layerOpacity.activeContent) }
    val radius = touchFeedback.radius * density
    glow.setAppearance(touchFeedback, radius)
    selectedGlow.setAppearance(touchFeedback, radius)
    val glowVisibility = if (touchFeedback.enabled) View.VISIBLE else View.GONE
    glow.visibility = glowVisibility
    selectedGlow.visibility = glowVisibility
  }

  private fun applySelection() {
    val index = requestedIndex
    pill.visibility = if (index >= 0) View.VISIBLE else View.INVISIBLE
    if (hasSelection) {
      motion.selectIndex(index)
      scheduleFrame()
    } else {
      hasSelection = true
      motion.snapToIndex(index)
    }
    applyPill()
  }

  private fun hostFor(index: Int): ViewGroup {
    if (index == BACKDROP_CHILD) return backdropHost
    if (index == SELECTED_BACKDROP_CHILD) return selectedBackdropHost
    val tabIndex = (index - FIRST_TAB_CHILD) / 2
    val faces = if ((index - FIRST_TAB_CHILD) % 2 == 0) inactiveFaces else activeFaces
    return faces.getOrNull(tabIndex)?.slot ?: parking
  }

  private fun routeReactChildren() {
    reactChildren.forEachIndexed { index, child ->
      val host = hostFor(index)
      if (child.parent !== host) {
        (child.parent as? ViewGroup)?.removeView(child)
        host.addView(child)
      }
    }
    inactiveFaces.forEach { it.syncSlotChild() }
    activeFaces.forEach { it.syncSlotChild() }
  }

  private fun detach(child: View) {
    (child.parent as? ViewGroup)?.removeView(child)
  }

  private fun layoutContent() {
    motion.setTrack(
      width.toDouble(),
      height.toDouble(),
      tabs.size,
      (metrics.trackInset * density).toDouble(),
      (metrics.pillOverhang * density).toDouble(),
    )
    if (width == 0 || height == 0) return

    surfaceClip.layout(0, 0, width, height)
    backdropHost.layout(0, 0, width, height)
    surfaceFill.layout(0, 0, width, height)
    inactiveRow.layout(0, 0, width, height)
    parking.layout(0, 0, width, height)
    val glowSize = (glow.radius * 2f).roundToInt()
    glow.layout(0, 0, glowSize, glowSize)
    selectedGlow.layout(0, 0, glowSize, glowSize)

    val inset = metrics.trackInset * density
    val overhang = metrics.pillOverhang * density
    val itemHeight = metrics.itemHeight * density
    val tabCount = tabs.size
    val pitch = if (tabCount == 0) 0f else max(0f, (width - inset * 2f - overhang) / tabCount)
    val slotWidth = pitch + overhang

    val pillLeft = inset.roundToInt()
    val pillTop = inset.roundToInt()
    val pillWidth = (inset + slotWidth).roundToInt() - pillLeft
    val pillHeight = (inset + itemHeight).roundToInt() - pillTop
    pill.layout(pillLeft, pillTop, pillLeft + pillWidth, pillTop + pillHeight)
    selectedFill.layout(0, 0, pillWidth, pillHeight)
    for (layer in arrayOf(selectedBackdropHost, pillContent)) {
      layer.layout(-pillLeft, -pillTop, width - pillLeft, height - pillTop)
      layer.pivotX = pillLeft + pillWidth / 2f
      layer.pivotY = pillTop + pillHeight / 2f
    }

    val faceHeight = itemHeight.roundToInt()
    val inactiveTop = ((height - itemHeight) / 2f).roundToInt()
    for (index in 0 until tabCount) {
      val left = (inset + pitch * index).roundToInt()
      val right = (inset + pitch * index + slotWidth).roundToInt()
      inactiveFaces[index].place(left, inactiveTop, right - left, faceHeight)
      activeFaces[index].place(left, pillTop, right - left, faceHeight)
    }

    applyInteraction()
  }

  private fun applyInteraction() {
    val pressedScale = motion.pressedScale
    val distortionScaleX = motion.distortionScaleX
    val originOffset = motion.pointerOriginX - width / 2.0
    scaleX = (pressedScale * distortionScaleX).toFloat()
    scaleY = pressedScale.toFloat()
    translationX = (pressedScale * (originOffset + distortionScaleX * (motion.panelTranslateX - originOffset))).toFloat()
    translationY = (pressedScale * motion.translateY).toFloat()

    val tabScale = motion.activeTabScale
    val isBarEnlarged = pressedScale > PRESSED_RASTER_THRESHOLD
    val isActiveTabEnlarged = pressedScale * tabScale > PRESSED_RASTER_THRESHOLD
    for (face in activeFaces) {
      face.scaleX = tabScale.toFloat()
      face.scaleY = tabScale.toFloat()
      face.setPressedRaster(isActiveTabEnlarged)
    }
    for (face in inactiveFaces) {
      face.setPressedRaster(isBarEnlarged)
    }

    applyPill()
    applyGlow()
  }

  private fun applyPill() {
    val offset = motion.pillOffsetX.toFloat()
    val pillScaleX = motion.pillScaleXValue.toFloat()
    val pillScaleY = motion.pillScaleYValue.toFloat()
    pill.translationX = offset
    pill.scaleX = pillScaleX
    pill.scaleY = pillScaleY
    for (layer in arrayOf(selectedBackdropHost, pillContent)) {
      layer.translationX = -offset / pillScaleX
      layer.scaleX = 1f / pillScaleX
      layer.scaleY = 1f / pillScaleY
    }
  }

  private fun applyGlow() {
    val opacity = motion.glowOpacity.toFloat()
    glow.alpha = opacity
    selectedGlow.alpha = opacity
    if (opacity > 0f) {
      val glowX = motion.pointerOriginX.toFloat() - glow.radius
      val glowY = motion.pointerLocalY.toFloat() - glow.radius
      glow.translationX = glowX
      glow.translationY = glowY
      selectedGlow.translationX = glowX
      selectedGlow.translationY = glowY
    }
  }
}
