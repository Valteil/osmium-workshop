package com.osmiumworkshop.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.nio.FloatBuffer
import kotlin.math.max

// Local (on-device) WD14 tagging — mobile-shim.js's window.Wd14Local wraps this.
// Models are user-downloaded (no model bundled into the APK — see
// notes/Mobile-Port.md), stored under this app's own files dir, one folder per
// model: <filesDir>/wd14_models/<name>/{model.onnx, tags.csv}. Wholly separate
// from any dataset folder (SAF-backed, handled by DtsStoragePlugin) — these are
// plain app-private files, no permission dance needed.
//
// Preprocessing/postprocessing here matches SmilingWolf's WD14 tagger family
// (wd-swinv2/wd-vit/wd-convnext-tagger-v3 etc. — the de facto standard
// everyone exports these models from): RGB->BGR channel swap, pad to a
// square (centered, white background) then resize to the model's own input
// size (read from the loaded session, not hardcoded — it varies by model),
// float32 in 0-255 range (no /255 normalization), NHWC layout. The model's
// output is already a 0-1 probability per tag (SmilingWolf's ONNX exports
// bake a sigmoid into the graph's final layer — do NOT sigmoid it again,
// that was an early bug here: double-sigmoiding compresses every score into
// ~0.5-0.73 regardless of confidence, pushing nearly the whole vocabulary
// over any reasonable threshold), filtered by a per-category threshold
// (tags.csv's `category` column: 9=rating, 0=general, 4=character —
// character gets its own, usually stricter, threshold).
@CapacitorPlugin(name = "DtsWd14")
class DtsWd14Plugin : Plugin() {

    private val ortEnv by lazy { OrtEnvironment.getEnvironment() }
    private val sessionCache = HashMap<String, OrtSession>()
    private val tagsCache = HashMap<String, List<TagRow>>()

    private data class TagRow(val name: String, val category: Int)

