export interface PlatformUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'streamer' | 'editor' | 'admin' | 'owner';
  plan: 'free_trial' | 'intro_29' | 'monthly_149' | 'quarterly_449' | 'annual_999' | 'pro';
  status: 'active' | 'suspended' | 'trial';
  dCoinsBalance: number;
  dpBalance: number;
  isOnline: boolean;
  activeStreamTitle?: string;
  concurrentViewers?: number;
  joinedAt: string;
  lastActiveAt: string;
}

const initialUsers: PlatformUser[] = [
  {
    uid: 'usr_vikram_streamer',
    displayName: 'Vikram Joshi (BGMI Esports)',
    email: 'creator_vikram@gmail.com',
    role: 'streamer',
    plan: 'monthly_149',
    status: 'active',
    dCoinsBalance: 320,
    dpBalance: 85,
    isOnline: true,
    activeStreamTitle: '🔴 BGMI Tier-1 Pro Scrims LIVE | Clutch Highlights',
    concurrentViewers: 840,
    joinedAt: '2026-09-12T10:00:00Z',
    lastActiveAt: 'Just now',
  },
  {
    uid: 'usr_aryan_streamer',
    displayName: 'Aryan Sharma (Tech & Podcasts)',
    email: 'streamer_aryan@outlook.com',
    role: 'streamer',
    plan: 'quarterly_449',
    status: 'active',
    dCoinsBalance: 450,
    dpBalance: 120,
    isOnline: true,
    activeStreamTitle: '🎙️ Creator Tech Talk Ep 44: AI Video Editing Workflows',
    concurrentViewers: 410,
    joinedAt: '2026-08-20T14:30:00Z',
    lastActiveAt: '2 mins ago',
  },
  {
    uid: 'usr_priya_creator',
    displayName: 'Priya Verma (IRL & Storytelling)',
    email: 'priya_vlogs@gmail.com',
    role: 'streamer',
    plan: 'annual_999',
    status: 'active',
    dCoinsBalance: 180,
    dpBalance: 240,
    isOnline: true,
    activeStreamTitle: '📍 Mumbai Midnight Food Tour LIVE | High-Bitrate Chat',
    concurrentViewers: 620,
    joinedAt: '2026-07-15T09:15:00Z',
    lastActiveAt: 'Just now',
  },
  {
    uid: 'usr_arjun_editor',
    displayName: 'Arjun Sharma (Pro Montage)',
    email: 'arjun_edits@gmail.com',
    role: 'editor',
    plan: 'pro',
    status: 'active',
    dCoinsBalance: 950,
    dpBalance: 420,
    isOnline: true,
    joinedAt: '2026-06-01T12:00:00Z',
    lastActiveAt: '5 mins ago',
  },
  {
    uid: 'usr_rohit_editor',
    displayName: 'Rohit K. (Rapid Shorts)',
    email: 'rohit_shorts@outlook.com',
    role: 'editor',
    plan: 'monthly_149',
    status: 'active',
    dCoinsBalance: 410,
    dpBalance: 180,
    isOnline: true,
    joinedAt: '2026-08-04T16:20:00Z',
    lastActiveAt: '12 mins ago',
  },
  {
    uid: 'usr_rahul_montage',
    displayName: 'Rahul Verma (Gaming Cuts)',
    email: 'montage_rahul@gmail.com',
    role: 'editor',
    plan: 'intro_29',
    status: 'active',
    dCoinsBalance: 120,
    dpBalance: 35,
    isOnline: false,
    joinedAt: '2026-09-28T11:45:00Z',
    lastActiveAt: '1 hour ago',
  },
  {
    uid: 'usr_sameer_new',
    displayName: 'Sameer Khan (Valorant Streamer)',
    email: 'sameer_gaming@yahoo.com',
    role: 'streamer',
    plan: 'free_trial',
    status: 'trial',
    dCoinsBalance: 40,
    dpBalance: 10,
    isOnline: false,
    joinedAt: '2026-10-10T18:00:00Z',
    lastActiveAt: '3 hours ago',
  },
  {
    uid: 'usr_tanmay_casual',
    displayName: 'Tanmay Bhatia (Reaction Creator)',
    email: 'tanmay_reacts@gmail.com',
    role: 'streamer',
    plan: 'monthly_149',
    status: 'active',
    dCoinsBalance: 290,
    dpBalance: 60,
    isOnline: true,
    activeStreamTitle: '😂 Reacting to Creator Memes & Tech Fails',
    concurrentViewers: 320,
    joinedAt: '2026-09-01T08:00:00Z',
    lastActiveAt: 'Just now',
  },
];

const usersStore = new Map<string, PlatformUser>();

initialUsers.forEach((u) => usersStore.set(u.uid, u));

export function getAllPlatformUsers(): PlatformUser[] {
  return Array.from(usersStore.values());
}

export function getPlatformUser(uid: string): PlatformUser | undefined {
  return usersStore.get(uid);
}

export function updatePlatformUser(uid: string, updates: Partial<PlatformUser>): PlatformUser {
  const existing = usersStore.get(uid);
  if (!existing) {
    throw new Error(`User with UID ${uid} not found`);
  }
  const updated = { ...existing, ...updates };
  usersStore.set(uid, updated);
  return updated;
}

export function createPlatformUser(user: PlatformUser): PlatformUser {
  usersStore.set(user.uid, user);
  return user;
}
