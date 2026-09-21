package com.local.comfybridge

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

// Live generation-progress notification, backed by a real foreground
// service (GenProgressService.kt) rather than a plain notification —
// setOngoing(true) alone stopped making a notification swipe-proof on
// Android 14+ for a regular app; a genuine foreground service's
// notification is still exempt from that, which a plain
// NotificationCompat.Builder call from here can't provide on its own.
// This plugin just relays start/update/finish/clear as Intents to the
// service and handles the Cancel action's broadcast + the Android 13+
// POST_NOTIFICATIONS permission (still done from JS via
// @capacitor/local-notifications before calling into this plugin).
@CapacitorPlugin(name = "GenProgress")
class GenProgressPlugin : Plugin() {

    companion object {
        const val CHANNEL_ID = "gen-progress"
        const val NOTIF_ID = 20260921
        const val ACTION_CANCEL = "com.local.comfybridge.GEN_PROGRESS_CANCEL"
    }

    override fun load() {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Generation progress", NotificationManager.IMPORTANCE_LOW)
            channel.description = "Live step progress for ComfyUI generations"
            nm.createNotificationChannel(channel)
        }
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                notifyListeners("cancelRequested", JSObject())
            }
        }
        val filter = IntentFilter(ACTION_CANCEL)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            context.registerReceiver(receiver, filter)
        }
    }

    private fun serviceIntent(action: String): Intent =
        Intent(context, GenProgressService::class.java).setAction(action)

    @PluginMethod
    fun update(call: PluginCall) {
        val intent = serviceIntent(GenProgressService.ACTION_UPDATE)
            .putExtra("title", call.getString("title", "") ?: "")
            .putExtra("body", call.getString("body", "") ?: "")
            .putExtra("max", call.getInt("max", 0) ?: 0)
            .putExtra("progress", call.getInt("progress", 0) ?: 0)
            .putExtra("indeterminate", call.getBoolean("indeterminate", false) ?: false)
            .putExtra("showCancel", call.getBoolean("showCancel", true) ?: true)
        ContextCompat.startForegroundService(context, intent)
        call.resolve()
    }

    @PluginMethod
    fun finish(call: PluginCall) {
        val intent = serviceIntent(GenProgressService.ACTION_FINISH)
            .putExtra("title", call.getString("title", "") ?: "")
            .putExtra("body", call.getString("body", "") ?: "")
        ContextCompat.startForegroundService(context, intent)
        call.resolve()
    }

    @PluginMethod
    fun clear(call: PluginCall) {
        ContextCompat.startForegroundService(context, serviceIntent(GenProgressService.ACTION_CLEAR))
        call.resolve()
    }
}
