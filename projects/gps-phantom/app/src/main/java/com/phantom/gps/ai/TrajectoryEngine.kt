package com.phantom.gps.ai

import android.content.Context
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.util.*

/**
 * TrajectoryEngine handles the on-device inference for the AI trajectory model.
 * It takes a start point, end point, and transport mode, and generates a sequence
 * of realistic GPS fixes.
 */
class TrajectoryEngine(private val context: Context) {

    private var interpreter: Interpreter? = null

    init {
        try {
            interpreter = Interpreter(loadModelFile())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun loadModelFile(): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd("trajectory_model.tflite")
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    /**
     * Generates the next GPS fix based on the current state and target.
     * Input: [start_lat, start_lng, end_lat, end_lng, transport_mode, time_elapsed]
     * Output: [lat, lng, speed, bearing, altitude, accuracy]
     */
    fun generateNextFix(
        startLat: Double, startLng: Double,
        endLat: Double, endLng: Double,
        mode: Int, timeElapsed: Float
    ): SimulatedFix {
        val input = arrayOf(floatArrayOf(
            startLat.toFloat(), startLng.toFloat(),
            endLat.toFloat(), endLng.toFloat(),
            mode.toFloat(), timeElapsed
        ))
        
        val output = Array(1) { FloatArray(6) }
        
        interpreter?.run(input, output)
        
        val result = output[0]
        return SimulatedFix(
            latitude = result[0].toDouble(),
            longitude = result[1].toDouble(),
            speed = result[2],
            bearing = result[3],
            altitude = result[4].toDouble(),
            accuracy = result[5],
            timestamp = System.currentTimeMillis()
        )
    }

    fun close() {
        interpreter?.close()
    }
}

data class SimulatedFix(
    val latitude: Double,
    val longitude: Double,
    val speed: Float,
    val bearing: Float,
    val altitude: Double,
    val accuracy: Float,
    val timestamp: Long
)
