import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/layout/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#070910] text-slate-100 relative selection:bg-cyan-500/30 selection:text-white">
        {/* Ambient subtle glow for depth */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[320px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[320px] bg-indigo-500/5 blur-[140px] pointer-events-none rounded-full" />
        
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative z-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
