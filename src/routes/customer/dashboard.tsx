import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { generateQuotePDF } from '@/lib/pdf';
import { toast } from 'sonner';

export const Route = createFileRoute('/customer/dashboard')({
  component: AccountDashboard,
});

function AccountDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!auth?.currentUser || !db) return;
    
    try {
      const q = query(
        collection(db, 'menuRequests'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu request?")) return;
    try {
      await deleteDoc(doc(db!, 'menuRequests', id));
      toast.success("Menu request deleted successfully.");
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error("Error deleting quote:", err);
      toast.error("Failed to delete the menu request.");
    }
  };

  const handleDownloadPDF = async (req: any) => {
    try {
      let pdfEvents: any[] = [];

      if (req.events && Array.isArray(req.events)) {
        // Multi-event payload
        pdfEvents = req.events.map((ev: any) => {
          let tableData: any[][] = [];
          if (ev.selectedItems && Array.isArray(ev.selectedItems)) {
            ev.selectedItems.forEach((item: any, index: number) => {
              const catName = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Other';
              tableData.push([index + 1, item.name, catName, '']);
            });
          }
          if (ev.customFoods && Array.isArray(ev.customFoods)) {
            ev.customFoods.forEach((food: string, index: number) => {
              tableData.push([tableData.length + 1, food, 'Custom Request', '']);
            });
          }
          return {
            eventName: ev.eventName || 'Event',
            eventDate: ev.eventDate || '',
            guestCount: ev.guestCount || '',
            customNotes: ev.notes || '',
            tableData
          };
        });
      } else {
        // Legacy flat payload fallback
        let tableData: any[][] = [];
        if (req.selectedItems && Array.isArray(req.selectedItems)) {
          req.selectedItems.forEach((item: any, index: number) => {
            const catName = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Other';
            tableData.push([index + 1, item.name, catName, '']);
          });
        }
        if (req.customFoods && Array.isArray(req.customFoods)) {
          req.customFoods.forEach((food: string, index: number) => {
            tableData.push([tableData.length + 1, food, 'Custom Request', '']);
          });
        }
        pdfEvents.push({
          eventName: 'Main Event',
          eventDate: req.eventDate || 'TBD',
          guestCount: req.guestCount || 'TBD',
          customNotes: req.customNotes || '',
          tableData
        });
      }

      await generateQuotePDF({
        customerName: req.userName || 'Unknown Customer',
        customerEmail: req.userEmail || 'Unknown Email',
        mobile: req.mobileNumber || '',
        events: pdfEvents
      });
      toast.success("Quote PDF generated successfully.");
    } catch (err) {
      console.error("Error generating PDF", err);
      toast.error("Failed to generate PDF.");
    }
  };

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
            {requests.map((req) => {
              const itemCount = req.events 
                ? req.events.reduce((acc: number, ev: any) => acc + (ev.selectedItems?.length || 0), 0)
                : (req.selectedItems?.length || 0);

              const dateDisplay = req.events && req.events.length > 0 
                ? req.events.map((e: any) => e.eventDate).filter(Boolean).join(', ') || 'TBD'
                : req.eventDate || 'TBD';

              return (
                <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-slate-900">Custom Menu Quote</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        req.status === 'quoted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        req.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar size={14} className="text-primary" />
                        Dates: {dateDisplay}
                      </span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span>Submitted: {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span>{itemCount} items selected</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/customer/build-menu" search={{ edit: req.id }}>
                        Edit Menu
                      </Link>
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleDownloadPDF(req)}>
                      Download PDF
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteQuote(req.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
