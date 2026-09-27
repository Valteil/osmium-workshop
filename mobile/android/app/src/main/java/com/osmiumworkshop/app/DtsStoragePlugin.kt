package com.osmiumworkshop.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
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

// Backs mobile-shim.js's window.showDirectoryPicker() polyfill with Android's
// Storage Access Framework, so unmodified desktop renderer/*.ts code (which
// only ever calls entries()/getFileHandle()/getDirectoryHandle()/
// removeEntry()/getFile()/createWritable() on the handle it gets back) works
// unchanged. See notes/Mobile-Port.md.
//
// All paths passed from JS are relative to the picked root ("" = root
// itself, "Disabled" = the Disabled subfolder, "Disabled/foo.png" = a file
// in it) and resolved fresh via DocumentFile navigation on every call rather
// than caching content:// URIs client-side, since dataset folders here are
// shallow (root + at most one level of subfolders) and this is simpler and
// more robust than URI caching.
@CapacitorPlugin(name = "DtsStorage")
class DtsStoragePlugin : Plugin() {

    private val prefsName = "dts_storage_prefs"
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
        ret.put("name", dir?.name ?: "dataset")
        call.resolve(ret)
    }

    // "Add images…" with no dataset open (index.ts createDatasetForImport):
    // the user picks WHERE (a folder tree, same picker as pickFolder), and a
    // new subfolder named `name` is created inside it and becomes the dataset.
    // SAF only grants the picked tree, so the new folder is addressed as a
    // document UNDER that tree (tree/<parent>/document/<child>): it works for
    // every file call through the parent's persisted grant, and
    // setActiveRoot() below accepts it by checking the tree it belongs to.
    @PluginMethod
    fun createDatasetFolder(call: PluginCall) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION or
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        )
        startActivityForResult(call, intent, "createDatasetFolderResult")
    }

    @ActivityCallback
    private fun createDatasetFolderResult(call: PluginCall, result: ActivityResult) {
        if (result.resultCode != Activity.RESULT_OK || result.data == null) { call.reject("User cancelled"); return }
        val treeUri: Uri = result.data!!.data ?: run { call.reject("No URI returned"); return }
        context.contentResolver.takePersistableUriPermission(
            treeUri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        )
        val parent = DocumentFile.fromTreeUri(context, treeUri) ?: run { call.reject("Can't open that location"); return }
        val base = (call.getString("name", "New dataset") ?: "New dataset").ifBlank { "New dataset" }
        var finalName = base
        var n = 2
        while (parent.findFile(finalName) != null) finalName = "$base (${n++})"
        val child = parent.createDirectory(finalName) ?: run { call.reject("Couldn't create the folder there"); return }
        val childUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getDocumentId(child.uri))
        context.getSharedPreferences(prefsName, 0).edit().putString(uriKey, childUri.toString()).apply()
        val ret = JSObject()
        ret.put("uri", childUri.toString())
        ret.put("name", finalName)
        call.resolve(ret)
    }

    // "Add images…" (index.ts importImagesToDataset). An <input type=file>
    // in the WebView only ever opens ONE picker (the system photo picker on
    // Android 13+); wrapping ACTION_GET_CONTENT in Intent.createChooser lists
    // every installed app that can hand over images — Photos/Gallery, Files,
    // Drive, third-party file managers — so the user picks which one. Returns
    // each chosen file's name, type and bytes (base64, same bridge format as
    // getFileBytes); the renderer writes them into the dataset itself.
    @PluginMethod
    fun pickImages(call: PluginCall) {
        val get = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, call.getBoolean("multiple", true) ?: true)
        }
        startActivityForResult(call, Intent.createChooser(get, call.getString("title", "Add images with…")), "pickImagesResult")
    }

    @ActivityCallback
    private fun pickImagesResult(call: PluginCall, result: ActivityResult) {
        val data = result.data
        if (result.resultCode != Activity.RESULT_OK || data == null) {
            val empty = JSObject(); empty.put("files", JSArray()); call.resolve(empty); return
        }
        val uris = mutableListOf<Uri>()
        val clip = data.clipData
        if (clip != null) for (i in 0 until clip.itemCount) clip.getItemAt(i).uri?.let { uris.add(it) }
        else data.data?.let { uris.add(it) }
        val arr = JSArray()
        for (uri in uris) {
            try {
                val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: continue
                var name: String? = null
                context.contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
                    if (c.moveToFirst()) name = c.getString(0)
                }
                val mime = context.contentResolver.getType(uri) ?: "image/*"
                val f = JSObject()
                f.put("name", name ?: uri.lastPathSegment ?: "image")
                f.put("mimeType", mime)
                f.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP))
                arr.put(f)
            } catch (e: Exception) { /* unreadable item: skip it, keep the rest */ }
        }
        val ret = JSObject()
        ret.put("files", arr)
        ret.put("requested", uris.size)
        call.resolve(ret)
    }

    // Switches the "current root" to a URI already covered by a PERSISTED
    // permission from an earlier pickFolder() — no picker prompt needed,
    // since Android keeps that grant until explicitly released. This is
    // what lets the Dataset tab reopen a previously-tracked folder:
    // mobile-shim.js's toJSON()/revive round-trip through IndexedDB stores
    // just the URI string (the real handle object, full of closures, can't
    // be structured-cloned — see notes/Mobile-Port.md), and the revived
    // handle's requestPermission() calls this before any file operation to
    // make sure the native side is actually pointed at THIS folder, not
    // whatever was picked most recently.
    @PluginMethod
    fun setActiveRoot(call: PluginCall) {
        val uriStr = call.getString("uri", "") ?: ""
        if (uriStr.isEmpty()) { call.reject("No uri given"); return }
        val treeUri = Uri.parse(uriStr)
        // A folder made by createDatasetFolder() is a document under its
        // parent's tree — the grant to check is that tree's.
        val grantUri = try {
            DocumentsContract.buildTreeDocumentUri(treeUri.authority, DocumentsContract.getTreeDocumentId(treeUri))
        } catch (e: Exception) { treeUri }
        val stillGranted = context.contentResolver.persistedUriPermissions.any {
            (it.uri == treeUri || it.uri == grantUri) && it.isReadPermission && it.isWritePermission
        }
        if (!stillGranted) { call.reject("Permission for this folder is no longer granted — pick it again"); return }
        context.getSharedPreferences(prefsName, 0).edit().putString(uriKey, treeUri.toString()).apply()
        val dir = DocumentFile.fromTreeUri(context, treeUri)
        val ret = JSObject()
        ret.put("name", dir?.name ?: "dataset")
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
