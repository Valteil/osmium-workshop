package com.local.comfybridge

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Base64
import androidx.activity.result.ActivityResult
import androidx.documentfile.provider.DocumentFile
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

// Storage Access Framework backing for Comfy Bridge's save location: lets
// the user pick ANY folder on the device (not just a subfolder of
// Documents) for generations, with the grant persisted across restarts.
// Ported from the parent Osmium Workshop mobile app's DtsStoragePlugin
// (same method surface, renamed) — see notes/Mobile-Port.md there for the
// full rationale. All paths are relative to the picked root ("" = root
// itself, "sub/file.png" = a file in a subfolder), resolved fresh via
// DocumentFile navigation on every call.
@CapacitorPlugin(name = "BridgeStorage")
class BridgeStoragePlugin : Plugin() {

    private val prefsName = "bridge_storage_prefs"
    private val uriKey = "root_tree_uri"

    private fun rootDoc(): DocumentFile? {
        val uriStr = context.getSharedPreferences(prefsName, 0).getString(uriKey, null) ?: return null
        return DocumentFile.fromTreeUri(context, Uri.parse(uriStr))
    }

    private fun resolve(path: String, createDirs: Boolean = false): DocumentFile? {
        var doc = rootDoc() ?: return null
        if (path.isEmpty()) return doc
        for (segment in path.split("/")) {
            if (segment.isEmpty()) continue
            var next = doc.findFile(segment)
            if (next == null && createDirs) next = doc.createDirectory(segment)
            if (next == null) return null
            doc = next
        }
        return doc
    }

    @PluginMethod
    fun pickFolder(call: PluginCall) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION or
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        )
        startActivityForResult(call, intent, "pickFolderResult")
    }

    @ActivityCallback
    private fun pickFolderResult(call: PluginCall, result: ActivityResult) {
        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
            call.reject("User cancelled")
            return
        }
        val treeUri: Uri = result.data!!.data ?: run { call.reject("No URI returned"); return }
        context.contentResolver.takePersistableUriPermission(
            treeUri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        )
        context.getSharedPreferences(prefsName, 0).edit().putString(uriKey, treeUri.toString()).apply()
        val dir = DocumentFile.fromTreeUri(context, treeUri)
        val ret = JSObject()
        ret.put("uri", treeUri.toString())
        ret.put("name", dir?.name ?: "folder")
        call.resolve(ret)
    }

    // Re-points the "current root" at a URI already covered by a PERSISTED
    // permission from an earlier pickFolder() — no picker prompt needed.
    // Called at boot with the stored URI so the grant survives restarts.
    @PluginMethod
    fun setActiveRoot(call: PluginCall) {
        val uriStr = call.getString("uri", "") ?: ""
        if (uriStr.isEmpty()) { call.reject("No uri given"); return }
        val treeUri = Uri.parse(uriStr)
        val stillGranted = context.contentResolver.persistedUriPermissions.any {
            it.uri == treeUri && it.isReadPermission && it.isWritePermission
        }
        if (!stillGranted) { call.reject("Permission for this folder is no longer granted — pick it again"); return }
        context.getSharedPreferences(prefsName, 0).edit().putString(uriKey, treeUri.toString()).apply()
        val dir = DocumentFile.fromTreeUri(context, treeUri)
        val ret = JSObject()
        ret.put("name", dir?.name ?: "folder")
        call.resolve(ret)
    }

    @PluginMethod
    fun stat(call: PluginCall) {
        val path = call.getString("path", "") ?: ""
        val doc = resolve(path)
        val ret = JSObject()
        ret.put("exists", doc != null && doc.exists())
        ret.put("kind", if (doc?.isDirectory == true) "directory" else "file")
        call.resolve(ret)
    }

    @PluginMethod
    fun listEntries(call: PluginCall) {
        val path = call.getString("path", "") ?: ""
        val dir = resolve(path)
        if (dir == null || !dir.isDirectory) { call.reject("Directory not found: $path"); return }
        val arr = JSArray()
        for (child in dir.listFiles()) {
            val entry = JSObject()
            entry.put("name", child.name)
            entry.put("kind", if (child.isDirectory) "directory" else "file")
            entry.put("lastModified", child.lastModified())
            arr.put(entry)
        }
        val ret = JSObject()
        ret.put("files", arr)
        call.resolve(ret)
    }

    @PluginMethod
    fun getFileBytes(call: PluginCall) {
        val path = call.getString("path", "") ?: ""
        val doc = resolve(path)
        if (doc == null || !doc.exists()) { call.reject("File not found: $path"); return }
        val bytes = context.contentResolver.openInputStream(doc.uri)?.use { it.readBytes() }
            ?: run { call.reject("Could not open: $path"); return }
        val ret = JSObject()
        ret.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP))
        ret.put("mimeType", doc.type ?: "application/octet-stream")
        ret.put("size", bytes.size)
        ret.put("lastModified", doc.lastModified())
        call.resolve(ret)
    }

    @PluginMethod
    fun writeFileBytes(call: PluginCall) {
        val path = call.getString("path", "") ?: ""
        val base64 = call.getString("base64", "") ?: ""
        val mimeType = call.getString("mimeType", "application/octet-stream") ?: "application/octet-stream"
        val segments = path.split("/")
        val fileName = segments.last()
        val parentPath = segments.dropLast(1).joinToString("/")
        val parentDir = resolve(parentPath, createDirs = true)
        if (parentDir == null) { call.reject("Parent dir not found: $parentPath"); return }
        var file = parentDir.findFile(fileName)
        if (file == null) file = parentDir.createFile(mimeType, fileName)
        if (file == null) { call.reject("Could not create file: $path"); return }
        val bytes = Base64.decode(base64, Base64.NO_WRAP)
        context.contentResolver.openOutputStream(file.uri, "wt")?.use { it.write(bytes) }
            ?: run { call.reject("Could not open for write: $path"); return }
        call.resolve()
    }

    @PluginMethod
    fun createDirectory(call: PluginCall) {
        val path = call.getString("path", "") ?: ""
        val doc = resolve(path, createDirs = true)
        if (doc == null) { call.reject("Could not create directory: $path"); return }
        call.resolve()
    }

    @PluginMethod
    fun removeEntry(call: PluginCall) {
        val path = call.getString("path", "") ?: ""
        val doc = resolve(path)
        if (doc != null && doc.exists()) doc.delete()
        call.resolve()
    }
}
