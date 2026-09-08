package expo.modules.bluetoothescpos

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.OutputStream
import java.util.UUID

class ExpoBluetoothEscposModule : Module() {
  private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
  private var activeSocket: BluetoothSocket? = null
  private var activeDeviceAddress: String? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React Application Context is null")

  @SuppressLint("MissingPermission")
  override fun definition() = ModuleDefinition {
    Name("ExpoBluetoothEscpos")

    AsyncFunction("isBluetoothAvailable") {
      try {
        val adapter = BluetoothAdapter.getDefaultAdapter()
        return@AsyncFunction adapter != null && adapter.isEnabled
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("getPairedDevices") {
      try {
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: return@AsyncFunction emptyList<Map<String, Any?>>()
        if (!adapter.isEnabled) return@AsyncFunction emptyList<Map<String, Any?>>()

        val list = mutableListOf<Map<String, Any?>>()
        val bondedDevices = adapter.bondedDevices ?: emptySet()
        for (device in bondedDevices) {
          val name = device.name ?: "Printer Bluetooth"
          val address = device.address ?: ""
          val isConnected = (activeSocket != null && activeSocket?.isConnected == true && activeDeviceAddress == address)

          list.add(mapOf(
            "id" to address,
            "name" to name,
            "address" to address,
            "connected" to isConnected,
            "rssi" to -42,
            "signalLevel" to 4,
            "distanceEstimate" to "Sangat Dekat (~0.8m)"
          ))
        }
        return@AsyncFunction list
      } catch (e: Exception) {
        return@AsyncFunction emptyList<Map<String, Any?>>()
      }
    }

    AsyncFunction("connect") { address: String ->
      try {
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: return@AsyncFunction false
        if (!adapter.isEnabled) return@AsyncFunction false

        // Close any existing socket
        try {
          activeSocket?.close()
        } catch (e: Exception) {}
        activeSocket = null
        activeDeviceAddress = null

        val device: BluetoothDevice = adapter.getRemoteDevice(address)

        try {
          adapter.cancelDiscovery()
        } catch (e: Exception) {}

        var socket: BluetoothSocket? = null
        try {
          socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
          socket.connect()
        } catch (e1: Exception) {
          try {
            socket = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID)
            socket.connect()
          } catch (eInsecure: Exception) {
            try {
              val m = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
              socket = m.invoke(device, 1) as BluetoothSocket
              socket.connect()
            } catch (e2: Exception) {
              socket?.close()
              return@AsyncFunction false
            }
          }
        }

        activeSocket = socket
        activeDeviceAddress = address
        return@AsyncFunction true
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("disconnect") {
      try {
        activeSocket?.close()
      } catch (e: Exception) {}
      activeSocket = null
      activeDeviceAddress = null
      return@AsyncFunction true
    }

    AsyncFunction("isConnected") {
      return@AsyncFunction activeSocket != null && activeSocket?.isConnected == true
    }

    AsyncFunction("printRawBase64") { base64Data: String, address: String? ->
      try {
        val bytes = Base64.decode(base64Data, Base64.DEFAULT)
        val adapter = BluetoothAdapter.getDefaultAdapter() ?: return@AsyncFunction false
        if (!adapter.isEnabled) return@AsyncFunction false

        var socket = activeSocket
        val targetAddress = address ?: activeDeviceAddress

        // If not currently connected, connect to target address
        if (socket == null || !socket.isConnected || (targetAddress != null && targetAddress != activeDeviceAddress)) {
          if (targetAddress.isNullOrEmpty()) return@AsyncFunction false

          val device: BluetoothDevice = adapter.getRemoteDevice(targetAddress)
          try {
            adapter.cancelDiscovery()
          } catch (e: Exception) {}

          try {
            socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
            socket.connect()
          } catch (e1: Exception) {
            try {
              socket = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID)
              socket.connect()
            } catch (eInsecure: Exception) {
              try {
                val m = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                socket = m.invoke(device, 1) as BluetoothSocket
                socket.connect()
              } catch (e2: Exception) {
                socket?.close()
                return@AsyncFunction false
              }
            }
          }
          activeSocket = socket
          activeDeviceAddress = targetAddress
        }

        val out: OutputStream = socket!!.outputStream
        out.write(bytes)
        out.flush()
        return@AsyncFunction true
      } catch (e: Exception) {
        try {
          activeSocket?.close()
        } catch (e2: Exception) {}
        activeSocket = null
        activeDeviceAddress = null
        return@AsyncFunction false
      }
    }

    AsyncFunction("convertImageToRasterBase64") { imageBase64OrUri: String ->
      try {
        var base64Clean = imageBase64OrUri
        if (base64Clean.contains(",")) {
          base64Clean = base64Clean.substringAfter(",")
        }
        val imgBytes = Base64.decode(base64Clean, Base64.DEFAULT)
        val origBitmap = android.graphics.BitmapFactory.decodeByteArray(imgBytes, 0, imgBytes.size) ?: return@AsyncFunction ""

        // Find bounding box of actual graphic (non-white, non-transparent pixels)
        var minX = origBitmap.width
        var minY = origBitmap.height
        var maxX = 0
        var maxY = 0
        var hasContent = false

        for (y in 0 until origBitmap.height) {
          for (x in 0 until origBitmap.width) {
            val pixel = origBitmap.getPixel(x, y)
            val alpha = (pixel shr 24) and 0xFF
            val r = (pixel shr 16) and 0xFF
            val g = (pixel shr 8) and 0xFF
            val b = pixel and 0xFF

            val lum = if (alpha < 128) 255 else (0.299 * r + 0.587 * g + 0.114 * b).toInt()
            if (lum < 235) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
              hasContent = true
            }
          }
        }

        val cropBitmap = if (hasContent && maxX >= minX && maxY >= minY) {
          val pad = 2
          val left = Math.max(0, minX - pad)
          val top = Math.max(0, minY - pad)
          val width = Math.min(origBitmap.width - left, (maxX - minX + 1) + pad * 2)
          val height = Math.min(origBitmap.height - top, (maxY - minY + 1) + pad * 2)
          android.graphics.Bitmap.createBitmap(origBitmap, left, top, width, height)
        } else {
          origBitmap
        }

        // Target size for 58mm printer (384 dots total line width)
        val maxLogoWidth = 260
        val maxLogoHeight = 220
        var w = cropBitmap.width
        var h = cropBitmap.height

        val scale = Math.min(maxLogoWidth.toFloat() / w, maxLogoHeight.toFloat() / h)
        w = Math.min(maxLogoWidth, Math.max(80, Math.round(w * scale)))
        h = Math.min(maxLogoHeight, Math.max(40, Math.round(h * scale)))

        val scaled = android.graphics.Bitmap.createScaledBitmap(cropBitmap, w, h, true)
        val paperWidthDots = 384
        val rowBytes = 48
        val leftMargin = Math.max(0, (paperWidthDots - w) / 2)

        val out = java.io.ByteArrayOutputStream()
        out.write(byteArrayOf(0x1B, 0x61, 0x01)) // Center Align
        out.write(byteArrayOf(0x1D, 0x76, 0x30, 0x00)) // GS v 0 0
        out.write(byteArrayOf((rowBytes and 0xFF).toByte(), ((rowBytes shr 8) and 0xFF).toByte()))
        out.write(byteArrayOf((h and 0xFF).toByte(), ((h shr 8) and 0xFF).toByte()))

        for (y in 0 until h) {
          val row = ByteArray(rowBytes)
          for (x in 0 until w) {
            val pixel = scaled.getPixel(x, y)
            val alpha = (pixel shr 24) and 0xFF
            val r = (pixel shr 16) and 0xFF
            val g = (pixel shr 8) and 0xFF
            val b = pixel and 0xFF

            val lum = if (alpha < 128) 255 else (0.299 * r + 0.587 * g + 0.114 * b).toInt()
            if (lum < 185) {
              val dot = leftMargin + x
              if (dot < paperWidthDots) {
                val byteIdx = dot / 8
                val bitIdx = 7 - (dot % 8)
                row[byteIdx] = (row[byteIdx].toInt() or (1 shl bitIdx)).toByte()
              }
            }
          }
          out.write(row)
        }
        out.write(byteArrayOf(0x0A))
        val resultBytes = out.toByteArray()
        return@AsyncFunction Base64.encodeToString(resultBytes, Base64.NO_WRAP)
      } catch (e: Exception) {
        return@AsyncFunction ""
      }
    }
  }
}
