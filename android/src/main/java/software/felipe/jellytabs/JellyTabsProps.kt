package software.felipe.jellytabs

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

private fun ReadableMap.has(key: String) = hasKey(key) && !isNull(key)

private fun ReadableMap.double(key: String, fallback: Double) = if (has(key)) getDouble(key) else fallback

private fun ReadableMap.float(key: String, fallback: Float) = if (has(key)) getDouble(key).toFloat() else fallback

private fun ReadableMap.color(key: String, fallback: Int) = colorOrNull(key) ?: fallback

private fun ReadableMap.colorOrNull(key: String) = if (has(key)) getDouble(key).toLong().toInt() else null

private fun ReadableMap.boolean(key: String, fallback: Boolean) = if (has(key)) getBoolean(key) else fallback

private fun ReadableMap.string(key: String) = if (has(key)) getString(key) else null

private fun ReadableMap.map(key: String) = if (has(key)) getMap(key) else null

private fun ReadableMap?.toIcon(): JellyIcon {
  if (this == null) return JellyIcon()
  return JellyIcon(
    kind = string("kind") ?: ICON_KIND_REACT,
    path = string("path"),
    viewBox = float("viewBox", 24f),
    fontFamily = string("fontFamily"),
    glyph = string("glyph"),
  )
}

private fun ReadableMap?.toLabelStyle(defaultWeight: Int): JellyLabelStyle {
  if (this == null) return JellyLabelStyle(fontWeight = defaultWeight)
  return JellyLabelStyle(
    color = colorOrNull("color"),
    fontFamily = string("fontFamily"),
    fontSize = float("fontSize", 11f),
    fontWeight = double("fontWeight", defaultWeight.toDouble()).toInt(),
    italic = boolean("italic", false),
    letterSpacing = float("letterSpacing", 0f),
  )
}

internal fun ReadableArray.toTabs(): List<JellyTab> =
  (0 until size()).mapNotNull { index ->
    val tab = getMap(index) ?: return@mapNotNull null
    JellyTab(
      label = tab.string("label") ?: "",
      activeIcon = tab.map("activeIcon").toIcon(),
      inactiveIcon = tab.map("inactiveIcon").toIcon(),
      activeLabel = tab.map("activeLabel").toLabelStyle(defaultWeight = 600),
      inactiveLabel = tab.map("inactiveLabel").toLabelStyle(defaultWeight = 500),
    )
  }

internal fun ReadableMap.toPalette(): JellyPalette {
  val defaults = JellyPalette()
  return JellyPalette(
    surface = color("surface", defaults.surface),
    selectedSurface = color("selectedSurface", defaults.selectedSurface),
    activeContent = color("activeContent", defaults.activeContent),
    inactiveContent = color("inactiveContent", defaults.inactiveContent),
  )
}

internal fun ReadableMap.toLayerOpacity() = JellyLayerOpacity(
  surface = float("surface", 1f),
  selectedSurface = float("selectedSurface", 1f),
  activeContent = float("activeContent", 1f),
  inactiveContent = float("inactiveContent", 1f),
)

internal fun ReadableMap.toMetrics(): JellyMetrics {
  val defaults = JellyMetrics()
  return JellyMetrics(
    trackHeight = float("trackHeight", defaults.trackHeight),
    itemHeight = float("itemHeight", defaults.itemHeight),
    trackInset = float("trackInset", defaults.trackInset),
    iconSize = float("iconSize", defaults.iconSize),
    labelPadding = float("labelPadding", defaults.labelPadding),
    iconLabelGap = float("iconLabelGap", defaults.iconLabelGap),
    pillOverhang = float("pillOverhang", defaults.pillOverhang),
  )
}

private fun ReadableMap?.toSpring(fallback: JellySpring): JellySpring {
  if (this == null) return fallback
  return JellySpring(double("stiffness", fallback.stiffness), double("dampingRatio", fallback.dampingRatio))
}

internal fun ReadableMap.toMotionConfig(): JellyMotionConfig {
  val defaults = JellyMotionConfig()
  val springs = map("springs")
  val barSpring = map("barSpring")
  return JellyMotionConfig(
    pillPressedScale = double("pillPressedScale", defaults.pillPressedScale),
    snapOnPointerDown = boolean("snapOnPointerDown", defaults.snapOnPointerDown),
    releaseDistanceFraction = double("releaseDistanceFraction", defaults.releaseDistanceFraction),
    panelSpring = springs?.map("panel").toSpring(defaults.panelSpring),
    pressSpring = springs?.map("press").toSpring(defaults.pressSpring),
    scaleXSpring = springs?.map("scaleX").toSpring(defaults.scaleXSpring),
    scaleYSpring = springs?.map("scaleY").toSpring(defaults.scaleYSpring),
    valueSpring = springs?.map("value").toSpring(defaults.valueSpring),
    velocitySpring = springs?.map("velocity").toSpring(defaults.velocitySpring),
    barPressedScale = double("barPressedScale", defaults.barPressedScale),
    barSpringStiffness = barSpring?.double("stiffness", defaults.barSpringStiffness) ?: defaults.barSpringStiffness,
    barSpringDamping = barSpring?.double("damping", defaults.barSpringDamping) ?: defaults.barSpringDamping,
    barSpringMass = barSpring?.double("mass", defaults.barSpringMass) ?: defaults.barSpringMass,
    verticalDistortion = double("verticalDistortion", defaults.verticalDistortion),
    verticalDistortionDistance = double("verticalDistortionDistance", defaults.verticalDistortionDistance),
    verticalFollow = double("verticalFollow", defaults.verticalFollow),
    verticalRubberBand = double("verticalRubberBand", defaults.verticalRubberBand),
    panelOffset = double("panelOffset", defaults.panelOffset),
  )
}

internal fun ReadableMap.toTouchFeedback(): JellyTouchFeedback {
  val defaults = JellyTouchFeedback()
  return JellyTouchFeedback(
    enabled = boolean("enabled", defaults.enabled),
    color = color("color", defaults.color),
    centerOpacity = float("centerOpacity", defaults.centerOpacity),
    middleOpacity = float("middleOpacity", defaults.middleOpacity),
    radius = float("radius", defaults.radius),
  )
}
