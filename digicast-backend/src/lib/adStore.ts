// Ad Pass Store
export interface UserAdPass {
  passExpiresAt: number;
  totalAdsWatched: number;
  lastAdWatchedAt: number;
}

export const userAdPassStore = new Map<string, UserAdPass>();
