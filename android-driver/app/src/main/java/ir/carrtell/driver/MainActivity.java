package ir.carrtell.driver;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String BASE_HOST = "carrtell.ir";
    private static final String START_URL = "https://carrtell.ir/driver/login?source=android";
    private static final String CHANNEL_ID = "carrtell_driver_missions";
    private static final int PERMISSION_REQUEST = 4102;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 17, 31));
        getWindow().setNavigationBarColor(Color.rgb(7, 17, 31));
        createNotificationChannel();
        requestRuntimePermissions();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 17, 31));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUserAgentString(settings.getUserAgentString() + " CarrtellDriverAndroid/1.0");

        webView.addJavascriptInterface(new CarrtellBridge(), "CarrtellAndroid");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return routeUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeUrl(Uri.parse(url));
            }
        });

        webView.loadUrl(START_URL);
    }

    private boolean routeUrl(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost();
        String path = uri.getPath() == null ? "/" : uri.getPath();

        if (("https".equals(scheme) || "http".equals(scheme)) && BASE_HOST.equalsIgnoreCase(host) && path.startsWith("/driver")) {
            return false;
        }

        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception ignored) {
        }
        return true;
    }

    private void requestRuntimePermissions() {
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST);
        } else if (Build.VERSION.SDK_INT >= 23) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, PERMISSION_REQUEST);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "ماموریت‌های Carrtell", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("اعلان ماموریت جدید سرویس‌کار");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private void showNativeNotification(String title, String body, String url) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setData(Uri.parse(url == null || url.isEmpty() ? "https://carrtell.ir/driver/dashboard" : "https://carrtell.ir" + url));
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new android.app.Notification.Builder(this, CHANNEL_ID)
            : new android.app.Notification.Builder(this);
        builder.setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);
        manager.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), builder.build());
    }

    public class CarrtellBridge {
        @JavascriptInterface
        public void notify(String title, String body, String url) {
            runOnUiThread(() -> showNativeNotification(title, body, url));
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
