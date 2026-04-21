import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
});

const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  weight:   ['300', '400', '600'],
  style:    ['normal', 'italic'],
  variable: '--font-cormorant',
  display:  'swap',
});

export const metadata: Metadata = {
  title: 'Prestige by Synergy Lux',
  description: 'Private chauffeur service. Dallas–Fort Worth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head />
      <body className="font-sans antialiased bg-lux-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
