import type { Metadata } from 'next';
import { Nunito, Sansita_Swashed } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: 'variable',
});

const sansitaSwashed = Sansita_Swashed({
  variable: '--font-sansita-swashed',
  subsets: ['latin'],
  weight: 'variable',
});

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Modern admin dashboard built with Next.js and @adanft/ui.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${sansitaSwashed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
