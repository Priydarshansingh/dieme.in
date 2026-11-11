import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dieme Core Backend Digicast Core Backend & God Panel API God Panel API',
  description: 'Decoupled API Hub, Dual Currency Ledger & Relocated God Panel',
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
