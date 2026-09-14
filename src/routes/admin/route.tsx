import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Utensils, Image, LogOut, Settings, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user is a customer
        try {
          const userDoc = await getDoc(doc(db!, 'customers', user.uid));
          if (userDoc.exists()) {
            // Customer trying to access admin - block them
            setIsAuthenticated(false);
          } else {
            // Admin or legacy user
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setIsAuthenticated(true); // Fallback for legacy
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Allow access to admin login page even if not authenticated
  if (!isAuthenticated && window.location.pathname !== '/admin' && window.location.pathname !== '/admin/') {
    window.location.href = '/admin';
    return null;
  }

  // If we are on the login page, don't render the admin layout (header/sidebar)
  if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
    // If they are already authenticated, redirect them to the dashboard
    if (isAuthenticated) {
      window.location.href = '/admin/dashboard';
      return null;
    }
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background/80 backdrop-blur-lg border-b border-border sticky top-0 z-40 shadow-sm transition-all">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-10">
            <h1 className="font-display text-xl tracking-wide text-primary flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </span>
              Admin
            </h1>
            <nav className="flex items-center gap-2">
              <Link
                to="/admin/home"
                className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                to="/admin/requests"
                className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Quotes</span>
              </Link>
              <Link
                to="/admin/dashboard"
                className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold flex items-center gap-2"
              >
                <Utensils className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </Link>
              <Link
                to="/admin/services"
                className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Services</span>
              </Link>
              <Link
                to="/admin/gallery"
                className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
              </Link>
              <Link
                to="/admin/settings"
                className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => auth?.signOut()}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
