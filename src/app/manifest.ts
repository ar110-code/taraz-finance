import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'تراز | سامانه هوشمند مدیریت مالی و بودجه‌بندی',
    short_name: 'تراز',
    description: 'سامانه هوشمند و مینیمال مدیریت دخل و خرج، بودجه‌بندی و پایش اقساط',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#4f46e5',
    dir: 'rtl',
    lang: 'fa',
    orientation: 'portrait',
    scope: '/',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
