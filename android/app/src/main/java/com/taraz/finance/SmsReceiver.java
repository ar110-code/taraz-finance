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

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SmsReceiver — Offline mode
 * Parses incoming bank SMS, writes a pending-SMS SharedPreferences entry,
 * and opens the MainActivity which picks it up via evaluateJavascript
 * to call window.__tarazSmsRecord(...) in the WebView.
 */
public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "TarazSmsReceiver";
    private static final String CHANNEL_ID = "taraz_sms_channel";
    private static final String PREFS_NAME = "taraz_pending_sms";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        try {
            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus == null || pdus.length == 0) return;

            String format = bundle.getString("format");
            StringBuilder fullBody = new StringBuilder();

            for (Object pdu : pdus) {
                SmsMessage sms;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                } else {
                    sms = SmsMessage.createFromPdu((byte[]) pdu);
                }
                if (sms != null) fullBody.append(sms.getMessageBody());
            }

            String body = fullBody.toString();
            Log.d(TAG, "SMS received: " + body);

            if (!isFinancialMessage(body)) return;

            // Parse amount and type
            long amount = parseAmount(body);
            if (amount <= 0) return;

            boolean isIncome = body.contains("واریز") || body.contains("دریافت") || body.contains("افزایش");
            String type = isIncome ? "income" : "expense";
            String title = isIncome ? "واریز بانکی" : "برداشت بانکی";

            // Store in SharedPreferences for MainActivity to pick up
            JSONObject pending = new JSONObject();
            pending.put("amount", amount);
            pending.put("type", type);
            pending.put("title", title);
            pending.put("rawSms", body.length() > 120 ? body.substring(0, 120) : body);
            pending.put("timestamp", System.currentTimeMillis());

            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString("pending", pending.toString())
                .apply();

            // Show notification
            showNotification(context, "تراز | پیامک بانکی دریافت شد",
                (isIncome ? "واریز " : "برداشت ") + formatAmount(amount) + " تومان — لمس کنید تا ثبت شود");

            // Launch app to process the SMS
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            launchIntent.putExtra("process_sms", true);
            context.startActivity(launchIntent);

        } catch (Exception e) {
            Log.e(TAG, "Error processing SMS: " + e.getMessage());
        }
    }

    private boolean isFinancialMessage(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.contains("واریز") || lower.contains("برداشت") || lower.contains("خرید") ||
               lower.contains("انتقال") || lower.contains("مانده") || lower.contains("موجودی") ||
               lower.contains("بانک") || lower.contains("ریال") || lower.contains("تومان") ||
               lower.contains("pos") || lower.contains("پایا") || lower.contains("ساتنا");
    }

    private long parseAmount(String text) {
        // Match patterns like: ۱۲,۳۴۵,۶۷۸ ریال or 12345678 تومان
        String normalized = text
            .replace("٬", "").replace(",", "")
            .replace("۰","0").replace("۱","1").replace("۲","2").replace("۳","3")
            .replace("۴","4").replace("۵","5").replace("۶","6").replace("۷","7")
            .replace("۸","8").replace("۹","9");

        Pattern p = Pattern.compile("(\\d{4,})");
        Matcher m = p.matcher(normalized);
        long best = 0;
        while (m.find()) {
            try {
                long val = Long.parseLong(m.group(1));
                // Convert Rials to Tomans if very large
                if (val > 100000000L) val = val / 10;
                if (val > best && val < 10000000000L) best = val;
            } catch (NumberFormatException ignored) {}
        }
        return best;
    }

    private String formatAmount(long amount) {
        return String.format("%,d", amount);
    }

    private void showNotification(Context context, String title, String message) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "ثبت هوشمند تراکنش‌های تراز", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("اعلان‌های دریافت و ثبت خودکار پیامک‌های بانکی");
            channel.enableVibration(true);
            nm.createNotificationChannel(channel);
        }

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openApp.putExtra("process_sms", true);
        PendingIntent pi = PendingIntent.getActivity(context, 0, openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

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
