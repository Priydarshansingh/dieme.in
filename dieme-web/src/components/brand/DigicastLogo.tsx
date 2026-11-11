// Dieme logo assets from /public
// logo-mark.png  = transparent PNG, white D-bolt mark
// Wordmark rendered with crisp bold typography

import Image from 'next/image';

interface DigicastLogoProps {
  className?: string;
}

export function DigicastBrandLogo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: { mark: 26, font: 'text-lg' },
    md: { mark: 34, font: 'text-xl' },
    lg: { mark: 42, font: 'text-2xl' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt="Dieme Logo"
        width={dims.mark}
        height={dims.mark}
        className="object-contain shrink-0"
        priority
      />
      <span className={`font-black tracking-tight text-white select-none ${dims.font}`}>
        Dieme
      </span>
    </div>
  );
}

// Sidebar — dark navy background
export function DigicastSidebarLogo({ className = '' }: DigicastLogoProps) {
  return <DigicastBrandLogo className={className} size="md" />;
}

// Light background (login right panel, onboarding, etc.)
export function DigicastWordmark({ className = '' }: DigicastLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt="Dieme"
        width={36}
        height={36}
        className="object-contain"
        priority
      />
      <span className="font-black tracking-tight text-white select-none text-2xl">
        Dieme
      </span>
    </div>
  );
}

// Just the D-bolt mark
export function DigicastMark({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  darkBg?: boolean;
  className?: string;
}) {
  const dims = { sm: 28, md: 36, lg: 56 };
  const d = dims[size];
  return (
    <Image
      src="/logo-mark.png"
      alt="Dieme"
      width={d}
      height={d}
      className={`object-contain ${className}`}
    />
  );
}

// Just the wordmark text
export function DigicastText({ className = '' }: DigicastLogoProps) {
  return (
    <span className={`font-black tracking-tight text-white select-none text-2xl ${className}`}>
      Dieme
    </span>
  );
}

// Aliases for Dieme branding
export const DiemeBrandLogo = DigicastBrandLogo;
export const DiemeSidebarLogo = DigicastSidebarLogo;
export const DiemeWordmark = DigicastWordmark;
export const DiemeMark = DigicastMark;
export const DiemeText = DigicastText;

export default DigicastWordmark;
