import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taraz.finance',
  appName: 'تراز',
  webDir: 'public',
  server: {
    url: 'https://taraz-finance-production.up.railway.app',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
