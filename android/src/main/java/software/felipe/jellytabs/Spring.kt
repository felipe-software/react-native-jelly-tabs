package software.felipe.jellytabs

import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.cosh
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.sin
import kotlin.math.sinh
import kotlin.math.sqrt

private const val REST_VELOCITY_RATIO = 16.0
private const val MIN_DAMPING_RATIO = 0.01

internal class SpringSpec(private val stiffness: Double, dampingRatio: Double) {
  private val dampingRatio = max(dampingRatio, MIN_DAMPING_RATIO)
  private val naturalFrequency = sqrt(max(stiffness, 0.0))
  private val dampingFrequency = this.dampingRatio * naturalFrequency
  private val dampedFrequency = naturalFrequency * sqrt(abs(1.0 - this.dampingRatio * this.dampingRatio))

  fun advance(spring: Spring, target: Double, deltaSeconds: Double) {
    if (naturalFrequency == 0.0) {
      spring.snapTo(target)
      return
    }
    val displacement = spring.value - target
    val velocity = spring.velocity
    when {
      dampingRatio == 1.0 -> advanceCritical(spring, target, displacement, velocity, deltaSeconds)
      dampingRatio > 1.0 -> advanceOverdamped(spring, target, displacement, velocity, deltaSeconds)
      else -> advanceUnderdamped(spring, target, displacement, velocity, deltaSeconds)
    }
  }

  private fun advanceCritical(spring: Spring, target: Double, displacement: Double, velocity: Double, deltaSeconds: Double) {
    val decay = exp(-naturalFrequency * deltaSeconds)
    val coefficient = velocity + naturalFrequency * displacement
    spring.value = target + (displacement + coefficient * deltaSeconds) * decay
    spring.velocity = (velocity - naturalFrequency * coefficient * deltaSeconds) * decay
  }

  private fun advanceUnderdamped(spring: Spring, target: Double, displacement: Double, velocity: Double, deltaSeconds: Double) {
    val decay = exp(-dampingFrequency * deltaSeconds)
    val angle = dampedFrequency * deltaSeconds
    val cosine = cos(angle)
    val sine = sin(angle)
    val positionCoefficient = (velocity + dampingFrequency * displacement) / dampedFrequency
    val velocityCoefficient = (dampingFrequency * velocity + stiffness * displacement) / dampedFrequency
    spring.value = target + decay * (displacement * cosine + positionCoefficient * sine)
    spring.velocity = decay * (velocity * cosine - velocityCoefficient * sine)
  }

  private fun advanceOverdamped(spring: Spring, target: Double, displacement: Double, velocity: Double, deltaSeconds: Double) {
    val decay = exp(-dampingFrequency * deltaSeconds)
    val angle = dampedFrequency * deltaSeconds
    val hyperbolicCosine = cosh(angle)
    val hyperbolicSine = sinh(angle)
    val positionCoefficient = (velocity + dampingFrequency * displacement) / dampedFrequency
    val velocityCoefficient = (dampingFrequency * velocity + stiffness * displacement) / dampedFrequency
    spring.value = target + decay * (displacement * hyperbolicCosine + positionCoefficient * hyperbolicSine)
    spring.velocity = decay * (velocity * hyperbolicCosine - velocityCoefficient * hyperbolicSine)
  }

  companion object {
    fun fromPhysics(stiffness: Double, damping: Double, mass: Double): SpringSpec {
      val safeMass = max(mass, 0.0001)
      val safeStiffness = max(stiffness, 0.0)
      val ratio = if (safeStiffness == 0.0) 1.0 else damping / (2.0 * sqrt(safeStiffness * safeMass))
      return SpringSpec(safeStiffness / safeMass, ratio)
    }
  }
}

internal class Spring(
  initialValue: Double,
  var spec: SpringSpec,
  private val restThreshold: Double,
) {
  var value = initialValue
  var velocity = 0.0

  fun isAtRest(target: Double) =
    abs(value - target) < restThreshold && abs(velocity) < restThreshold * REST_VELOCITY_RATIO

  fun advance(target: Double, deltaSeconds: Double) {
    if (isAtRest(target)) {
      snapTo(target)
    } else {
      spec.advance(this, target, deltaSeconds)
    }
  }

  fun snapTo(target: Double) {
    value = target
    velocity = 0.0
  }
}
