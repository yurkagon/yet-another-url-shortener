import type { Metadata } from 'next';
import { JetBrains_Mono, Patrick_Hand } from 'next/font/google';
import './globals.css';
import { PROJECT_NAME, PROJECT_TAGLINE } from '@/lib/brand';
import { Providers } from '@/components/providers';

const patrickHand = Patrick_Hand({
  variable: '--font-hand',
  weight: '400',
  subsets: ['latin'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${PROJECT_NAME} — ${PROJECT_TAGLINE}`,
  description: 'Shorten any link. Get a QR. Done.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="paper"
      className={`${patrickHand.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
