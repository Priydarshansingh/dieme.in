import DashboardShell from '@/components/layout/DashboardShell';
import AuthGuard from '@/components/layout/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
