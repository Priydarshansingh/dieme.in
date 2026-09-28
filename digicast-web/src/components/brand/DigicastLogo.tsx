// Digicast logo assets from /public
// logo-mark.png  = transparent PNG, white D-bolt (shows on any background natively)
// logo-text.png  = white bg, navy+gray wordmark

import Image from 'next/image';

interface DigicastLogoProps {
  className?: string;
}

// Sidebar — dark navy background
// Mark shows white bolt directly (transparent bg). Text inverted to white.
export function DigicastSidebarLogo({ className = '' }: DigicastLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={36}
        height={36}
        className="object-contain"
        priority
      />
      <Image
        src="/logo-text.png"
        alt="Digicast"
        width={110}
        height={30}
        className="object-contain brightness-0 invert"
        priority
      />
    </div>
  );
}

// Light background (login right panel, onboarding, etc.)
// Mark: white bolt — add drop-shadow or use on colored bg for visibility
// Text: original navy colors
export function DigicastWordmark({ className = '' }: DigicastLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={36}
        height={36}
        className="object-contain"
        priority
      />
      <Image
        src="/logo-text.png"
        alt="Digicast"
        width={130}
        height={36}
        className="object-contain"
        priority
      />
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
      alt="Digicast"
      width={d}
      height={d}
      className={`object-contain ${className}`}
    />
  );
}

// Just the wordmark text
export function DigicastText({ className = '' }: DigicastLogoProps) {
  return (
    <Image
      src="/logo-text.png"
      alt="Digicast"
      width={140}
      height={40}
      className={`object-contain ${className}`}
      priority
    />
  );
}

export default DigicastWordmark;
