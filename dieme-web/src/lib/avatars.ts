export interface GamerAvatar {
  id: string;
  name: string;
  series: string;
  badge: string;
  color: string;
  url: string;
  description: string;
  isDefault?: boolean;
  addedBy?: string;
  createdAt?: string;
}

export const PRESET_ANIME_AVATARS: GamerAvatar[] = [
  {
    id: 'gojo-satoru',
    name: 'Gojo Satoru',
    series: 'Jujutsu Kaisen',
    badge: 'Six Eyes',
    color: '#8B5CF6',
    url: '/avatars/gojo_satoru.svg',
    description: 'The Honored One wielding limitless cursed energy and Hollow Purple.',
    isDefault: true,
  },
  {
    id: 'goku-ssj',
    name: 'Goku (SSJ)',
    series: 'Dragon Ball Z',
    badge: 'Super Saiyan',
    color: '#F59E0B',
    url: '/avatars/goku_super_saiyan.svg',
    description: 'Legendary Saiyan warrior burning with golden Super Saiyan ki.',
    isDefault: true,
  },
  {
    id: 'luffy-gear5',
    name: 'Luffy (Gear 5)',
    series: 'One Piece',
    badge: 'Sun God Nika',
    color: '#EC4899',
    url: '/avatars/luffy_gear5.svg',
    description: 'Warrior of Liberation powered by the Drums of Liberation.',
    isDefault: true,
  },
  {
    id: 'sung-jinwoo',
    name: 'Sung Jin-woo',
    series: 'Solo Leveling',
    badge: 'Shadow Monarch',
    color: '#06B6D4',
    url: '/avatars/sung_jinwoo.svg',
    description: 'Shadow Monarch commanding legions of risen shadow extraction soldiers.',
    isDefault: true,
  },
  {
    id: 'naruto-sage',
    name: 'Naruto Uzumaki',
    series: 'Naruto Shippuden',
    badge: 'Toad Sage Mode',
    color: '#F97316',
    url: '/avatars/naruto_sage.svg',
    description: 'Hero of the Hidden Leaf with senjutsu orange pigments and toad sage eyes.',
    isDefault: true,
  },
  {
    id: 'zoro-wano',
    name: 'Roronoa Zoro',
    series: 'One Piece',
    badge: 'King of Hell',
    color: '#10B981',
    url: '/avatars/zoro_wano.svg',
    description: 'Master of Three-Sword Style channeling Enma conqueror dragon flames.',
    isDefault: true,
  },
  {
    id: 'levi-ackerman',
    name: 'Levi Ackerman',
    series: 'Attack on Titan',
    badge: "Humanity's Strongest",
    color: '#64748B',
    url: '/avatars/levi_ackerman.svg',
    description: 'Captain of the Special Operations Squad with deadly dual-blade precision.',
    isDefault: true,
  },
  {
    id: 'tanjiro-sun',
    name: 'Tanjiro Kamado',
    series: 'Demon Slayer',
    badge: 'Sun Breathing',
    color: '#EF4444',
    url: '/avatars/tanjiro_sun.svg',
    description: 'Demon Slayer Corps warrior wielding Hinokami Kagura solar flame dances.',
    isDefault: true,
  },
  {
    id: 'sukuna-domain',
    name: 'Ryomen Sukuna',
    series: 'Jujutsu Kaisen',
    badge: 'King of Curses',
    color: '#DC2626',
    url: '/avatars/sukuna_domain.svg',
    description: 'Malevolent Shrine sovereign unleashing Dismantle and Cleave domain strikes.',
    isDefault: true,
  },
  {
    id: 'eren-founder',
    name: 'Eren Yeager',
    series: 'Attack on Titan',
    badge: 'Founding Titan',
    color: '#22C55E',
    url: '/avatars/eren_founder.svg',
    description: 'Unstoppable titan shifter marching forward in pursuit of ultimate freedom.',
    isDefault: true,
  },
];

