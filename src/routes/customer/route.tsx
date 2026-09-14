import { createFileRoute, Outlet, useNavigate, Link } from '@tanstack/react-router';
import { auth, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut, User, FileText } from 'lucide-react';
import { signOut } from 'firebase/auth';

export const Route = createFileRoute('/customer')({
  component: AccountLayout,
});

function AccountLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

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

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading your account...</div>;
  }

  if (!isAuthenticated && window.location.pathname !== '/login') {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex flex-col min-h-screen shrink-0 sticky top-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <span className="font-bold text-lg text-slate-900 tracking-tight">Brinda Caterers</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Menu</p>
          <Link 
            to="/customer/dashboard"
            activeProps={{ className: "bg-slate-100 text-slate-900 font-medium" }}
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LayoutDashboardIcon size={18} />
            Dashboard
          </Link>
          <Link 
            to="/customer/build-menu"
            activeProps={{ className: "bg-slate-100 text-slate-900 font-medium" }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
              <p className="font-medium text-sm text-slate-900 truncate">
                {userData?.name || 
                 auth?.currentUser?.displayName || 
                 (auth?.currentUser?.email ? auth.currentUser.email.split('@')[0].charAt(0).toUpperCase() + auth.currentUser.email.split('@')[0].slice(1) : 'Customer')}
              </p>
              <p className="text-xs text-slate-500 truncate">{userData?.email || auth?.currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header (Only visible on mobile) */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4 md:hidden shrink-0 justify-between">
          <span className="font-bold text-lg text-slate-900">Brinda Caterers</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 font-medium flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>

        {/* Desktop Header Context Area */}
        <header className="h-16 border-b border-slate-200 bg-white hidden md:flex items-center px-8 shrink-0 justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Customer Portal</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Mobile Nav Links (Simple version) */}
            <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
              <Link 
                to="/customer/dashboard"
                activeProps={{ className: "bg-slate-800 text-white" }}
                activeOptions={{ exact: true }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white border border-slate-200 text-slate-600 whitespace-nowrap"
              >
                <LayoutDashboardIcon size={16} />
                Dashboard
              </Link>
              <Link 
                to="/customer/build-menu"
                activeProps={{ className: "bg-slate-800 text-white" }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white border border-slate-200 text-slate-600 whitespace-nowrap"
              >
                <FileText size={16} />
                Build Menu
              </Link>
            </div>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

// Just a simple icon component for the sidebar
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
