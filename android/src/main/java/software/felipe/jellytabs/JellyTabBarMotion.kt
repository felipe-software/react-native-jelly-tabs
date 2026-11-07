package software.felipe.jellytabs

import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sign

private const val MAX_FRAME_DELTA_SECONDS = 0.064
private const val POSITION_REST = 0.001
private const val FILTERED_VELOCITY_REST = 0.02
private const val PRESS_REST = 0.01
private const val PILL_SCALE_REST = 0.002
private const val BAR_SCALE_REST = 0.001
private const val GLOW_REST = 0.03
private const val PANEL_REST_DP = 2.0
private const val TRANSLATE_REST_DP = 0.1

internal const val ACTIVE_TAB_PRESSED_GROWTH = 0.2
private const val TAP_SLOP_DP = 4.0

private const val EASE_OUT_CONTROL_POINT_X = 0.58
private const val EASE_OUT_SEARCH_ITERATIONS = 10

private fun cubicBezierCoordinate(parameter: Double, secondControlPoint: Double): Double {
  val inverse = 1.0 - parameter
  return parameter * parameter * (3.0 * inverse * secondControlPoint + parameter)
}

private fun easeOut(input: Double): Double {
  val x = input.coerceIn(0.0, 1.0)
  var low = 0.0
  var high = 1.0
  var parameter = x
  repeat(EASE_OUT_SEARCH_ITERATIONS) {
    if (cubicBezierCoordinate(parameter, EASE_OUT_CONTROL_POINT_X) < x) {
      low = parameter
    } else {
      high = parameter
    }
    parameter = (low + high) / 2.0
  }
  return cubicBezierCoordinate(parameter, 1.0)
}

private fun rubberBand(distance: Double, dimension: Double, coefficient: Double): Double {
  if (distance == 0.0 || dimension <= 0.0) return 0.0
  val damped = (1.0 - 1.0 / (abs(distance) * coefficient / dimension + 1.0)) * dimension
  return sign(distance) * damped
}

internal class JellyTabBarMotion(density: Float, private val reducedMotion: Boolean) {
  private val density = density.toDouble()
  private var config = JellyMotionConfig()

  private var trackWidth = 0.0
  private var trackHeight = 0.0
  private var trackInset = 0.0
  private var pillOverhang = 0.0
  private var tabCount = 0

  private val position = Spring(0.0, config.valueSpring.toSpec(), POSITION_REST)
  private val filteredVelocity = Spring(0.0, config.velocitySpring.toSpec(), FILTERED_VELOCITY_REST)
  private val panelOffset = Spring(0.0, config.panelSpring.toSpec(), PANEL_REST_DP * this.density)
  private val press = Spring(0.0, config.pressSpring.toSpec(), PRESS_REST)
  private val pillScaleX = Spring(1.0, config.scaleXSpring.toSpec(), PILL_SCALE_REST)
  private val pillScaleY = Spring(1.0, config.scaleYSpring.toSpec(), PILL_SCALE_REST)
  private val barTranslateY = Spring(0.0, config.barSpec(), TRANSLATE_REST_DP * this.density)
  private val barScaleX = Spring(1.0, config.barSpec(), BAR_SCALE_REST)
  private val barPressedScale = Spring(1.0, config.barSpec(), BAR_SCALE_REST)
  private val glowOpacitySpring = Spring(0.0, config.barSpec(), GLOW_REST)

  private var positionTarget = 0.0
  private var pressTarget = 0.0
  private var pillScaleTarget = 1.0
  private var barPressedScaleTarget = 1.0
  private var glowOpacityTarget = 0.0

  private var isDragging = false
  private var isReleasePending = false
  private var isBarScaleSettling = false
  private var dragStartTarget = 0.0
  private var dragStartPanelOffset = 0.0
  private var dragStartTranslateY = 0.0
  private var downX = 0.0
  private var movedDistance = 0.0

  var pointerOriginX = 0.0
    private set
  var pointerLocalY = 0.0
    private set

  private val maxTabIndex get() = max(0, tabCount - 1)
  private val tabPitch get() = if (tabCount > 0) max(0.0, (trackWidth - trackInset * 2.0 - pillOverhang) / tabCount) else 0.0

