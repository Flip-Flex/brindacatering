import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, Plus, Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { cateringHighlights as defaultHighlights } from '@/data/business';

export const Route = createFileRoute('/admin/home')({
  component: AdminHome,
});

type Highlight = {
  id: string;
  title: string;
  description: string;
  image: string;
  order: number;
}

function AdminHome() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<Partial<Highlight>>({
    id: '', title: '', description: '', image: '', order: 0
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'cateringHighlights'), orderBy('order'));
    const unsubscribeHighlights = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Highlight);
      setHighlights(dbData);
      setLoading(false);
    });

    return () => {
      unsubscribeHighlights();
    };
  }, []);

  const resetForm = () => {
    setFormData({ id: '', title: '', description: '', image: '', order: highlights.length });
    setImageFile(null);
  };

  const openAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (highlight: Highlight) => {
    setFormData(highlight);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleSeed = async () => {
    if (!db) return;
    if (confirm("Import initial highlights? This will add the hardcoded highlights to the database.")) {
      try {
        for (let i = 0; i < defaultHighlights.length; i++) {
          const h = defaultHighlights[i];
          const finalId = `hlt-${Date.now()}-${i}`;
          await setDoc(doc(db, 'cateringHighlights', finalId), { ...h, id: finalId, order: i });
        }
        alert("Highlights imported successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to import highlights.");
      }
    }
  };

  const handleDelete = async (highlight: Highlight) => {
    if (!db) return;
    if (confirm(`Are you sure you want to delete ${highlight.title}?`)) {
      try {
        await deleteDoc(doc(db, 'cateringHighlights', highlight.id));
        if (highlight.image.includes('firebasestorage') && storage) {
          const fileRef = ref(storage, highlight.image);
          await deleteObject(fileRef).catch(e => console.error(e));
        }
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);
    try {
      let imageUrl = formData.image;

      if (imageFile && storage) {
        if (formData.id && formData.image?.includes('firebasestorage')) {
           const oldRef = ref(storage, formData.image);
           await deleteObject(oldRef).catch(e => console.log('Old image cleanup failed or not found', e));
        }

        const storageRef = ref(storage, `highlights/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const finalId = formData.id || `hlt-${Date.now()}`;
      
      const finalData = {
        id: finalId,
        title: formData.title,
        description: formData.description || '',
        image: imageUrl || '',
        order: formData.order ?? highlights.length,
      };

      await setDoc(doc(db, 'cateringHighlights', finalId), finalData);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving highlight: ", error);
      alert("Failed to save highlight");
    } finally {
      setIsSaving(false);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (!db) return;
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === highlights.length - 1)) return;
    
    const newHighlights = [...highlights];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const currentItem = newHighlights[index];
    const targetItem = newHighlights[targetIndex];
    if (!currentItem || !targetItem) return;
    
    const currentOrder = currentItem.order ?? index;
    const targetOrder = targetItem.order ?? targetIndex;
    
    currentItem.order = targetOrder;
    targetItem.order = currentOrder;

    try {
      await updateDoc(doc(db, 'cateringHighlights', currentItem.id), { order: currentItem.order });
      await updateDoc(doc(db, 'cateringHighlights', targetItem.id), { order: targetItem.order });
    } catch (error) {
      console.error("Failed to reorder", error);
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading Highlights...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-5 py-12 sm:px-8 lg:px-12">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card border border-border rounded-lg shadow-sm p-6 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary mb-2">Home Manager</h1>
            <p className="text-muted-foreground">Manage your homepage catering highlight cards.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <div className="flex gap-2">
                {highlights.length === 0 && (
                  <Button variant="outline" onClick={(e) => { e.preventDefault(); handleSeed(); }}>
                    <Download className="w-4 h-4 mr-2" /> Seed Data
                  </Button>
                )}
                <Button onClick={openAdd}>
                  <Plus className="w-4 h-4 mr-2" /> Add Highlight
                </Button>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{formData.id ? 'Edit Highlight' : 'Add New Highlight'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 py-4">
                
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Weddings" />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Traditional feasts scaled for your celebration." />
                </div>

                <div className="space-y-2">
                  <Label>Image File</Label>
                  <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} required={!formData.image} />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving || (!imageFile && !formData.image)}>
                    {isSaving ? 'Saving...' : 'Save Highlight'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {highlights.map((highlight, index) => (
            <div key={highlight.id} className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => moveItem(index, 'up')} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => moveItem(index, 'down')} disabled={index === highlights.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-24 h-24 rounded overflow-hidden bg-muted shrink-0">
                {highlight.image && (
                  <img 
                    src={
                      highlight.image.startsWith('/src/assets/') 
                        ? (import.meta.glob('/src/assets/*.{jpg,png,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>)[highlight.image] || highlight.image
                        : highlight.image
                    } 
                    alt={highlight.title} 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg text-primary truncate">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{highlight.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(highlight)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(highlight)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}

          {highlights.length === 0 && (
            <div className="p-8 text-center bg-muted/30 border border-dashed rounded-lg text-muted-foreground">
              No highlights found. Click 'Add Highlight' to get started.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
