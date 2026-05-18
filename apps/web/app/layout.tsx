import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE } from '@vesta/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vesta',
  description: 'Modern hotel property-management platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
