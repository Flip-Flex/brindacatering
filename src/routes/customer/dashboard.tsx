import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/customer/dashboard')({
  component: AccountDashboard,
});

function AccountDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!auth?.currentUser || !db) return;
      
      try {
        const q = query(
          collection(db, 'menuRequests'),
          where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort locally by createdAt descending
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        });

        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage your custom catering quotes and requests.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-slate-500" />
            Recent Quotes
          </h2>
          <Button asChild variant="default" size="sm" className="h-9">
            <Link to="/customer/build-menu" className="flex items-center gap-2">
              <Plus size={16} />
              Build New Menu
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading your quotes...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="text-slate-400" size={32} />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">No quotes yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
              You haven't built any custom menus yet. Create your first one to get a personalised quote!
            </p>
            <Button asChild>
              <Link to="/customer/build-menu">Start Building</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => (
              <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-slate-900">Quote for {req.eventDate}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Created {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{req.selectedItems?.length || 0} items selected</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/customer/build-menu" search={{ edit: req.id }}>
                      Edit Menu
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <a href={req.pdfUrl || '#'} download target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
