import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Users, Mail, Clock, Search, Filter, ArrowUpDown, FileDown, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { generateQuotePDF } from '@/lib/pdf';
import { menuItems } from '@/data/menu';

export const Route = createFileRoute('/admin/requests')({
  component: AdminRequestsPage,
});

function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchRequests = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const q = query(collection(db!, 'menuRequests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      if (isRefresh) toast.success(`Loaded ${snapshot.docs.length} quotes.`);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db!, 'menuRequests', requestId), { status: newStatus });
      toast.success("Status updated!");
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  const deleteRequest = async (requestId: string, customerName: string) => {
    if (!window.confirm(`Are you sure you want to delete the quote from "${customerName}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db!, 'menuRequests', requestId));
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Quote deleted.");
    } catch (e) {
      console.error("Error deleting request:", e);
      toast.error("Failed to delete quote.");
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

  if (loading) {
    return <div className="p-8 text-center">Loading requests...</div>;
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (req.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (req.mobileNumber || '').includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
      case 'newest':
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      case 'event-soonest':
        return new Date(a.eventDate || 0).getTime() - new Date(b.eventDate || 0).getTime();
      case 'event-furthest':
        return new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime();
      case 'guests-highest':
        return parseInt(b.guestCount || '0', 10) - parseInt(a.guestCount || '0', 10);
      case 'guests-lowest':
        return parseInt(a.guestCount || '0', 10) - parseInt(b.guestCount || '0', 10);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Menu Requests</h1>
          <p className="text-muted-foreground mt-1">Manage custom quotes submitted by customers.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchRequests(true)} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="bg-card border border-border/40 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by name, email, or phone..." 
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Submission (Newest)</SelectItem>
                <SelectItem value="oldest">Submission (Oldest)</SelectItem>
                <SelectItem value="event-soonest">Event (Soonest)</SelectItem>
                <SelectItem value="event-furthest">Event (Furthest)</SelectItem>
                <SelectItem value="guests-highest">Guests (Highest)</SelectItem>
                <SelectItem value="guests-lowest">Guests (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl border-border/60 text-muted-foreground">
            {requests.length === 0 ? "No requests received yet." : "No requests match your filters."}
          </div>
        ) : (
          filteredRequests.map(req => {
            const hasEvents = req.events && req.events.length > 0;
            const displayDate = hasEvents ? req.events.map((e: any) => e.eventDate).filter(Boolean).join(', ') : (req.eventDate || 'TBD');
            const displayGuests = hasEvents ? req.events.map((e: any) => e.guestCount).filter(Boolean).join(' / ') : (req.guestCount || 'TBD');
            
            // Flatten items for display
            let allItems: { name: string, category: string, eventName?: string }[] = [];
            if (hasEvents) {
              req.events.forEach((ev: any) => {
                if (ev.selectedItems) {
                  ev.selectedItems.forEach((item: any) => {
                    allItems.push({ ...item, eventName: ev.eventName });
                  });
                }
                if (ev.customFoods) {
                  ev.customFoods.forEach((food: string) => {
                    allItems.push({ name: food, category: 'custom', eventName: ev.eventName });
                  });
                }
              });
            } else {
              if (req.selectedItems) {
                allItems = [...req.selectedItems];
              }
              if (req.customFoods) {
                req.customFoods.forEach((food: string) => {
                  allItems.push({ name: food, category: 'custom' });
                });
              }
            }

            return (
              <Card key={req.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">{req.userName || 'Unknown Customer'}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5"><Mail size={14} /> {req.userEmail}</span>
                        {req.mobileNumber && (
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            {req.mobileNumber}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(req)} className="hidden sm:flex bg-background">
                        <FileDown size={16} className="mr-2 text-primary" />
                        View PDF
                      </Button>
                      <Select value={req.status || 'pending'} onValueChange={(val) => updateStatus(req.id, val)}>
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="quoted">Quoted</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteRequest(req.id, req.userName || 'Unknown')} 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="text-primary" size={16} />
                      <span className="font-medium text-foreground">Event Dates:</span> 
                      <span className="text-muted-foreground">{displayDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="text-primary" size={16} />
                      <span className="font-medium text-foreground">Guests:</span> 
                      <span className="text-muted-foreground">{displayGuests}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="text-muted-foreground" size={16} />
                      <span className="text-muted-foreground">
                        Submitted: {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'PP p') : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Selected Items ({allItems.length})</h4>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(req.id)} className="h-8 text-xs text-primary hover:text-primary/80">
                        {expandedIds.has(req.id) ? 'Hide Details' : 'Show More'}
                      </Button>
                    </div>
                    
                    {expandedIds.has(req.id) && (
                      <div className="bg-muted/20 rounded-lg border border-border/40 p-4 max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                          {allItems.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
