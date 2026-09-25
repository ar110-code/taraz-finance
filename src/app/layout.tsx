import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'تراز | سامانه هوشمند مدیریت مالی، ردیابی هزینه و بودجه‌بندی',
  description:
    'پلتفرم مینیمال، پیشرفته و همه‌جانبه برای ردیابی درآمدها و مخارج، گزارش‌گیری تحلیلی، بودجه‌بندی هوشمند و ارتقای سواد مالی',
  icons: {
    icon: '/favicon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'تراز',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased selection:bg-indigo-500/20 selection:text-indigo-600">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
