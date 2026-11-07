package software.felipe.jellytabs

import android.graphics.Color

internal const val ICON_KIND_PATH = "path"
internal const val ICON_KIND_GLYPH = "glyph"
internal const val ICON_KIND_REACT = "react"

internal data class JellyIcon(
  val kind: String = ICON_KIND_REACT,
  val path: String? = null,
  val viewBox: Float = 24f,
  val fontFamily: String? = null,
  val glyph: String? = null,
) {
  val isBaked get() = (kind == ICON_KIND_PATH && !path.isNullOrEmpty()) || (kind == ICON_KIND_GLYPH && !glyph.isNullOrEmpty())
}

internal data class JellyLabelStyle(
  val color: Int? = null,
  val fontFamily: String? = null,
  val fontSize: Float = 11f,
  val fontWeight: Int = 400,
  val italic: Boolean = false,
  val letterSpacing: Float = 0f,
)

internal data class JellyTab(
  val label: String = "",
  val activeIcon: JellyIcon = JellyIcon(),
  val inactiveIcon: JellyIcon = JellyIcon(),
  val activeLabel: JellyLabelStyle = JellyLabelStyle(fontWeight = 600),
  val inactiveLabel: JellyLabelStyle = JellyLabelStyle(fontWeight = 500),
)

internal data class JellyPalette(
  val surface: Int = Color.parseColor("#22211F"),
  val selectedSurface: Int = Color.parseColor("#F2EEE7"),
  val activeContent: Int = Color.parseColor("#11100F"),
  val inactiveContent: Int = Color.parseColor("#B8B4AD"),
)

internal data class JellyLayerOpacity(
  val surface: Float = 1f,
  val selectedSurface: Float = 1f,
  val activeContent: Float = 1f,
  val inactiveContent: Float = 1f,
)

internal data class JellyMetrics(
  val trackHeight: Float = 64f,
  val itemHeight: Float = 56f,
  val trackInset: Float = 4f,
  val iconSize: Float = 28f,
  val labelPadding: Float = 4f,
  val iconLabelGap: Float = 1f,
  val pillOverhang: Float = 8f,
)

internal data class JellySpring(val stiffness: Double, val dampingRatio: Double) {
  fun toSpec() = SpringSpec(stiffness, dampingRatio)
}

internal data class JellyMotionConfig(
  val pillPressedScale: Double = 1.2,
  val snapOnPointerDown: Boolean = true,
  val releaseDistanceFraction: Double = 0.025,
  val panelSpring: JellySpring = JellySpring(300.0, 1.0),
  val pressSpring: JellySpring = JellySpring(1_000.0, 1.0),
  val scaleXSpring: JellySpring = JellySpring(250.0, 0.6),
  val scaleYSpring: JellySpring = JellySpring(250.0, 0.7),
  val valueSpring: JellySpring = JellySpring(1_000.0, 1.0),
  val velocitySpring: JellySpring = JellySpring(300.0, 0.5),
  val barPressedScale: Double = 1.1,
  val barSpringStiffness: Double = 240.0,
  val barSpringDamping: Double = 18.0,
  val barSpringMass: Double = 0.9,
  val verticalDistortion: Double = 0.08,
  val verticalDistortionDistance: Double = 700.0,
  val verticalFollow: Double = 0.25,
  val verticalRubberBand: Double = 0.14,
  val panelOffset: Double = 4.0,
) {
  fun barSpec() = SpringSpec.fromPhysics(barSpringStiffness, barSpringDamping, barSpringMass)
}

internal data class JellyTouchFeedback(
  val enabled: Boolean = true,
  val color: Int = Color.parseColor("#F2EEE7"),
  val centerOpacity: Float = 0.15f,
  val middleOpacity: Float = 0.0645f,
  val radius: Float = 300f,
)
