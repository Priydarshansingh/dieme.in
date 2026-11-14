import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dieme Backend Control Hub & God Panel',
  description: 'Decoupled API Hub, Dual Currency Ledger & Dieme Root Access',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