    private fun modelsDir(): File {
        val dir = File(context.filesDir, "wd14_models")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun modelDir(name: String): File = File(modelsDir(), name)

    @PluginMethod
    fun listModels(call: PluginCall) {
        val arr = JSArray()
        val dirs = modelsDir().listFiles { f -> f.isDirectory } ?: arrayOf()
        for (dir in dirs) {
            val modelFile = File(dir, "model.onnx")
            val tagsFile = File(dir, "tags.csv")
            if (!modelFile.exists() || !tagsFile.exists()) continue
            var tagCount = 0
            try {
                BufferedReader(InputStreamReader(tagsFile.inputStream())).use { r ->
                    r.readLine() // header
                    while (r.readLine() != null) tagCount++
                }
            } catch (e: Exception) { /* leave at 0 */ }
            val entry = JSObject()
            entry.put("name", dir.name)
            entry.put("sizeBytes", modelFile.length() + tagsFile.length())
            entry.put("tagCount", tagCount)
            arr.put(entry)
        }
        val ret = JSObject()
        ret.put("models", arr)
        call.resolve(ret)
    }

    @PluginMethod
    fun deleteModel(call: PluginCall) {
        val name = call.getString("name", "") ?: ""
        if (name.isEmpty()) { call.reject("No model name given"); return }
        sessionCache.remove(name)?.close()
        tagsCache.remove(name)
        val dir = modelDir(name)
        if (dir.exists()) dir.deleteRecursively()
        call.resolve()
    }

    // Runs on Capacitor's own background call thread (plugin methods aren't
    // dispatched on the UI thread by default) — a blocking download loop
    // here is fine, doesn't freeze the WebView.
    @PluginMethod
    fun downloadModel(call: PluginCall) {
        val name = call.getString("name", "") ?: ""
        val modelUrl = call.getString("modelUrl", "") ?: ""
        val tagsUrl = call.getString("tagsUrl", "") ?: ""
        if (name.isEmpty() || modelUrl.isEmpty() || tagsUrl.isEmpty()) {
            call.reject("name, modelUrl and tagsUrl are all required")
            return
        }
        val tmpDir = File(modelsDir(), "$name.downloading")
        try {
            tmpDir.deleteRecursively()
            tmpDir.mkdirs()
            downloadFile(modelUrl, File(tmpDir, "model.onnx"), name, "model")
            downloadFile(tagsUrl, File(tmpDir, "tags.csv"), name, "tags")
            val finalDir = modelDir(name)
            finalDir.deleteRecursively()
            if (!tmpDir.renameTo(finalDir)) throw Exception("Could not move downloaded files into place")
            val ret = JSObject()
            ret.put("name", name)
            call.resolve(ret)
        } catch (e: Exception) {
            tmpDir.deleteRecursively()
            call.reject("Download failed: ${e.message}", e)
        }
    }

    private fun downloadFile(urlStr: String, dest: File, modelName: String, part: String) {
        val conn = URL(urlStr).openConnection() as HttpURLConnection
        conn.instanceFollowRedirects = true
        conn.connect()
        if (conn.responseCode !in 200..299) throw Exception("HTTP ${conn.responseCode} fetching $part")
        val total = conn.contentLengthLong
        var downloaded = 0L
        conn.inputStream.use { input ->
            FileOutputStream(dest).use { output ->
                val buf = ByteArray(64 * 1024)
                var lastReportedPct = -1
                while (true) {
                    val n = input.read(buf)
                    if (n < 0) break
                    output.write(buf, 0, n)
                    downloaded += n
                    if (total > 0) {
                        val pct = ((downloaded * 100) / total).toInt()
                        if (pct != lastReportedPct) {
                            lastReportedPct = pct
                            val ev = JSObject()
                            ev.put("name", modelName)
                            ev.put("part", part)
                            ev.put("percent", pct)
                            notifyListeners("downloadProgress", ev)
                        }
                    }
                }
            }
        }
    }

    private fun loadTags(name: String): List<TagRow> {
        tagsCache[name]?.let { return it }
        val rows = ArrayList<TagRow>()
        BufferedReader(InputStreamReader(File(modelDir(name), "tags.csv").inputStream())).use { r ->
            val header = r.readLine() ?: throw Exception("tags.csv is empty")
            val cols = header.split(",")
            val nameIdx = cols.indexOf("name").let { if (it < 0) 1 else it }
            val catIdx = cols.indexOf("category").let { if (it < 0) 2 else it }
            var line = r.readLine()
            while (line != null) {
                val parts = line.split(",")
                if (parts.size > max(nameIdx, catIdx)) {
                    rows.add(TagRow(parts[nameIdx], parts[catIdx].toIntOrNull() ?: 0))
                }
                line = r.readLine()
            }
        }
        tagsCache[name] = rows
        return rows
    }

    private fun loadSession(name: String): OrtSession {
        sessionCache[name]?.let { return it }
        val modelFile = File(modelDir(name), "model.onnx")
        if (!modelFile.exists()) throw Exception("Model \"$name\" is not downloaded")
        val opts = OrtSession.SessionOptions()
        // Hardware acceleration where the device actually supports it, with
        // ONNX Runtime's own automatic per-node fallback to CPU for anything
        // NNAPI can't run — WD14 is light enough that a CPU-only device is
        // still fine, this is opportunistic, not required.
        try { opts.addNnapi() } catch (e: Exception) { /* NNAPI unavailable on this device — CPU EP still applies */ }
        val session = ortEnv.createSession(modelFile.absolutePath, opts)
        sessionCache[name] = session
        return session
    }

    // WD14 models take a fixed square NxN input — read N from the session's
    // own input shape instead of hardcoding it, since it varies by model
    // (448 is common for v3 taggers, but not universal).
    private fun inputSize(session: OrtSession): Int {
        val info = session.inputInfo.values.first().info
        val shape = (info as ai.onnxruntime.TensorInfo).shape
        for (dim in shape) if (dim in 32..4096) return dim.toInt()
        return 448
    }

    private fun preprocess(bitmap: Bitmap, size: Int): FloatBuffer {
        // Pad to a centered square on a white background, then resize —
        // matches the reference WD14 tagger's own preprocessing, not a
        // plain stretch/crop (which would distort aspect ratio the model
        // wasn't trained on).
        val maxSide = max(bitmap.width, bitmap.height)
        val squared = Bitmap.createBitmap(maxSide, maxSide, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(squared)
        canvas.drawColor(Color.WHITE)
        canvas.drawBitmap(bitmap, ((maxSide - bitmap.width) / 2).toFloat(), ((maxSide - bitmap.height) / 2).toFloat(), null)
        val resized = Bitmap.createScaledBitmap(squared, size, size, true)

        val buffer = FloatBuffer.allocate(size * size * 3)
        val pixels = IntArray(size * size)
        resized.getPixels(pixels, 0, size, 0, 0, size, size)
        // NHWC, BGR channel order (SmilingWolf's own export convention),
        // 0-255 float range.
        for (p in pixels) {
            buffer.put(Color.blue(p).toFloat())
            buffer.put(Color.green(p).toFloat())
            buffer.put(Color.red(p).toFloat())
        }
        buffer.rewind()
        squared.recycle()
        resized.recycle()
        return buffer
    }

    private fun escapeTag(name: String): String {
        return name.replace(" ", "_").replace("(", "\\(").replace(")", "\\)")
    }

    @PluginMethod
    fun tagImage(call: PluginCall) {
        val name = call.getString("name", "") ?: ""
        val imageBase64 = call.getString("imageBase64", "") ?: ""
        val threshold = call.getFloat("threshold") ?: 0.35f
        val characterThreshold = call.getFloat("characterThreshold") ?: 0.85f
        if (name.isEmpty() || imageBase64.isEmpty()) { call.reject("name and imageBase64 are required"); return }
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: throw Exception("Could not decode image")
            val session = loadSession(name)
            val size = inputSize(session)
            val inputName = session.inputNames.iterator().next()
            val inputBuffer = preprocess(bitmap, size)
            bitmap.recycle()

            OnnxTensor.createTensor(ortEnv, inputBuffer, longArrayOf(1, size.toLong(), size.toLong(), 3)).use { tensor ->
                session.run(mapOf(inputName to tensor)).use { result ->
                    @Suppress("UNCHECKED_CAST")
                    val raw = result.get(0).value
                    val logits: FloatArray = when (raw) {
                        is Array<*> -> (raw[0] as FloatArray)
                        is FloatArray -> raw
                        else -> throw Exception("Unexpected model output shape")
                    }
                    val tags = loadTags(name)
                    val picked = ArrayList<String>()
                    for (i in tags.indices) {
                        if (i >= logits.size) break
                        val tag = tags[i]
                        // NOT raw logits — SmilingWolf's WD14 ONNX exports already
                        // bake a sigmoid into the graph's final layer, so this is
                        // already a 0-1 probability. Applying sigmoid() again here
                        // (the original bug) compresses every score into ~0.5-0.73
                        // regardless of the model's actual confidence, pushing
                        // nearly the entire ~9-10k tag vocabulary above any
                        // reasonable threshold — confirmed on-device (~8900 tags
                        // came back on one image).
                        val score = logits[i]
                        val cutoff = if (tag.category == 4) characterThreshold else threshold
                        if (tag.category == 9) continue // rating tags aren't part of the caption
                        if (score >= cutoff) picked.add(escapeTag(tag.name))
                    }
                    val ret = JSObject()
                    ret.put("tagsCsv", picked.joinToString(", "))
                    call.resolve(ret)
                }
            }
        } catch (e: Exception) {
            call.reject("Local WD14 tagging failed: ${e.message}", e)
        }
    }
}
