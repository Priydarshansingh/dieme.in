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
];
