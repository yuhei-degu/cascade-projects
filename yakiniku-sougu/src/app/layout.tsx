import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '焼肉ホルモンそうご',
  description: '気軽に来れて、ちゃんと旨い。石川県金沢市の焼肉・ホルモン専門店。',
  icons: {
    icon: [
      { url: '/favicon.svg',  type: 'image/svg+xml' },
      { url: '/favicon-mark.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/favicon-mark.png',
  },
  openGraph: {
    title: '焼肉ホルモンそうご',
    description: '気軽に来れて、ちゃんと旨い。',
    locale: 'ja_JP',
    images: ['/images/sougu-logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