  val pillOffsetX get() = position.value * tabPitch
  val activeTabScale get() = 1.0 + ACTIVE_TAB_PRESSED_GROWTH * press.value
  val glowOpacity get() = glowOpacitySpring.value.coerceIn(0.0, 1.0)
  val pressedScale get() = barPressedScale.value
  val distortionScaleX get() = barScaleX.value
  val translateY get() = barTranslateY.value
  val maxPressedScale get() = max(1.0, config.barPressedScale)

  val pillScaleXValue: Double
    get() = pillScaleX.value / (1.0 - (velocityScale() * 0.75).coerceIn(-0.2, 0.2))
  val pillScaleYValue: Double
    get() = pillScaleY.value * (1.0 - (velocityScale() * 0.25).coerceIn(-0.2, 0.2))

  val panelTranslateX: Double
    get() {
      if (trackWidth <= 0.0) return 0.0
      val fraction = (panelOffset.value / trackWidth).coerceIn(-1.0, 1.0)
      if (fraction == 0.0) return 0.0
      return sign(fraction) * config.panelOffset * density * easeOut(abs(fraction))
    }

  val isActive: Boolean
    get() = isReleasePending ||
      isBarScaleSettling ||
      !position.isAtRest(positionTarget) ||
      !filteredVelocity.isAtRest(0.0) ||
      !press.isAtRest(pressTarget) ||
      !pillScaleX.isAtRest(pillScaleTarget) ||
      !pillScaleY.isAtRest(pillScaleTarget) ||
      !barPressedScale.isAtRest(barPressedScaleTarget) ||
      !glowOpacitySpring.isAtRest(glowOpacityTarget) ||
      (!isDragging && (!panelOffset.isAtRest(0.0) || !barTranslateY.isAtRest(0.0) || !barScaleX.isAtRest(1.0)))

  private fun velocityScale() = filteredVelocity.value / 10.0

  private fun clampIndex(index: Double) = index.coerceIn(0.0, maxTabIndex.toDouble())

  private fun tabIndexAt(localX: Double) = clampIndex(floor((localX - trackInset - pillOverhang / 2.0) / tabPitch))

  fun indexAt(localX: Double) = if (tabPitch > 0.0) tabIndexAt(localX).toInt() else 0

  fun setConfig(next: JellyMotionConfig) {
    if (next == config) return
    config = next
    position.spec = next.valueSpring.toSpec()
    filteredVelocity.spec = next.velocitySpring.toSpec()
    panelOffset.spec = next.panelSpring.toSpec()
    press.spec = next.pressSpring.toSpec()
    pillScaleX.spec = next.scaleXSpring.toSpec()
    pillScaleY.spec = next.scaleYSpring.toSpec()
    val barSpec = next.barSpec()
    barTranslateY.spec = barSpec
    barScaleX.spec = barSpec
    barPressedScale.spec = barSpec
    glowOpacitySpring.spec = barSpec
    if (isDragging) {
      barPressedScaleTarget = next.barPressedScale
      pillScaleTarget = next.pillPressedScale
    }
  }

  fun setTrack(width: Double, height: Double, count: Int, inset: Double, overhang: Double) {
    trackWidth = width
    trackHeight = height
    tabCount = count
    trackInset = inset
    pillOverhang = overhang
    if (!isDragging) {
      pointerOriginX = width / 2.0
      pointerLocalY = height / 2.0
    }
    positionTarget = clampIndex(positionTarget)
  }

  fun snapToIndex(index: Int) {
    val initial = max(index, 0).toDouble()
    position.snapTo(initial)
    positionTarget = initial
  }

  fun selectIndex(index: Int) {
    if (index >= 0) positionTarget = clampIndex(index.toDouble())
    isReleasePending = true
    pressTarget = 0.0
    pillScaleTarget = 1.0
  }

  fun activateIndex(index: Int) {
    if (tabCount == 0) return
    positionTarget = clampIndex(index.toDouble())
    isReleasePending = true
  }

