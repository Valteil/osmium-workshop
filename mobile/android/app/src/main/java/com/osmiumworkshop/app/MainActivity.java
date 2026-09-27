package com.osmiumworkshop.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DtsStoragePlugin.class);
        registerPlugin(DtsWd14Plugin.class);
        super.onCreate(savedInstanceState);
        // The app itself loads over https://localhost (Capacitor's own scheme),
        // so the WebView's default mixed-content policy blocks any plain
        // http:// fetch/WebSocket — including the user's own local/Tailscale
        // ComfyUI instance, which has no reason to run TLS. Explicitly allowed
        // here since this app deliberately talks to a user-configured local
        // ComfyUI over plain HTTP (see comfy-client.ts's own top comment).
        WebSettings settings = this.bridge.getWebView().getSettings();
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
}
