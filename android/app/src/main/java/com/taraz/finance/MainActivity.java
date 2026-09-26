package com.taraz.finance;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String PREFS_NAME = "taraz_pending_sms";
    private static final String TAG = "TarazMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        checkAndRequestPermissions();
        // Process any pending SMS after WebView is ready (500ms delay)
        new Handler(Looper.getMainLooper()).postDelayed(this::processPendingSms, 1500);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.getBooleanExtra("process_sms", false)) {
            new Handler(Looper.getMainLooper()).postDelayed(this::processPendingSms, 800);
        }
    }

    private void processPendingSms() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String pending = prefs.getString("pending", null);
        if (pending == null) return;

        // Clear immediately to avoid double-processing
        prefs.edit().remove("pending").apply();

        try {
            String js = "if(window.__tarazSmsRecord){window.__tarazSmsRecord(" + pending + ");}";
            Log.d(TAG, "Injecting SMS JS: " + js);
            getBridge().getWebView().evaluateJavascript(js, null);
        } catch (Exception e) {
            Log.e(TAG, "Error injecting SMS to WebView: " + e.getMessage());
        }
    }

    private void checkAndRequestPermissions() {
        List<String> permissions = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECEIVE_SMS);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.READ_SMS);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }
}
