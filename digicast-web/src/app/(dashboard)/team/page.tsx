'use client';

import { useEffect, useState } from 'react';
import {
  collection, getDocs, doc, getDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Mail, Shield, Trash2, Users } from 'lucide-react';

interface Member {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  telegramUpload?: boolean;
  joinedAt?: Timestamp;
}

const ROLE_CONFIG: Record<Member['role'], { label: string; color: string; bg: string }> = {
  owner:  { label: 'Owner',  color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  admin:  { label: 'Admin',  color: '#1B2237', bg: 'rgba(27,34,55,0.08)' },
  editor: { label: 'Editor', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  viewer: { label: 'Viewer', color: '#6B7280', bg: '#F4F6F9' },
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid));
        if (!userSnap.exists()) return;
        const wid: string = userSnap.data().defaultWorkspaceId;
        setWorkspaceId(wid);
        const snap = await getDocs(collection(db, 'workspaces', wid, 'members'));
        setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member)));
      } catch (err) {
        console.error('Team load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const currentUserIsOwner = members.find(m => m.uid === user?.uid)?.role === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 style={{ color: '#1B2237' }}>Team</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
          Manage who has access to your workspace.
        </p>
      </div>

      {/* Invite card — only owners can invite */}
      {currentUserIsOwner && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-4 h-4" style={{ color: '#1B2237' }} />
              <h2 style={{ color: '#1B2237' }}>Invite an editor</h2>
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Editors can view streams and generate clips. Telegram upload permission is off by default and must be enabled per-editor.
            </p>
          </div>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ border: '1px solid #E5E7EB', backgroundColor: '#F4F6F9' }}
            >
              <Mail className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
              <input
                type="email"
                placeholder="editor@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: '#1B2237' }}
              />
            </div>
            <button
              className="px-5 py-2.5 text-sm font-semibold rounded-xl transition hover:opacity-90"
              style={{ backgroundColor: '#1B2237', color: '#FFFFFF' }}
            >
              Send invite
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="space-y-3">
        <h2 style={{ color: '#1B2237' }}>
          Members
          <span className="ml-2 text-sm font-normal" style={{ color: '#9CA3AF' }}>
            {members.length}
          </span>
        </h2>

        {members.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center border border-dashed"
            style={{ borderColor: '#E5E7EB' }}
          >
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No members yet</p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            {members.map((member) => {
              const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.viewer;
              return (
                <div key={member.uid} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  {member.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoURL}
                      alt=""
                      className="w-9 h-9 rounded-full shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: '#F4F6F9', color: '#1B2237' }}
                    >
                      {member.displayName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1B2237' }}>
                      {member.displayName ?? 'Unknown'}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{member.email}</p>
                  </div>

                  {/* Telegram toggle indicator (editor only) */}
                  {member.role === 'editor' && (
                    <div
                      className="flex items-center gap-1 text-xs font-medium shrink-0"
                      style={{ color: member.telegramUpload ? '#059669' : '#9CA3AF' }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Telegram {member.telegramUpload ? 'on' : 'off'}
                    </div>
                  )}

                  {/* Role badge */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>

                  {/* Remove (not for owner, only owner can remove) */}
                  {member.role !== 'owner' && currentUserIsOwner && (
                    <button
                      className="shrink-0 transition hover:opacity-60"
                      style={{ color: '#D1D5DB' }}
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security notice */}
      <div
        className="rounded-xl p-4 text-xs leading-relaxed"
        style={{ backgroundColor: '#F4F6F9', color: '#9CA3AF' }}
      >
        Editors can only access this workspace. An editor from another workspace cannot see your streams, clips, or team. Telegram upload is <strong style={{ color: '#6B7280' }}>off by default</strong> for all new editors — enable it per-person above.
      </div>
    </div>
  );
}
