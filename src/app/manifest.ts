import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ФитПуть: ИИ Тренер',
    short_name: 'ФитПуть',
    description: 'Ваш персональный гид по фитнесу и питанию на базе ИИ.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F7FF',
    theme_color: '#3B82F6',
    icons: [
      {
        src: 'https://picsum.photos/seed/fitpath/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/fitpath/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
