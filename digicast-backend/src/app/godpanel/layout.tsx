import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'God Panel — Digicast Root Control Center',
  description: 'Isolated Master Admin Portal for Digicast Backend',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function GodPanelLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}
