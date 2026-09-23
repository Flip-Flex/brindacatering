import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Plus, Pencil, Trash2, ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItem, MenuCategory, menuCategories as defaultCategories } from '@/data/menu';
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Item Dialog State
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    id: '', category: '', name: '', description: '', image: '', tags: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Partial<MenuCategory>>({
    name: '', description: ''
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (!db) return;
    
    // Fetch Items
    const qItems = query(collection(db, 'menuItems'), orderBy('order'));
    const unsubscribeItems = onSnapshot(qItems, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuItem);
      setItems(data);
      setLoading(false);
    });

    // Fetch Categories
    const qCategories = query(collection(db, 'menuCategories'), orderBy('order'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const dbCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuCategory);
      setCategories(dbCategories);
    });

    return () => {
      unsubscribeItems();
      unsubscribeCategories();
    };
  }, []);

  const handleLogout = () => {
    auth?.signOut();
  };

  // --- ITEM FUNCTIONS ---
  const resetItemForm = () => {
    setEditingId(null);
    setFormData({ id: '', category: '', name: '', description: '', image: '', tags: [] });
    setImageFile(null);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingId(item.id);
    setFormData(item);
    setImageFile(null);
    setIsItemDialogOpen(true);
  };

  const openAddItem = () => {
    resetItemForm();
    setFormData({ ...formData, id: `item-${Date.now()}`, order: items.length });
    setIsItemDialogOpen(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db!, 'menuItems', item.id));
        if (item.image && item.image.includes('firebasestorage') && storage) {
          const fileRef = ref(storage, item.image);
          await deleteObject(fileRef).catch(e => console.error("Could not delete image from storage", e));
        }
      } catch (err) {
        console.error("Failed to delete item:", err);
        alert("Failed to delete item.");
      }
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let imageUrl = formData.image;

      if (imageFile && storage) {
        const storageRef = ref(storage, `menu-images/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const finalData = {
        ...formData,
        image: imageUrl || '',
      };

      // Cleanup old image if we are editing an existing item and the image changed
      if (editingId) {
        const originalItem = items.find(i => i.id === editingId);
        if (
          originalItem && 
          originalItem.image && 
          originalItem.image !== finalData.image && 
          originalItem.image.includes('firebasestorage') && 
          storage
        ) {
          try {
            const oldRef = ref(storage, originalItem.image);
            await deleteObject(oldRef);
            console.log('Deleted old image');
          } catch (err) {
            console.error('Failed to delete old image:', err);
          }
        }
      }

      if (editingId) {
        await updateDoc(doc(db!, 'menuItems', editingId), finalData);
      } else {
        await setDoc(doc(db!, 'menuItems', finalData.id as string), finalData);
      }

      setIsItemDialogOpen(false);
      resetItemForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save item.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- CATEGORY FUNCTIONS ---
  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '' });
  };

  const openAddCategory = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) return;
    
    setIsSavingCategory(true);
    try {
      const newId = categoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const finalData = {
        id: newId,
        name: categoryFormData.name,
        description: categoryFormData.description || '',
        order: categories.length
      };

      await setDoc(doc(db!, 'menuCategories', newId), finalData);
      
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (err) {
      console.error(err);
      alert('Failed to create category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    const categoryItems = getItemsForCategory(id);
    if (categoryItems.length > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${categoryItems.length} items. Please delete or move these items to another category first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      try {
        await deleteDoc(doc(db!, 'menuCategories', id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete category.');
      }
    }
  };

  const getItemsForCategory = (categoryId: string) => {
    return items.filter(item => item.category === categoryId);
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (!db) return;
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const currentCategory = newCategories[index];
    const targetCategory = newCategories[targetIndex];
    if (!currentCategory || !targetCategory) return;
    
    const currentOrder = currentCategory.order ?? index;
    const targetOrder = targetCategory.order ?? targetIndex;
    
    currentCategory.order = targetOrder;
    targetCategory.order = currentOrder;

    try {
      await updateDoc(doc(db, 'menuCategories', currentCategory.id), { order: currentCategory.order });
      await updateDoc(doc(db, 'menuCategories', targetCategory.id), { order: targetCategory.order });
    } catch (error) {
      console.error("Failed to reorder", error);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card border border-border rounded-lg shadow-sm p-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary mb-2">Menu Manager</h1>
            <p className="text-muted-foreground">Manage your menu items exactly as they appear on the site.</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            
            {/* ADD CATEGORY DIALOG */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
              if (!open) resetCategoryForm();
              setIsCategoryDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={openAddCategory} className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveCategory} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input 
                      required 
                      value={categoryFormData.name} 
                      onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})} 
                      placeholder="e.g. Beverages"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={categoryFormData.description} 
                      onChange={e => setCategoryFormData({...categoryFormData, description: e.target.value})} 
                      placeholder="Refreshing drinks and juices..."
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSavingCategory}>
                      {isSavingCategory ? 'Saving...' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* ADD ITEM DIALOG */}
            <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
              if (!open) resetItemForm();
              setIsItemDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button onClick={openAddItem} className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-2" /> Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveItem} className="space-y-4 py-4">
                  
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Chicken 65"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="" disabled>Select Category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Price (Optional)</Label>
                    <Input 
                      value={formData.price || ''} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="e.g. ₹150"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Brief description of the dish..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Image Upload</Label>
                    <div className="flex items-center space-x-4">
                      {formData.image && !imageFile && (
                        <img src={formData.image.startsWith('/src/assets/') ? formData.image.replace('/src/assets/', '/assets/') : formData.image} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex flex-col gap-2 w-full">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                            }
                          }}
                        />
                        {(formData.image || imageFile) && (
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="w-fit mt-2"
                            onClick={() => {
                              setFormData({ ...formData, image: '' });
                              setImageFile(null);
                            }}
                          >
                            Remove Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>


          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading menu items...</div>
        ) : (
          <div className="space-y-32">
            {categories.map((category, index) => {
              const categoryItems = getItemsForCategory(category.id);
              return (
                <section
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-24"
                >
                  <Reveal className="mb-12 group/cat">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => moveCategory(index, 'up')} disabled={index === 0}>
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => moveCategory(index, 'down')} disabled={index === categories.length - 1}>
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <div>
                          <h2 className="font-display text-4xl sm:text-5xl">
                            {category.name}
                          </h2>
                          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity" 
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        title="Delete Category"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </Reveal>

                  {categoryItems.length ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryItems.map((item, itemIndex) => {
                        const displayImage = item.image?.startsWith('/src/assets/')
                          ? item.image.replace('/src/assets/', '/assets/')
                          : item.image;
                          
                        return (
                        <Reveal
                          key={item.id}
                          delay={(itemIndex % 4) * 80}
                          className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md"
                        >
                          <div className="absolute top-3 right-3 z-10 flex gap-2 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-sm">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => openEditItem(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {displayImage ? (
                            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                              <img
                                src={displayImage}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                             <div className="relative aspect-[4/3] overflow-hidden bg-muted/30 flex flex-col items-center justify-center border-b border-border/50">
                               <span className="text-sm font-medium text-muted-foreground/60">No Image Available</span>
                             </div>
                          )}
                          <div className="flex flex-1 flex-col p-6">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-display text-xl leading-tight text-foreground">{item.name}</h3>
                              {item.price ? (
                                <span className="shrink-0 text-sm font-medium text-primary">{item.price}</span>
                              ) : null}
                            </div>
                            
                            {item.tags?.length ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-sm bg-secondary/80 px-2.5 py-1 text-xs uppercase tracking-wider text-secondary-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            
                            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </Reveal>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground bg-card">
                      No items in this category yet.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
