package com.local.comfybridge

import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

// Real foreground service, not just a plain notification — see the
// manifest's own comment on why: setOngoing(true) alone no longer makes a
// notification swipe-proof on Android 14+ (target sdk 36 here) for a
// regular app; a genuine foreground service's notification is still
// exempt. GenProgressPlugin.kt starts/updates/stops this via Intents
// rather than binding, since nothing here needs a return value.
class GenProgressService : Service() {

    companion object {
        const val ACTION_UPDATE = "update"
        const val ACTION_FINISH = "finish"
        const val ACTION_CLEAR = "clear"
    }

    override fun onBind(intent: Intent?) = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) { stopSelf(); return START_NOT_STICKY }
        when (intent.action) {
            ACTION_UPDATE -> {
                startForeground(GenProgressPlugin.NOTIF_ID, buildProgressNotification(intent))
            }
            ACTION_FINISH -> {
                // Detach (not remove) — the notification stays visible and
                // becomes an ordinary dismissible one once the service, and
                // with it the "can't be swiped" exemption, goes away.
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH)
                val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
                nm.notify(GenProgressPlugin.NOTIF_ID, buildFinishNotification(intent))
                stopSelf()
            }
            ACTION_CLEAR -> {
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun cancelPendingIntent(): PendingIntent {
        val cancelIntent = Intent(GenProgressPlugin.ACTION_CANCEL).setPackage(packageName)
        return PendingIntent.getBroadcast(
            this, 0, cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun buildProgressNotification(intent: Intent): android.app.Notification {
        val title = intent.getStringExtra("title") ?: ""
        val body = intent.getStringExtra("body") ?: ""
        val max = intent.getIntExtra("max", 0)
        val progress = intent.getIntExtra("progress", 0)
        val indeterminate = intent.getBooleanExtra("indeterminate", false)
        val showCancel = intent.getBooleanExtra("showCancel", true)

        val builder = NotificationCompat.Builder(this, GenProgressPlugin.CHANNEL_ID)
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)

        if (max > 0) builder.setProgress(max, progress.coerceIn(0, max), indeterminate)
        else if (indeterminate) builder.setProgress(0, 0, true)

        if (showCancel) builder.addAction(0, "Cancel", cancelPendingIntent())

        return builder.build()
    }

    private fun buildFinishNotification(intent: Intent): android.app.Notification {
        val title = intent.getStringExtra("title") ?: ""
        val body = intent.getStringExtra("body") ?: ""
        return NotificationCompat.Builder(this, GenProgressPlugin.CHANNEL_ID)
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setOngoing(false)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
