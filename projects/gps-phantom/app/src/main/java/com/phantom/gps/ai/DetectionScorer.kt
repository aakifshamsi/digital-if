package com.phantom.gps.ai

import kotlin.math.*

/**
 * DetectionScorer scores how "detectable" a generated fix is by running
 * the same detection algorithms apps use.
 */
class DetectionScorer {

    enum class DetectionRisk {
        SAFE, CAUTION, REGENERATE
    }

    data class ScoringResult(
        val overall: Float,
        val breakdown: List<Float>,
        val risk: DetectionRisk
    )

    /**
     * Scores a generated fix against historical data.
     */
    fun scoreFix(current: SimulatedFix, history: List<SimulatedFix>): ScoringResult {
        val scores = mutableListOf<Float>()

        // 1. Speed consistency: does speed match distance/time?
        if (history.isNotEmpty()) {
            scores.add(checkSpeedConsistency(current, history.last()))
        } else {
            scores.add(0.0f)
        }

        // 2. Bearing consistency: does bearing match movement direction?
        if (history.isNotEmpty()) {
            scores.add(checkBearingConsistency(current, history.last()))
        } else {
            scores.add(0.0f)
        }

        // 3. Accuracy pattern: is accuracy suspiciously uniform?
        scores.add(checkAccuracyVariance(history.map { it.accuracy } + current.accuracy))

        // 4. Altitude plausibility: does altitude match terrain?
        scores.add(checkAltitudeProfile(current, history))

        // 5. Timing jitter: are fixes arriving at exact intervals?
        scores.add(checkTimingJitter(history.map { it.timestamp } + current.timestamp))

        val average = scores.average().toFloat()
        val risk = when {
            average > 0.7f -> DetectionRisk.REGENERATE
            average > 0.4f -> DetectionRisk.CAUTION
            else -> DetectionRisk.SAFE
        }

        return ScoringResult(average, scores, risk)
    }

    private fun checkSpeedConsistency(current: SimulatedFix, last: SimulatedFix): Float {
        val distance = calculateDistance(current.latitude, current.longitude, last.latitude, last.longitude)
        val timeDelta = (current.timestamp - last.timestamp) / 1000.0
        if (timeDelta <= 0) return 1.0f
        
        val calculatedSpeed = (distance / timeDelta).toFloat()
        val speedDiff = abs(calculatedSpeed - current.speed)
        
        // If difference is more than 5 m/s, it's suspicious
        return min(1.0f, speedDiff / 5.0f)
    }

    private fun checkBearingConsistency(current: SimulatedFix, last: SimulatedFix): Float {
        val calculatedBearing = calculateBearing(last.latitude, last.longitude, current.latitude, current.longitude)
        val bearingDiff = abs(normalizeDegree(calculatedBearing - current.bearing))
        
        // If difference is more than 30 degrees, it's suspicious
        return min(1.0f, bearingDiff / 30.0f)
    }

    private fun checkAccuracyVariance(accuracies: List<Float>): Float {
        if (accuracies.size < 5) return 0.0f
        val mean = accuracies.average()
        val variance = accuracies.map { (it - mean).pow(2) }.average()
        
        // Suspiciously low variance (perfectly uniform accuracy) is a signal
        return if (variance < 0.01) 0.8f else 0.0f
    }

    private fun checkAltitudeProfile(current: SimulatedFix, history: List<SimulatedFix>): Float {
        // Simplified: check for sudden altitude jumps
        if (history.isEmpty()) return 0.0f
        val altDiff = abs(current.altitude - history.last().altitude)
        return min(1.0f, (altDiff / 10.0).toFloat())
    }

    private fun checkTimingJitter(timestamps: List<Long>): Float {
        if (timestamps.size < 5) return 0.0f
        val intervals = mutableListOf<Long>()
        for (i in 1 until timestamps.size) {
            intervals.add(timestamps[i] - timestamps[i-1])
        }
        val mean = intervals.average()
        val variance = intervals.map { (it - mean).pow(2) }.average()
        
        // Perfectly 1000ms intervals are suspicious
        return if (variance < 1.0) 0.9f else 0.0f
    }

    // Helper functions
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371000.0 // Earth radius in meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) + cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    private fun calculateBearing(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Float {
        val dLon = Math.toRadians(lon2 - lon1)
        val y = sin(dLon) * cos(Math.toRadians(lat2))
        val x = cos(Math.toRadians(lat1)) * sin(Math.toRadians(lat2)) - sin(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * cos(dLon)
        return Math.toDegrees(atan2(y, x)).toFloat()
    }

    private fun normalizeDegree(degree: Float): Float {
        var d = degree % 360
        if (d > 180) d -= 360
        if (d < -180) d += 360
        return d
    }
}