  fun begin(localX: Double, localY: Double) {
    barTranslateY.velocity = 0.0
    barScaleX.velocity = 0.0
    panelOffset.velocity = 0.0
    dragStartTranslateY = barTranslateY.value
    dragStartPanelOffset = panelOffset.value
    barPressedScale.velocity = 0.0
    glowOpacitySpring.velocity = 0.0
    barPressedScaleTarget = config.barPressedScale
    glowOpacityTarget = 1.0
    isBarScaleSettling = false

    downX = localX
    movedDistance = 0.0
    pointerOriginX = localX.coerceIn(0.0, trackWidth)
    pointerLocalY = localY.coerceIn(0.0, trackHeight)

    if (config.snapOnPointerDown && tabPitch > 0.0) positionTarget = tabIndexAt(localX)
    dragStartTarget = positionTarget
    isDragging = true
    isReleasePending = false
    pressTarget = 1.0
    pillScaleTarget = config.pillPressedScale
  }

  fun drag(translationX: Double, translationY: Double, pointerDeltaX: Double) {
    if (tabPitch <= 0.0) return

    positionTarget = clampIndex(dragStartTarget + translationX / tabPitch)
    panelOffset.snapTo(dragStartPanelOffset + translationX)

    val distortionDistance = max(config.verticalDistortionDistance * density, 0.0001)
    val verticalProgress = min(abs(translationY) / distortionDistance, 1.0)
    barTranslateY.snapTo(dragStartTranslateY + rubberBand(translationY, trackHeight, config.verticalRubberBand) * config.verticalFollow)
    barScaleX.snapTo(1.0 - verticalProgress * config.verticalDistortion)
    pointerOriginX = (downX + pointerDeltaX).coerceIn(0.0, trackWidth)
    movedDistance = max(movedDistance, max(abs(translationX), abs(translationY)))
  }

  fun finish(): Int {
    isDragging = false
    panelOffset.velocity = 0.0
    barPressedScaleTarget = 1.0
    glowOpacityTarget = 0.0
    isBarScaleSettling = true

    val isTap = movedDistance < TAP_SLOP_DP * density && tabPitch > 0.0
    val nextIndex = if (isTap) tabIndexAt(downX) else clampIndex(positionTarget.roundToInt().toDouble())
    positionTarget = nextIndex
    isReleasePending = true
    return nextIndex.toInt()
  }

  fun step(rawDeltaSeconds: Double) {
    val deltaSeconds = min(rawDeltaSeconds, MAX_FRAME_DELTA_SECONDS)

    positionTarget = clampIndex(positionTarget)
    position.advance(positionTarget, deltaSeconds)

    val velocityTarget = if (isDragging && maxTabIndex > 0) position.velocity / maxTabIndex else 0.0
    filteredVelocity.advance(velocityTarget, deltaSeconds)

    if (!isDragging) panelOffset.advance(0.0, deltaSeconds)

    if (isReleasePending) {
      val releaseDistance = max(1, maxTabIndex) * config.releaseDistanceFraction
      if (abs(position.value - positionTarget) < releaseDistance) {
        isReleasePending = false
        pressTarget = 0.0
        pillScaleTarget = 1.0
      }
    }

    press.advance(pressTarget, deltaSeconds)
    pillScaleX.advance(pillScaleTarget, deltaSeconds)
    pillScaleY.advance(pillScaleTarget, deltaSeconds)
    advanceBar(deltaSeconds)
  }

  private fun advanceBar(deltaSeconds: Double) {
    advanceBarSpring(barPressedScale, barPressedScaleTarget, deltaSeconds)
    advanceBarSpring(glowOpacitySpring, glowOpacityTarget, deltaSeconds)
    if (isDragging) return

    advanceBarSpring(barTranslateY, 0.0, deltaSeconds)
    advanceBarSpring(barScaleX, 1.0, deltaSeconds)
    if (isBarScaleSettling && barScaleX.isAtRest(1.0)) {
      pointerOriginX = trackWidth / 2.0
      isBarScaleSettling = false
    }
  }

  private fun advanceBarSpring(spring: Spring, target: Double, deltaSeconds: Double) {
    if (reducedMotion) {
      spring.snapTo(target)
    } else {
      spring.advance(target, deltaSeconds)
    }
  }
}
