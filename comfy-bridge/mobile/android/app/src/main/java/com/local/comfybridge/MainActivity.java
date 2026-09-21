package com.local.comfybridge;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BridgeStoragePlugin.class);
        registerPlugin(GenProgressPlugin.class);
        super.onCreate(savedInstanceState);
        // The app itself loads over https://localhost (Capacitor's own scheme),
        // so the WebView's default mixed-content policy blocks any plain
        // http:// fetch/WebSocket — including the user's own LAN/Tailscale/
        // hotspot ComfyUI instance, which has no reason to run TLS. Explicitly
        // allowed here since this app deliberately talks to a user-configured
        // remote ComfyUI over plain HTTP (same fix as the parent Dataset Tag
        // Studio mobile app — without this, an address that loads fine in the
        // phone's browser still fails inside the app with a generic TypeError).
        WebSettings settings = this.bridge.getWebView().getSettings();
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
}
