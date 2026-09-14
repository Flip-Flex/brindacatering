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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { MenuCategory, MenuItem } from '@/data/menu';

export const Route = createFileRoute('/customer/build-menu')({
  component: BuildMenuPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      edit: search.edit as string | undefined,
    }
  }
});

function BuildMenuPage() {
  const { edit } = Route.useSearch();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [contactName, setContactName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [customFoodsList, setCustomFoodsList] = useState<string[]>([]);
  const [customFoodInput, setCustomFoodInput] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const catSnapshot = await getDocs(query(collection(db!, 'menuCategories'), orderBy('order')));
        setCategories(catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuCategory));

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
            setEventDate(data.eventDate || '');
            setGuestCount(data.guestCount || '');
            setCustomNotes(data.customNotes || '');
            setCustomFoodsList(data.customFoods || []);
            setContactName(data.userName || '');
            setMobileNumber(data.mobileNumber || '');
            
            if (data.selectedItems) {
              const ids = new Set<string>();
              data.selectedItems.forEach((i: any) => ids.add(i.id));
              setSelectedItemIds(ids);
            }
          }
        } catch(e) {
          console.error("Error fetching existing quote", e);
        }
      }
      fetchQuote();
    }
  }, [edit, auth?.currentUser]);

  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleAddCustomFood = () => {
    if (customFoodInput.trim()) {
      setCustomFoodsList(prev => [...prev, customFoodInput.trim()]);
      setCustomFoodInput('');
    }
  };

  const removeCustomFood = (index: number) => {
    setCustomFoodsList(prev => prev.filter((_, i) => i !== index));
  };

  const selectedItemsList = items.filter(i => selectedItemIds.has(i.id));

  const handleGeneratePDF = (customerName: string, customerEmail: string, mobile: string) => {
    let tableData: any[][] = [];
    
    if (selectedItemsList.length > 0 || customFoodsList.length > 0) {
      const standardTableData = selectedItemsList.map((item, index) => [
        index + 1,
        item.name,
        categories.find(c => c.id === item.category)?.name || 'Other',
        item.description || ''
      ]);

      const customTableData = customFoodsList.map((food, index) => [
        selectedItemsList.length + index + 1,
        food,
        'Custom Request',
        ''
      ]);

      tableData = [...standardTableData, ...customTableData];
    }
    
    generateQuotePDF({
      customerName,
      customerEmail,
      mobile,
      eventDate,
      guestCount,
      customNotes,
      tableData
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      toast.error("You must be logged in to submit a quote.");
      return;
    }

    if (selectedItemIds.size === 0 && customFoodsList.length === 0) {
      toast.error("Please select at least one item or add a custom food.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userEmail = auth!.currentUser!.email || 'Unknown';
      const userName = auth!.currentUser!.displayName || userEmail.split('@')[0] || 'Unknown';
      const finalName = contactName.trim() || userName;
      
      // Generate and download PDF
      handleGeneratePDF(finalName, userEmail, mobileNumber.trim());

      // Save to Firestore
      const quoteData = {
        userId: auth!.currentUser!.uid,
        userEmail,
        userName: finalName,
        mobileNumber: mobileNumber.trim(),
        eventDate,
        guestCount,
        customFoods: customFoodsList,
        customNotes: customNotes.trim(),
        selectedItems: selectedItemsList.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category
        })),
        status: 'pending', // pending, reviewed, quoted
        ...(edit ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() })
      };

      if (edit) {
        await updateDoc(doc(db!, 'menuRequests', edit), quoteData);
        toast.success("Quote updated successfully! Your PDF is downloading.");
      } else {
        await addDoc(collection(db!, 'menuRequests'), quoteData);
        toast.success("Menu request submitted successfully! Your PDF is downloading.");
      }
      setIsModalOpen(false);
      setSelectedItemIds(new Set()); // Reset
      setEventDate('');
      setGuestCount('');
      setCustomFoodsList([]);
      setCustomFoodInput('');
      setCustomNotes('');
    } catch (err) {
      console.error("Submission error", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading menu...</div>;

  return (
    <div className="relative pb-32">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{edit ? 'Edit Your Menu' : 'Build Your Menu'}</h1>
        <p className="text-slate-500 mt-1">{edit ? 'Update your selections and regenerate your quote.' : 'Select the items you want for your event and get an instant quote.'}</p>
      </div>

      <div className="space-y-16">
        {categories.map(category => {
          const categoryItems = items.filter(i => i.category === category.id);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id}>
              <h2 className="text-lg font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map(item => {
                  const isSelected = selectedItemIds.has(item.id);
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
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                        </div>
                        <div className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300 bg-slate-50'
                        }`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">Add Custom Dishes</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">Can't find a specific dish? Add it here and we'll include it in your quote.</p>
          <div className="flex gap-3 mb-6">
            <Input 
              placeholder="e.g., Special Vegan Pasta" 
              value={customFoodInput}
              onChange={e => setCustomFoodInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomFood();
                }
              }}
              className="bg-white"
            />
            <Button onClick={handleAddCustomFood} type="button">Add</Button>
          </div>
          
          {customFoodsList.length > 0 && (
            <div className="space-y-2">
              {customFoodsList.map((food, index) => (
                <div key={index} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                  <span className="font-medium text-slate-800">{food}</span>
                  <button onClick={() => removeCustomFood(index)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-4 animate-in slide-in-from-bottom-full duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-medium">{selectedItemIds.size + customFoodsList.length} items selected</p>
            <p className="text-sm text-slate-500 hidden sm:block">
              {(selectedItemIds.size + customFoodsList.length) === 0 ? "Building a custom menu?" : "Ready to generate your quote?"}
            </p>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="px-8">Continue</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Event Details</DialogTitle>
                <DialogDescription>
                  Provide a few details about your event to generate your PDF quote request.
                </DialogDescription>
              </DialogHeader>
              <form id="quote-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      required 
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests">Expected Guest Count</Label>
                    <Input 
                      id="guests" 
                      type="number" 
                      min="1"
                      required 
                      placeholder="e.g. 500"
                      value={guestCount}
                      onChange={e => setGuestCount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-notes">Additional Notes (Optional)</Label>
                  <Textarea 
                    id="custom-notes" 
                    placeholder="Any allergies, special instructions, or notes for the chef..."
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                  />
                </div>
              </form>
              <DialogFooter>
                <Button type="submit" form="quote-form" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : edit ? "Update Quote & Get PDF" : "Submit Request & Get PDF"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
