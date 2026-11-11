// Firestore collection helpers — type-safe path builders
// Usage: col.streams(workspaceId)

export const col = {
  users: () => 'users',
  user: (uid: string) => `users/${uid}`,

  workspaces: () => 'workspaces',
  workspace: (wid: string) => `workspaces/${wid}`,

  members: (wid: string) => `workspaces/${wid}/members`,
  member: (wid: string, uid: string) => `workspaces/${wid}/members/${uid}`,

  youtube: (wid: string) => `workspaces/${wid}/youtube`,
  youtubeAccount: (wid: string, aid: string) => `workspaces/${wid}/youtube/${aid}`,

  streams: (wid: string) => `workspaces/${wid}/streams`,
  stream: (wid: string, sid: string) => `workspaces/${wid}/streams/${sid}`,

  clips: (wid: string) => `workspaces/${wid}/clips`,
  clip: (wid: string, cid: string) => `workspaces/${wid}/clips/${cid}`,

  telegram: (wid: string) => `workspaces/${wid}/telegram`,
  telegramConnection: (wid: string, tid: string) => `workspaces/${wid}/telegram/${tid}`,

  devices: (wid: string) => `workspaces/${wid}/devices`,
  device: (wid: string, did: string) => `workspaces/${wid}/devices/${did}`,

  subscriptions: () => 'subscriptions',
  subscription: (sid: string) => `subscriptions/${sid}`,
} as const;
