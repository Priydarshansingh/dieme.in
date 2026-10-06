import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Root Admin Console',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function GodPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
