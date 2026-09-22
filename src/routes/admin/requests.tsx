import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, Mail, Clock, Search, Filter, ArrowUpDown, FileDown, RefreshCw, Trash2, IndianRupee } from 'lucide-react';
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

  // Pricing Modal State
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [selectedQuoteForPricing, setSelectedQuoteForPricing] = useState<any>(null);
  const [pricingState, setPricingState] = useState<Record<string, any>>({});
  const [activeEventTab, setActiveEventTab] = useState<string>('');

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

  const openPricingModal = (req: any) => {
    setSelectedQuoteForPricing(req);
    // Initialize pricing state from req.pricing if it exists, else generate it
    let initialPricing: Record<string, any> = {};
    let firstEvent = '';

    if (req.pricing) {
      for (const [key, val] of Object.entries(req.pricing)) {
        if (!firstEvent) firstEvent = key;
        if (Array.isArray(val)) {
          // Migrate old array format
          initialPricing[key] = {
            strategy: 'itemized',
            perPlatePrice: 0,
            perPlateQuantity: val.length > 0 ? val[0].quantity : parseInt(req.guestCount || '0', 10) || 0,
            perPlateDiscount: 0,
            items: val
          };
        } else {
          initialPricing[key] = val;
        }
      }
    } else {
      // Build from events
      if (req.events && req.events.length > 0) {
        req.events.forEach((ev: any) => {
          const eventName = ev.eventName || 'Event';
          if (!firstEvent) firstEvent = eventName;
          
          let items: any[] = [];
          if (ev.selectedItems) {
            ev.selectedItems.forEach((item: any) => items.push({ name: item.name, category: item.category || 'Other', quantity: parseInt(ev.guestCount || '0', 10) || 0, pricePerPlate: 0, discount: 0 }));
          }
          if (ev.customFoods) {
            ev.customFoods.forEach((food: string) => items.push({ name: food, category: 'Custom', quantity: parseInt(ev.guestCount || '0', 10) || 0, pricePerPlate: 0, discount: 0 }));
          }
          initialPricing[eventName] = {
            strategy: 'itemized',
            perPlatePrice: 0,
            perPlateQuantity: parseInt(ev.guestCount || '0', 10) || 0,
            perPlateDiscount: 0,
            items
          };
        });
      } else {
        // Legacy
        firstEvent = 'Main Event';
        let items: any[] = [];
        if (req.selectedItems) {
          req.selectedItems.forEach((item: any) => items.push({ name: item.name, category: item.category || 'Other', quantity: parseInt(req.guestCount || '0', 10) || 0, pricePerPlate: 0, discount: 0 }));
        }
        if (req.customFoods) {
          req.customFoods.forEach((food: string) => items.push({ name: food, category: 'Custom', quantity: parseInt(req.guestCount || '0', 10) || 0, pricePerPlate: 0, discount: 0 }));
        }
        initialPricing['Main Event'] = {
          strategy: 'itemized',
          perPlatePrice: 0,
          perPlateQuantity: parseInt(req.guestCount || '0', 10) || 0,
          perPlateDiscount: 0,
          items
        };
      }
    }
    
    setPricingState(initialPricing);
    setActiveEventTab(firstEvent);
    setPricingModalOpen(true);
  };

  const handlePricingChange = (eventName: string, itemIndex: number, field: string, value: string) => {
    setPricingState(prev => {
      const next = { ...prev };
      const numValue = parseInt(value || '0', 10);
      next[eventName].items[itemIndex] = {
        ...next[eventName].items[itemIndex],
        [field]: isNaN(numValue) ? 0 : numValue
      };
      return next;
    });
  };

  const handleEventPricingChange = (eventName: string, field: string, value: string | number) => {
    setPricingState(prev => {
      const next = { ...prev };
      if (field === 'strategy') {
        next[eventName] = { ...next[eventName], strategy: value };
      } else {
        const numValue = parseInt(value as string || '0', 10);
        next[eventName] = { ...next[eventName], [field]: isNaN(numValue) ? 0 : numValue };
      }
      return next;
    });
  };

  const savePricing = async () => {
    if (!selectedQuoteForPricing) return;
    try {
      await updateDoc(doc(db!, 'menuRequests', selectedQuoteForPricing.id), {
        pricing: pricingState
      });
      setRequests(prev => prev.map(r => r.id === selectedQuoteForPricing.id ? { ...r, pricing: pricingState } : r));
      toast.success("Pricing saved successfully!");
      setPricingModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save pricing.");
    }
  };

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
        events: pdfEvents,
        pricing: req.pricing // Pass pricing down to PDF generator
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
                      <Button variant="outline" size="sm" onClick={() => openPricingModal(req)} className="hidden sm:flex bg-background border-primary/20 hover:bg-primary/5 text-primary">
                        <IndianRupee size={16} className="mr-2" />
                        Pricing
                      </Button>
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
      <Dialog open={pricingModalOpen} onOpenChange={setPricingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Quotation Builder</DialogTitle>
            <DialogDescription>
              Assign per-plate prices and discounts for {selectedQuoteForPricing?.userName}'s requested menu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 min-h-0 py-2">
            {Object.keys(pricingState).length > 0 && (
              <Tabs value={activeEventTab} onValueChange={setActiveEventTab} className="w-full">
                <TabsList className="mb-4 flex flex-wrap h-auto">
                  {Object.keys(pricingState).map(evName => (
                    <TabsTrigger key={evName} value={evName}>{evName}</TabsTrigger>
                  ))}
                </TabsList>
                {Object.keys(pricingState).map(evName => {
                  const evState = pricingState[evName];
                  const items = evState?.items || [];
                  
                  let eventTotal = 0;
                  if (evState.strategy === 'per_plate') {
                    eventTotal = (evState.perPlateQuantity * evState.perPlatePrice) * (1 - (evState.perPlateDiscount / 100));
                  } else {
                    eventTotal = items.reduce((sum: number, item: any) => sum + ((item.quantity * item.pricePerPlate) * (1 - ((item.discount || 0) / 100))), 0);
                  }
                  
                  return (
                    <TabsContent key={evName} value={evName} className="space-y-4 m-0">
                      
                      <div className="flex gap-2 mb-4 bg-muted/30 p-2 rounded-lg border">
                        <Button 
                          variant={evState.strategy === 'per_plate' ? 'default' : 'ghost'} 
                          onClick={() => handleEventPricingChange(evName, 'strategy', 'per_plate')}
                          className="flex-1"
                        >
                          Flat Per Plate
                        </Button>
                        <Button 
                          variant={evState.strategy === 'itemized' ? 'default' : 'ghost'} 
                          onClick={() => handleEventPricingChange(evName, 'strategy', 'itemized')}
                          className="flex-1"
                        >
                          Itemized (Per Dish)
                        </Button>
                      </div>

                      {evState.strategy === 'per_plate' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Guests / Quantity</label>
                              <Input 
                                type="number" min="0" 
                                value={evState.perPlateQuantity || ''} 
                                onChange={(e) => handleEventPricingChange(evName, 'perPlateQuantity', e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Price Per Plate (₹)</label>
                              <Input 
                                type="number" min="0" 
                                value={evState.perPlatePrice || ''} 
                                onChange={(e) => handleEventPricingChange(evName, 'perPlatePrice', e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Discount (%)</label>
                              <Input 
                                type="number" min="0" max="100" 
                                value={evState.perPlateDiscount || ''} 
                                onChange={(e) => handleEventPricingChange(evName, 'perPlateDiscount', e.target.value)} 
                              />
                            </div>
                          </div>

                          <div className="bg-muted/10 border rounded-md p-4">
                            <h4 className="text-sm font-semibold mb-3">Included Dishes</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {items.map((it: any, i: number) => (
                                <div key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  {it.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-md overflow-hidden bg-background">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="w-[50px]">S.No</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="w-[100px]">Qty</TableHead>
                                <TableHead className="w-[120px]">Price/Plate</TableHead>
                                <TableHead className="w-[100px]">Discount %</TableHead>
                                <TableHead className="w-[120px] text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No items selected.</TableCell></TableRow>
                              ) : items.map((item: any, idx: number) => {
                                const lineTotal = (item.quantity * item.pricePerPlate) * (1 - ((item.discount || 0) / 100));
                                return (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell>
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Input 
                                        type="number" 
                                        min="0"
                                        className="h-8"
                                        value={item.quantity || ''}
                                        onChange={(e) => handlePricingChange(evName, idx, 'quantity', e.target.value)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input 
                                        type="number" 
                                        min="0"
                                        className="h-8"
                                        value={item.pricePerPlate || ''}
                                        onChange={(e) => handlePricingChange(evName, idx, 'pricePerPlate', e.target.value)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input 
                                        type="number" 
                                        min="0"
                                        max="100"
                                        className="h-8"
                                        value={item.discount || ''}
                                        onChange={(e) => handlePricingChange(evName, idx, 'discount', e.target.value)}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      ₹{Math.max(0, lineTotal).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      <div className="flex justify-end p-4 bg-muted/30 rounded-lg border">
                        <div className="text-lg">
                          <span className="text-muted-foreground mr-4">Total for {evName}:</span>
                          <span className="font-bold text-primary">₹{Math.max(0, eventTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setPricingModalOpen(false)}>Cancel</Button>
            <Button onClick={savePricing}>Save Quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
