import { createFileRoute, Outlet, useNavigate, Link, useMatchRoute } from '@tanstack/react-router';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { LogOut, User, FileText, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';

export const Route = createFileRoute('/customer')({
  component: AccountLayout,
});

function AccountLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  const isDashboard = matchRoute({ to: '/customer/dashboard', fuzzy: false });
  const isBuildMenu = matchRoute({ to: '/customer/build-menu', fuzzy: false });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const userDoc = await getDoc(doc(db!, 'customers', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (e) {
          console.error("Error fetching user data", e);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      navigate({ to: '/login' });
    }
  };

  const displayName = userData?.name ||
    auth?.currentUser?.displayName ||
    (auth?.currentUser?.email
      ? auth.currentUser.email.split('@')[0].charAt(0).toUpperCase() + auth.currentUser.email.split('@')[0].slice(1)
      : 'Customer');

  const displayEmail = userData?.email || auth?.currentUser?.email;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && window.location.pathname !== '/login') {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ─── MOBILE / TABLET TOP BAR ─── */}
      <header className="lg:hidden sticky top-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-base text-slate-900 tracking-tight">Brinda Caterers</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 font-medium flex items-center gap-1.5 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* ─── SIDEBAR ─── */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30 h-screen
            w-64 bg-white border-r border-slate-200
            flex flex-col shrink-0
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
          style={{ top: 0 }}
        >
          {/* Brand - Desktop only (mobile has the top bar) */}
          <div className="h-14 lg:h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
            <span className="font-bold text-lg text-slate-900 tracking-tight">Brinda Caterers</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</p>
            <Link
              to="/customer/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isDashboard
                  ? 'bg-slate-900 text-white font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboardIcon size={18} />
              Dashboard
            </Link>
            <Link
              to="/customer/build-menu"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isBuildMenu
                  ? 'bg-slate-900 text-white font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText size={18} />
              Build a Menu
            </Link>
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 min-w-0 min-h-screen flex flex-col">
          {/* Desktop Header */}
          <header className="hidden lg:flex h-16 border-b border-slate-200 bg-white items-center px-8 shrink-0 justify-between sticky top-0 z-20">
            <h1 className="text-xl font-semibold text-slate-800">Customer Portal</h1>
            <div className="flex items-center gap-4">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-medium text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-400">{displayEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            <div className="max-w-5xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* ─── MOBILE BOTTOM TAB BAR ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <Link
          to="/customer/dashboard"
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            isDashboard ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <LayoutDashboardIcon size={20} />
          <span>Dashboard</span>
          {isDashboard && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-900 rounded-b-full" />}
        </Link>
        <Link
          to="/customer/build-menu"
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            isBuildMenu ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <FileText size={20} />
          <span>Build Menu</span>
          {isBuildMenu && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-900 rounded-b-full" />}
        </Link>
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  );
}

// Simple icon component for the sidebar
function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
