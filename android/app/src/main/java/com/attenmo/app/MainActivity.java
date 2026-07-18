package com.attenmo.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable Android's automatic "Force Dark" on the WebView.
        // Our web app manages its own dark mode via CSS classes + JS.
        // Without this, Android may auto-darken the WebView regardless of
        // what prefers-color-scheme returns, breaking "System Default" mode.
        WebView webView = getBridge().getWebView();
        if (webView != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ API: disable algorithmic darkening
            webView.getSettings().setAlgorithmicDarkeningAllowed(false);
        } else if (webView != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10-12 API (deprecated but needed for those versions)
            webView.setForceDarkAllowed(false);
        }
    }
}
