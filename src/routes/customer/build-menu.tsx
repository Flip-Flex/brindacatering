import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { generateQuotePDF } from '@/lib/pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, Plus, ChevronRight } from 'lucide-react';
import { MenuCategory, MenuItem, MenuSubcategory } from '@/data/menu';

export const Route = createFileRoute('/customer/build-menu')({
  component: BuildMenuPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      edit: search.edit as string | undefined,
    }
  }
});

interface EventEntry {
  id: string;
  label: string;
  isCustom: boolean;
  eventDate: string;
  guestCount: string;
  selectedItemIds: Set<string>;
  customFoods: string[];
  notes: string;
}

const DEFAULT_EVENT_LABELS = ['Reception Dinner', 'Wedding Morning', 'Wedding Lunch', 'Wedding Night'];

function makeEvent(label: string, isCustom = false): EventEntry {
  return {
    id: isCustom
      ? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      : label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
    isCustom,
    eventDate: '',
    guestCount: '',
    selectedItemIds: new Set<string>(),
    customFoods: [],
    notes: '',
  };
}

function BuildMenuPage() {
  const { edit } = Route.useSearch();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MenuSubcategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState<EventEntry[]>(() => DEFAULT_EVENT_LABELS.map((l) => makeEvent(l)));
  const [activeEventId, setActiveEventId] = useState<string>('');

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');

  const [customFoodInput, setCustomFoodInput] = useState('');

  const [contactName, setContactName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set initial active event ID once the events are initialized
    if (events.length > 0 && !activeEventId) {
      setActiveEventId(events[0].id);
    }
  }, [events, activeEventId]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const catSnapshot = await getDocs(query(collection(db!, 'menuCategories'), orderBy('order')));
        setCategories(catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuCategory));

        const subcatSnapshot = await getDocs(query(collection(db!, 'menuSubcategories'), orderBy('order')));
        setSubcategories(subcatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuSubcategory));

        const itemSnapshot = await getDocs(query(collection(db!, 'menuItems'), orderBy('order')));
        setItems(itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuItem));
      } catch (error) {
        console.error("Error fetching menu data", error);
        toast.error("Failed to load menu items.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    if (auth?.currentUser?.displayName && !contactName && !edit) {
      setContactName(auth.currentUser.displayName);
    }
  }, [auth?.currentUser?.displayName, edit]);

  useEffect(() => {
    if (edit && db && auth?.currentUser) {
      const fetchQuote = async () => {
        try {
          const docRef = doc(db, 'menuRequests', edit);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().userId === auth.currentUser?.uid) {
            const data = snap.data();
            setContactName(data.userName || '');
            setMobileNumber(data.mobileNumber || '');
            
            if (data.events && Array.isArray(data.events)) {
              const loadedEvents: EventEntry[] = data.events.map((ev: any, index: number) => {
                const ids = new Set<string>();
                if (ev.selectedItems) {
                  ev.selectedItems.forEach((i: any) => ids.add(i.id));
                }
                // Check if this is a default event label
                const isCustom = !DEFAULT_EVENT_LABELS.includes(ev.eventName);
                return {
                  id: isCustom ? `custom-${Date.now()}-${index}` : ev.eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  label: ev.eventName,
                  isCustom,
                  eventDate: ev.eventDate || '',
                  guestCount: ev.guestCount || '',
                  selectedItemIds: ids,
                  customFoods: ev.customFoods || [],
                  notes: ev.notes || '',
                };
              });

              // Merge loaded events with default empty events that weren't in the saved quote
              const loadedEventLabels = loadedEvents.map(e => e.label);
              const remainingDefaults = DEFAULT_EVENT_LABELS
                .filter(label => !loadedEventLabels.includes(label))
                .map(label => makeEvent(label));

              // We want to preserve a sensible order: loaded events first, then remaining defaults
              // Alternatively, sort them to match DEFAULT_EVENT_LABELS order, then custom.
              const allEvents = [...loadedEvents, ...remainingDefaults];
              setEvents(allEvents);
              if (allEvents.length > 0) {
                setActiveEventId(allEvents[0].id);
              }
            } else if (!data.events && (data.selectedItems || data.customFoods)) {
              // Legacy flat quote format support: migrate into the first event
              setEvents(prev => {
                const updated = [...prev];
                const first = { ...updated[0] };
                
                first.eventDate = data.eventDate || '';
                first.guestCount = data.guestCount || '';
                first.notes = data.customNotes || '';
                first.customFoods = data.customFoods || [];
                
                const ids = new Set<string>();
                if (data.selectedItems) {
                  data.selectedItems.forEach((i: any) => ids.add(i.id));
                }
                first.selectedItemIds = ids;
                
                updated[0] = first;
                return updated;
              });
            }
          }
        } catch(e) {
          console.error("Error fetching existing quote", e);
        }
      }
      fetchQuote();
    }
  }, [edit, auth?.currentUser]);

  const activeIndex = events.findIndex((e) => e.id === activeEventId);
  const activeEvent = events[activeIndex] || events[0];
  const isLastEvent = activeIndex === events.length - 1;

  if (!activeEvent) return null; // Wait for initialization

  const updateActiveEvent = (patch: Partial<EventEntry>) => {
    setEvents((prev) => prev.map((e) => (e.id === activeEventId ? { ...e, ...patch } : e)));
  };

  const toggleItem = (itemId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== activeEventId) return e;
        const next = new Set(e.selectedItemIds);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return { ...e, selectedItemIds: next };
      })
    );
  };

  const handleAddCustomFood = () => {
    if (!customFoodInput.trim()) return;
    updateActiveEvent({ customFoods: [...activeEvent.customFoods, customFoodInput.trim()] });
    setCustomFoodInput('');
  };

  const removeCustomFood = (index: number) => {
    updateActiveEvent({ customFoods: activeEvent.customFoods.filter((_, i) => i !== index) });
  };

  const validateCurrentEvent = () => {
    const hasPicks = activeEvent.selectedItemIds.size > 0 || activeEvent.customFoods.length > 0;
    const hasDate = !!activeEvent.eventDate;
    const hasGuests = !!activeEvent.guestCount;

    // If completely empty, they can move freely
    if (!hasPicks && !hasDate && !hasGuests) return true;

    if (hasPicks && (!hasDate || !hasGuests)) {
      toast.error(`Please enter Date and Guest Count for ${activeEvent.label}.`);
      return false;
    }

    if (!hasPicks && (hasDate || hasGuests)) {
      toast.error(`Please select at least one menu item for ${activeEvent.label}.`);
      return false;
    }

    return true;
  };

  const goToEvent = (id: string) => {
    if (id !== activeEventId && !validateCurrentEvent()) {
      return;
    }
    setActiveEventId(id);
    setCustomFoodInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextEvent = () => {
    if (!validateCurrentEvent()) return;
    const nextIndex = activeIndex + 1;
    if (nextIndex < events.length) {
      toast.success(`${activeEvent.label} saved locally`);
      goToEvent(events[nextIndex].id);
    }
  };

  const handleSaveOnly = () => {
    if (!validateCurrentEvent()) return;
    toast.success(`${activeEvent.label} saved locally`);
  };

  const handleAddCustomEvent = () => {
    if (!newEventName.trim()) return;
    const entry = makeEvent(newEventName.trim(), true);
    setEvents((prev) => [...prev, entry]);
    setActiveEventId(entry.id);
    setNewEventName('');
    setIsAddEventOpen(false);
  };

  const removeCustomEvent = (id: string) => {
    setEvents((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      if (activeEventId === id && filtered.length > 0) {
        setActiveEventId(filtered[0].id);
      }
      return filtered;
    });
  };

  const eventsWithSelections = events.filter((e) => e.selectedItemIds.size > 0 || e.customFoods.length > 0);

  const handleGeneratePDF = async (customerName: string, customerEmail: string, mobile: string) => {
    const pdfEvents = eventsWithSelections.map(ev => {
      let tableData: any[][] = [];
      
      const selectedItemsList = items.filter(i => ev.selectedItemIds.has(i.id));
      
      if (selectedItemsList.length > 0 || ev.customFoods.length > 0) {
        const standardTableData = selectedItemsList.map((item, index) => [
          index + 1,
          item.name,
          categories.find(c => c.id === item.category)?.name || 'Other',
          item.description || ''
        ]);
  
        const customTableData = ev.customFoods.map((food, index) => [
          selectedItemsList.length + index + 1,
          food,
          'Custom Request',
          ''
        ]);
  
        tableData = [...standardTableData, ...customTableData];
      }

      return {
        eventName: ev.label,
        eventDate: ev.eventDate,
        guestCount: ev.guestCount,
        customNotes: ev.notes,
        tableData
      };
    });
    
    await generateQuotePDF({
      customerName,
      customerEmail,
      mobile,
      events: pdfEvents
    });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      toast.error('You must be logged in to submit a quote.');
      return;
    }
    if (eventsWithSelections.length === 0) {
      toast.error('Please select at least one dish in at least one event.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userEmail = auth.currentUser.email || 'Unknown';
      const userName = auth.currentUser.displayName || userEmail.split('@')[0] || 'Unknown';
      const finalName = contactName.trim() || userName;

      // Generate and download PDF
      await handleGeneratePDF(finalName, userEmail, mobileNumber.trim());

      const eventsPayload = eventsWithSelections.map((ev) => ({
        eventName: ev.label,
        eventDate: ev.eventDate,
        guestCount: ev.guestCount,
        notes: ev.notes,
        customFoods: ev.customFoods,
        selectedItems: items
          .filter((i) => ev.selectedItemIds.has(i.id))
          .map((i) => ({ id: i.id, name: i.name, category: i.category })),
      }));

      const quoteData = {
        userId: auth.currentUser.uid,
        userEmail,
        userName: finalName,
        mobileNumber: mobileNumber.trim(),
        events: eventsPayload,
        status: 'pending',
        ...(edit ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() })
      };

      if (edit) {
        await updateDoc(doc(db!, 'menuRequests', edit), quoteData);
        toast.success("Quote updated successfully! Your PDF is downloading.");
      } else {
        await addDoc(collection(db!, 'menuRequests'), quoteData);
        toast.success("Menu request submitted successfully! Your PDF is downloading.");
      }

      setIsSubmitModalOpen(false);
      
      // Reset after submission if not editing
      if (!edit) {
        setEvents(() => DEFAULT_EVENT_LABELS.map((l) => makeEvent(l)));
        setActiveEventId(events[0]?.id);
      }
    } catch (err) {
      console.error('Submission error', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading menu...</div>;

  return (
    <div className="relative pb-40">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{edit ? 'Edit Your Menu' : 'Build Your Menu'}</h1>
        <p className="text-slate-500 mt-1">{edit ? 'Update your selections and regenerate your quote.' : 'Select the items you want for your events and get an instant quote.'}</p>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200 pb-4">
        {events.map((ev) => {
          const hasPicks = ev.selectedItemIds.size > 0 || ev.customFoods.length > 0;
          const isActive = ev.id === activeEventId;
          return (
            <div key={ev.id} className="relative">
              <Button 
                type="button" 
                variant={isActive ? 'default' : 'outline'} 
                onClick={() => goToEvent(ev.id)}
                className={`transition-all ${isActive ? 'shadow-sm' : 'bg-white hover:bg-slate-50'}`}
              >
                {hasPicks && <Check className="w-3.5 h-3.5 mr-1.5" />}
                {ev.label}
              </Button>
              {ev.isCustom && (
                <button
                  type="button"
                  onClick={() => removeCustomEvent(ev.id)}
                  className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shadow-sm"
                  aria-label={`Remove ${ev.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Add another event" className="bg-white hover:bg-slate-50">
              <Plus className="w-4 h-4 text-slate-600" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add another event</DialogTitle>
              <DialogDescription>E.g. Haldi, Sangeet, Mehendi — anything not already in the list.</DialogDescription>
            </DialogHeader>
            <Input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="Event name"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEvent()}
            />
            <DialogFooter>
              <Button type="button" onClick={handleAddCustomEvent}>
                Add event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Event Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{activeEvent.label} Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700">Date for {activeEvent.label}</Label>
            <Input
              type="date"
              className="bg-white"
              value={activeEvent.eventDate}
              onChange={(e) => updateActiveEvent({ eventDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Expected Guest Count</Label>
            <Input
              type="number"
              className="bg-white"
              placeholder="e.g. 500"
              value={activeEvent.guestCount}
              onChange={(e) => updateActiveEvent({ guestCount: e.target.value })}
            />
          </div>
        </div>
      </div>

            {/* Categories Grid for Active Event */}
      <div className="space-y-12">
        {categories.map((cat, index) => {
          const catItems = items.filter((i) => i.category === cat.id);
          if (catItems.length === 0) return null;
          
          const catSubcats = subcategories.filter(s => s.categoryId === cat.id).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
          const generalItems = catItems.filter(i => !i.subcategoryId).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

          const renderItem = (item: MenuItem) => {
            const isSelected = activeEvent.selectedItemIds.has(item.id);
            return (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`relative cursor-pointer p-5 rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.name}</h4>
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300 bg-slate-50'
                  }`}>
                    {isSelected && <Check size={14} />}
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div key={cat.id} className={`p-6 sm:p-10 rounded-[2rem] border border-slate-200/60 ${index % 2 === 0 ? 'bg-orange-50/40' : 'bg-teal-50/40'}`}>
              <h3 className="text-3xl font-bold text-slate-900 mb-8 pb-4 border-b-2 border-slate-200/80">{cat.name}</h3>
              
              {catSubcats.map(subcat => {
                const subcatItems = catItems.filter(i => i.subcategoryId === subcat.id).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
                if (subcatItems.length === 0) return null;
                return (
                  <div key={subcat.id} className="mb-10">
                    <div className="flex items-center mb-6 mt-4">
                      <h4 className="text-xl font-bold text-primary bg-primary/5 px-4 py-2 rounded-lg border border-primary/20">{subcat.name}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subcatItems.map(renderItem)}
                    </div>
                  </div>
                );
              })}

              {generalItems.length > 0 && (
                <div className="mb-8 mt-6">
                  {catSubcats.length > 0 && (
                    <div className="flex items-center mb-6 mt-4">
                      <h4 className="text-lg font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">General Items</h4>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generalItems.map(renderItem)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Food & Notes for Active Event */}
      <div className="mt-16 max-w-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">Custom Requests for {activeEvent.label}</h3>
        <div className="flex flex-col gap-8">
          {/* Custom Food */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h4 className="font-semibold text-slate-900 mb-2">Add a dish not on the menu</h4>
            <p className="text-sm text-slate-600 mb-4">Can't find a specific dish? Add it here.</p>
            <div className="flex gap-3 mb-6">
              <Input
                className="bg-white"
                value={customFoodInput}
                onChange={(e) => setCustomFoodInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFood();
                  }
                }}
                placeholder="e.g., Special Vegan Pasta"
              />
              <Button type="button" onClick={handleAddCustomFood}>
                Add
              </Button>
            </div>
            
            {activeEvent.customFoods.length > 0 && (
              <div className="space-y-2">
                {activeEvent.customFoods.map((food, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <span className="font-medium text-slate-800">{food}</span>
                    <button type="button" onClick={() => removeCustomFood(i)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save / Continue Actions */}
      <div className="flex flex-wrap gap-3 mt-12 pb-12 border-b border-slate-200">
        <Button type="button" variant="outline" className="bg-white" onClick={handleSaveOnly}>
          Save Selections
        </Button>
        {!isLastEvent && (
          <Button type="button" onClick={goToNextEvent}>
            Save & Continue to {events[activeIndex + 1].label}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Review Section */}
      <div className="mt-12">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Review Your Menu</h3>
        {eventsWithSelections.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No dishes selected yet in any event.</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
            <ul className="divide-y divide-slate-100">
              {eventsWithSelections.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {ev.selectedItemIds.size + ev.customFoods.length}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{ev.label}</p>
                      <p className="text-xs text-slate-500">
                        {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'Date TBD'} 
                        {ev.guestCount ? ` • ${ev.guestCount} guests` : ''}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => goToEvent(ev.id)}>
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-4 animate-in slide-in-from-bottom-full duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-medium">
              {eventsWithSelections.length} event(s) configured
            </p>
            <p className="text-sm text-slate-500 hidden sm:block">
              {eventsWithSelections.length === 0 ? "Select items to build your menu." : "Ready to generate your quote?"}
            </p>
          </div>
          
          <Dialog open={isSubmitModalOpen} onOpenChange={(open) => {
            if (open) {
              if (!validateCurrentEvent()) return;
              setIsSubmitModalOpen(true);
            } else {
              setIsSubmitModalOpen(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="px-8" disabled={eventsWithSelections.length === 0} onClick={(e) => {
                if (!validateCurrentEvent()) {
                  e.preventDefault();
                }
              }}>
                {edit ? 'Update Quote' : 'Get Quote'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Your contact details</DialogTitle>
                <DialogDescription>
                  Confirm your details to generate your PDF quote request.
                </DialogDescription>
              </DialogHeader>
              <form id="quote-form" onSubmit={handleFinalSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Contact Name</Label>
                  <Input 
                    id="contact-name" 
                    placeholder="Enter your name" 
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile-number">Mobile Number</Label>
                  <Input 
                    id="mobile-number" 
                    placeholder="Enter your mobile number" 
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    required
                  />
                </div>
              </form>
              <DialogFooter>
                <Button type="submit" form="quote-form" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : edit ? "Update & Download PDF" : "Submit Request & Download PDF"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
