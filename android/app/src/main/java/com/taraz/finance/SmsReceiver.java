package com.taraz.finance;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "TarazSmsReceiver";
    private static final String CHANNEL_ID = "taraz_sms_channel";
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle == null) return;

            try {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus == null || pdus.length == 0) return;

                String format = bundle.getString("format");
                StringBuilder fullBody = new StringBuilder();
                String sender = "";

                for (Object pdu : pdus) {
                    SmsMessage sms;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                    } else {
                        sms = SmsMessage.createFromPdu((byte[]) pdu);
                    }
                    if (sms != null) {
                        fullBody.append(sms.getMessageBody());
                        if (sender.isEmpty()) {
                            sender = sms.getOriginatingAddress();
                        }
                    }
                }

                String body = fullBody.toString();
                Log.d(TAG, "Received SMS from " + sender + ": " + body);

                // Financial Keyword Filter
                if (isFinancialMessage(body)) {
                    processBankSms(context, body, sender);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error parsing incoming SMS: " + e.getMessage());
            }
        }
    }

    private boolean isFinancialMessage(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.contains("واریز") ||
               lower.contains("برداشت") ||
               lower.contains("خرید") ||
               lower.contains("انتقال") ||
               lower.contains("مانده") ||
               lower.contains("موجودی") ||
               lower.contains("بانک") ||
               lower.contains("ریال") ||
               lower.contains("تومان") ||
               lower.contains("pos") ||
               lower.contains("پایا") ||
               lower.contains("ساتنا");
    }

    private void processBankSms(Context context, String body, String sender) {
        executor.execute(() -> {
            try {
                String serverUrl = context.getString(R.string.taraz_server_url);
                URL url = new URL(serverUrl + "/api/sms/record");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                JSONObject payload = new JSONObject();
                payload.put("smsBody", body);
                payload.put("sender", sender);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }

                int responseCode = conn.getResponseCode();
                if (responseCode == 200 || responseCode == 201) {
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) {
                            sb.append(line);
                        }
                        JSONObject res = new JSONObject(sb.toString());
                        if (res.optBoolean("success")) {
                            JSONObject data = res.optJSONObject("data");
                            String details = "تراکنش بانکی با موفقیت ثبت شد.";
                            if (data != null) {
                                String bank = data.optString("bankName", "بانک");
                                double amt = data.optDouble("amount", 0);
                                details = "تراکنش " + bank + " (" + (long) amt + " تومان) در تراز ثبت گردید.";
                            }
                            showNotification(context, "تراز | ثبت خودکار تراکنش", details);
                        }
                    }
                } else {
                    Log.w(TAG, "Server responded with code: " + responseCode);
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Error posting SMS to Taraz backend: " + e.getMessage());
            }
        });
    }

    private void showNotification(Context context, String title, String message) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ثبت هوشمند تراکنش‌های تراز",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("اعلان‌های دریافت و ثبت خودکار پیامک‌های بانکی");
            channel.enableVibration(true);
            nm.createNotificationChannel(channel);
        }

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            context,
            0,
            openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);

        nm.notify((int) System.currentTimeMillis(), builder.build());
    }
}
