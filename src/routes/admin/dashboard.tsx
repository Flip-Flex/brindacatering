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
import { LogOut, Plus, Pencil, Trash2, ImageIcon, ChevronUp, ChevronDown, GripVertical, LayoutList, LayoutGrid } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MenuItem, MenuCategory, menuCategories as defaultCategories, AVAILABLE_TAGS } from '@/data/menu';
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MenuSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Item Dialog State
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    id: '', category: '', subcategoryId: '', name: '', description: '', image: '', tags: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<MenuCategory>>({
    name: '', description: ''
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [subcategoryFormData, setSubcategoryFormData] = useState<Partial<MenuSubcategory>>({ name: '', categoryId: '' });
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);

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

    // Fetch Subcategories
    const qSubcategories = query(collection(db, 'menuSubcategories'), orderBy('order'));
    const unsubscribeSubcategories = onSnapshot(qSubcategories, (snapshot) => {
      const dbSubcategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MenuSubcategory);
      setSubcategories(dbSubcategories);
    });

    return () => {
      unsubscribeItems();
      unsubscribeCategories();
      unsubscribeSubcategories();
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

  
  const resetSubcategoryForm = () => {
    setSubcategoryFormData({ name: '', categoryId: '' });
    setEditingSubcategoryId(null);
  };

  const openAddSubcategory = (categoryId: string) => {
    resetSubcategoryForm();
    setSubcategoryFormData({ name: '', categoryId });
    setIsSubcategoryDialogOpen(true);
  };

  const openEditSubcategory = (subcat: MenuSubcategory) => {
    setEditingSubcategoryId(subcat.id);
    setSubcategoryFormData({ name: subcat.name, categoryId: subcat.categoryId });
    setIsSubcategoryDialogOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryFormData.name || !subcategoryFormData.categoryId) return;
    
    setIsSavingSubcategory(true);
    try {
      if (editingSubcategoryId) {
        await updateDoc(doc(db!, 'menuSubcategories', editingSubcategoryId), {
          name: subcategoryFormData.name,
        });
      } else {
        const newId = subcategoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        const finalData = {
          id: newId,
          name: subcategoryFormData.name,
          categoryId: subcategoryFormData.categoryId,
          order: subcategories.filter(s => s.categoryId === subcategoryFormData.categoryId).length
        };
        await setDoc(doc(db!, 'menuSubcategories', newId), finalData);
      }
      
      setIsSubcategoryDialogOpen(false);
      resetSubcategoryForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save subcategory.');
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    const subItems = items.filter(item => item.subcategoryId === id);
    if (subItems.length > 0) {
      alert(`Cannot delete pack "${name}" because it contains ${subItems.length} items. Move or delete them first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete the pack "${name}"?`)) {
      try {
        await deleteDoc(doc(db!, 'menuSubcategories', id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete pack.');
      }
    }
  };


  // --- CATEGORY FUNCTIONS ---
  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '' });
    setEditingCategoryId(null);
  };

  const openAddCategory = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryFormData({ name: cat.name, description: cat.description || '' });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) return;
    
    setIsSavingCategory(true);
    try {
      if (editingCategoryId) {
        await updateDoc(doc(db!, 'menuCategories', editingCategoryId), {
          name: categoryFormData.name,
          description: categoryFormData.description || ''
        });
      } else {
        const newId = categoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const finalData = {
          id: newId,
          name: categoryFormData.name,
          description: categoryFormData.description || '',
          order: categories.length
        };
        await setDoc(doc(db!, 'menuCategories', newId), finalData);
      }
      
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    const categoryItems = getItemsForCategory(id);
    const categorySubcats = subcategories.filter(s => s.categoryId === id);
    if (categoryItems.length > 0 || categorySubcats.length > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${categoryItems.length} items and ${categorySubcats.length} subcategories. Please delete or move them first.`);
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

  
  const moveSubcategory = async (categoryId: string, subcatIndex: number, direction: 'up' | 'down') => {
    if (!db) return;
    const catSubcategories = subcategories.filter(s => s.categoryId === categoryId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    const newOrders = [...catSubcategories];
    
    if (direction === 'up' && subcatIndex > 0) {
      const temp = newOrders[subcatIndex];
      newOrders[subcatIndex] = newOrders[subcatIndex - 1];
      newOrders[subcatIndex - 1] = temp;
    } else if (direction === 'down' && subcatIndex < newOrders.length - 1) {
      const temp = newOrders[subcatIndex];
      newOrders[subcatIndex] = newOrders[subcatIndex + 1];
      newOrders[subcatIndex + 1] = temp;
    } else {
      return;
    }

    try {
      for (let i = 0; i < newOrders.length; i++) {
        await updateDoc(doc(db, 'menuSubcategories', newOrders[i].id), { order: i });
      }
    } catch (e) {
      console.error(e);
      alert('Failed to reorder subcategories');
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (!db) return;
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    
    const newCategories = [...categories];
    
    if (direction === 'up' && index > 0) {
      const temp = newCategories[index];
      newCategories[index] = newCategories[index - 1];
      newCategories[index - 1] = temp;
    } else if (direction === 'down' && index < newCategories.length - 1) {
      const temp = newCategories[index];
      newCategories[index] = newCategories[index + 1];
      newCategories[index + 1] = temp;
    } else {
      return;
    }

    try {
      for (let i = 0; i < newCategories.length; i++) {
        await updateDoc(doc(db, 'menuCategories', newCategories[i].id), { order: i });
      }
    } catch (error) {
      console.error("Failed to reorder categories", error);
    }
  };


  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // DroppableId is either "catId" (for no subcategory) or "sub:catId:subcatId" (for subcategory)
    const parseDroppableId = (id: string) => {
      if (id.startsWith('sub:')) {
        const parts = id.split(':');
        return { categoryId: parts[1], subcategoryId: parts[2] };
      }
      return { categoryId: id, subcategoryId: '' };
    };

    const srcParams = parseDroppableId(source.droppableId);
    const destParams = parseDroppableId(destination.droppableId);
    
    const getItems = (catId: string, subCatId: string) => {
      if (subCatId) {
        return items.filter(i => i.subcategoryId === subCatId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
      return items.filter(i => i.category === catId && !i.subcategoryId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    };

    const sourceItems = getItems(srcParams.categoryId, srcParams.subcategoryId);
    const destItems = srcParams.categoryId === destParams.categoryId && srcParams.subcategoryId === destParams.subcategoryId 
      ? sourceItems 
      : getItems(destParams.categoryId, destParams.subcategoryId);

    const draggedItem = sourceItems[source.index];
    if (!draggedItem) return;

    if (source.droppableId === destination.droppableId) {
      const newItems = Array.from(sourceItems);
      newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, draggedItem);

      // Optimistic update
      setItems(prev => prev.map(item => {
        if (item.id === draggedItem.id) return { ...item, order: destination.index };
        
        // Update other items in this list
        const inThisList = srcParams.subcategoryId ? item.subcategoryId === srcParams.subcategoryId : (item.category === srcParams.categoryId && !item.subcategoryId);
        if (inThisList) {
          const newIdx = newItems.findIndex(i => i.id === item.id);
          if (newIdx !== -1) return { ...item, order: newIdx };
        }
        return item;
      }));

      const batchWrites = newItems.map((item, index) => 
        updateDoc(doc(db!, 'menuItems', item.id), { order: index })
      );
      await Promise.all(batchWrites).catch(console.error);
    } else {
      const newSourceItems = Array.from(sourceItems);
      newSourceItems.splice(source.index, 1);
      const newDestItems = Array.from(destItems);
      newDestItems.splice(destination.index, 0, draggedItem);

      setItems(prev => prev.map(item => {
        if (item.id === draggedItem.id) {
          return { ...item, category: destParams.categoryId, subcategoryId: destParams.subcategoryId, order: destination.index };
        }
        const inSrcList = srcParams.subcategoryId ? item.subcategoryId === srcParams.subcategoryId : (item.category === srcParams.categoryId && !item.subcategoryId);
        if (inSrcList) {
          const newIdx = newSourceItems.findIndex(i => i.id === item.id);
          if (newIdx !== -1) return { ...item, order: newIdx };
        }
        const inDestList = destParams.subcategoryId ? item.subcategoryId === destParams.subcategoryId : (item.category === destParams.categoryId && !item.subcategoryId);
        if (inDestList) {
          const newIdx = newDestItems.findIndex(i => i.id === item.id);
          if (newIdx !== -1) return { ...item, order: newIdx };
        }
        return item;
      }));

      const sourceWrites = newSourceItems.map((item, index) => 
        updateDoc(doc(db!, 'menuItems', item.id), { order: index })
      );
      const destWrites = newDestItems.map((item, index) => {
        if (item.id === draggedItem.id) {
          return updateDoc(doc(db!, 'menuItems', item.id), { order: index, category: destParams.categoryId, subcategoryId: destParams.subcategoryId || '' });
        }
        return updateDoc(doc(db!, 'menuItems', item.id), { order: index });
      });

      await Promise.all([...sourceWrites, ...destWrites]).catch(console.error);
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
            <div className="flex bg-muted p-1 rounded-md">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="px-3"
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="px-3"
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            
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
                  <DialogTitle>{editingCategoryId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
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
                      {isSavingCategory ? 'Saving...' : (editingCategoryId ? 'Save Category' : 'Create Category')}
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
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
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
                      onChange={e => setFormData({...formData, category: e.target.value, subcategoryId: ''})}
                    >
                      <option value="" disabled>Select Category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.category && subcategories.some(sub => sub.categoryId === formData.category) && (
                    <div className="space-y-2">
                      <Label>Sub Category (Optional)</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.subcategoryId || ''}
                        onChange={e => setFormData({...formData, subcategoryId: e.target.value})}
                      >
                        <option value="">None (General items)</option>
                        {subcategories.filter(sub => sub.categoryId === formData.category).map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Price (Optional)</Label>
                    <Input 
                      value={formData.price || ''} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="e.g. ₹150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (Optional)</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background/50 max-h-32 overflow-y-auto">
                      {AVAILABLE_TAGS.map(tag => (
                        <label key={tag} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/20 p-1 pr-3 rounded">
                          <input 
                            type="checkbox" 
                            className="rounded border-input text-primary focus:ring-primary"
                            checked={formData.tags?.includes(tag)}
                            onChange={(e) => {
                              const currentTags = formData.tags || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, tags: [...currentTags, tag] });
                              } else {
                                setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
                              }
                            }}
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
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

            <Dialog open={isSubcategoryDialogOpen} onOpenChange={(open) => {
              if (!open) resetSubcategoryForm();
              setIsSubcategoryDialogOpen(open);
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingSubcategoryId ? 'Edit Pack (Subcategory)' : 'Add Pack (Subcategory)'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveSubcategory} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      required 
                      value={subcategoryFormData.name} 
                      onChange={e => setSubcategoryFormData({...subcategoryFormData, name: e.target.value})} 
                      placeholder="e.g. Starter"
                    />
                  </div>
                  
                  

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsSubcategoryDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSavingSubcategory}>
                      {isSavingSubcategory ? 'Saving...' : 'Save Pack'}
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
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-32">
              {categories.map((category, index) => {
                const categoryItems = getItemsForCategory(category.id).filter(i => !i.subcategoryId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                return (
                  <section
                    key={category.id}
                    id={category.id}
                    className="scroll-mt-24 pb-16 mb-8 border-b-4 border-slate-200/50"
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
                            <h2 className="font-display text-4xl sm:text-5xl flex items-center flex-wrap gap-4">
                              {category.name}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => openEditCategory(category)}>
                                <Pencil className="w-5 h-5" />
                              </Button>
                              <Button variant="outline" size="sm" className="ml-4 h-9" onClick={() => {
                                setSubcategoryFormData({ id: '', categoryId: category.id, name: '', description: '' });
                                setEditingSubcategoryId(null);
                                setIsSubcategoryDialogOpen(true);
                              }}>
                                <Plus className="w-4 h-4 mr-2" /> Add Sub Category
                              </Button>
                            </h2>
                            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
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
                      </div>
                    </Reveal>

                    
                    {/* Render Subcategories first */}
                    {(() => {
                      const catSubcats = subcategories.filter(s => s.categoryId === category.id).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
                      return catSubcats.map((subcat, subIndex) => {
                      const subcatItems = items.filter(i => i.subcategoryId === subcat.id).sort((a,b) => (a.order??0) - (b.order??0));
                      return (
                        <div key={subcat.id} className="mb-8 border border-border/50 rounded-xl bg-card p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-primary bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 shadow-sm">{subcat.name}</h3>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => moveSubcategory(category.id, subIndex, 'up')} disabled={subIndex === 0}>
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => moveSubcategory(category.id, subIndex, 'down')} disabled={subIndex === catSubcats.length - 1}>
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditSubcategory(subcat)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteSubcategory(subcat.id, subcat.name)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                          
                          <Droppable droppableId={`sub:${category.id}:${subcat.id}`}>
                            {(provided, snapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`${viewMode === 'list' ? 'flex flex-col gap-4' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} min-h-[100px] transition-colors p-2 rounded-xl ${snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20' : ''} ${subcatItems.length === 0 ? 'border border-dashed border-border/60 bg-card/50' : ''}`}
                              >
                                {subcatItems.length === 0 && (
                                  <div className="flex items-center justify-center p-6 text-sm text-muted-foreground col-span-full">
                                    No items in this pack.
                                  </div>
                                )}
                                {/* Items Render logic (reused) */}
                                {subcatItems.map((item, itemIndex) => {
                                  const displayImage = item.image?.startsWith('/src/assets/') ? item.image.replace('/src/assets/', '/assets/') : item.image;
                                  return (
                                    <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`group relative flex overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md ${viewMode === 'list' ? 'flex-row items-center pr-4' : 'flex-col'} ${snapshot.isDragging ? 'z-50 shadow-2xl ring-2 ring-primary scale-[1.02] opacity-90' : ''}`}
                                          style={provided.draggableProps.style}
                                        >
                                          {viewMode === 'list' ? (
                                            <div {...provided.dragHandleProps} className="p-4 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex items-center justify-center self-stretch bg-muted/30">
                                              <GripVertical className="w-5 h-5" />
                                            </div>
                                          ) : (
                                            <div className="absolute top-3 left-3 z-10 flex gap-2 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-sm">
                                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors">
                                                <GripVertical className="w-4 h-4" />
                                              </div>
                                            </div>
                                          )}
                                          {viewMode === 'grid' && (
                                            <div className="absolute top-3 right-3 z-10 flex gap-2 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-sm">
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => openEditItem(item)}><Pencil className="w-4 h-4" /></Button>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                          )}
                                          {displayImage ? (
                                            <div className={`relative shrink-0 overflow-hidden bg-muted ${viewMode === 'list' ? 'w-32 h-24 rounded-md my-4 ml-4' : 'aspect-[4/3]'}`}>
                                              <img src={displayImage} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover group-hover:scale-105 pointer-events-none" />
                                            </div>
                                          ) : (
                                            <div className={`relative shrink-0 overflow-hidden bg-muted/30 flex flex-col items-center justify-center border-border/50 ${viewMode === 'list' ? 'w-32 h-24 rounded-md border my-4 ml-4' : 'aspect-[4/3] border-b'}`}>
                                              <span className="text-xs font-medium text-muted-foreground/60">No Image</span>
                                            </div>
                                          )}
                                          <div className={`flex flex-1 flex-col ${viewMode === 'list' ? 'py-4 px-6' : 'p-6'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                              <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'flex-wrap' : ''}`}>
                                                <h3 className="font-display text-xl leading-tight text-foreground">{item.name}</h3>
                                                {item.price && <span className="shrink-0 text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>}
                                              </div>
                                            </div>
                                            {viewMode === 'grid' && item.tags?.length ? (
                                              <div className="mt-4 flex flex-wrap gap-2">
                                                {item.tags.map((tag) => <span key={tag} className="rounded-sm bg-secondary/80 px-2.5 py-1 text-xs uppercase text-secondary-foreground">{tag}</span>)}
                                              </div>
                                            ) : null}
                                            <p className={`text-sm leading-relaxed text-muted-foreground ${viewMode === 'list' ? 'mt-2 line-clamp-2 max-w-3xl' : 'mt-5'}`}>{item.description}</p>
                                          </div>
                                          {viewMode === 'list' && (
                                            <div className="flex gap-2">
                                              <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-primary hover:bg-primary/10" onClick={() => openEditItem(item)}><Pencil className="w-4 h-4" /></Button>
                                              <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )
                    });
                    })()}

                    {/* Uncategorized / Default category items */}
                    <div className="mt-6 mb-2 flex items-center justify-between">
                      <h3 className="font-bold text-lg text-foreground bg-muted px-4 py-2 rounded-lg border border-border shadow-sm">General Items</h3>
                      
                    </div>

                    <Droppable droppableId={category.id}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`${viewMode === 'list' ? 'flex flex-col gap-4' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} min-h-[150px] transition-colors p-2 rounded-xl ${snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20' : ''} ${categoryItems.length === 0 ? 'border border-dashed border-border/60 bg-card/50' : ''}`}
                        >
                          {categoryItems.length === 0 && (
                            <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} flex items-center justify-center p-12 text-sm text-muted-foreground`}>
                              No items in this category yet. Drag items here.
                            </div>
                          )}
                          
                          {categoryItems.map((item, itemIndex) => {
                            const displayImage = item.image?.startsWith('/src/assets/')
                              ? item.image.replace('/src/assets/', '/assets/')
                              : item.image;
                              
                            return (
                              <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`group relative flex overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md ${viewMode === 'list' ? 'flex-row items-center pr-4' : 'flex-col'} ${snapshot.isDragging ? 'z-50 shadow-2xl ring-2 ring-primary scale-[1.02] opacity-90' : ''}`}
                                    style={provided.draggableProps.style}
                                  >
                                    {viewMode === 'list' ? (
                                      <div 
                                        {...provided.dragHandleProps} 
                                        className="p-4 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex items-center justify-center self-stretch bg-muted/30"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="w-5 h-5" />
                                      </div>
                                    ) : (
                                      <div className="absolute top-3 left-3 z-10 flex gap-2 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-sm">
                                        <div 
                                          {...provided.dragHandleProps} 
                                          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors"
                                          title="Drag to reorder"
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                      </div>
                                    )}

                                    {viewMode === 'grid' && (
                                      <div className="absolute top-3 right-3 z-10 flex gap-2 transition-opacity bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border border-border shadow-sm">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => openEditItem(item)}>
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}

                                    {displayImage ? (
                                      <div className={`relative shrink-0 overflow-hidden bg-muted ${viewMode === 'list' ? 'w-32 h-24 rounded-md my-4 ml-4' : 'aspect-[4/3]'}`}>
                                        <img
                                          src={displayImage}
                                          alt={item.name}
                                          loading="lazy"
                                          decoding="async"
                                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                                        />
                                      </div>
                                    ) : (
                                       <div className={`relative shrink-0 overflow-hidden bg-muted/30 flex flex-col items-center justify-center border-border/50 ${viewMode === 'list' ? 'w-32 h-24 rounded-md border my-4 ml-4' : 'aspect-[4/3] border-b'}`}>
                                         <span className="text-xs font-medium text-muted-foreground/60">No Image</span>
                                       </div>
                                    )}
                                    <div className={`flex flex-1 flex-col ${viewMode === 'list' ? 'py-4 px-6' : 'p-6'}`}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'flex-wrap' : ''}`}>
                                          <h3 className="font-display text-xl leading-tight text-foreground">{item.name}</h3>
                                          {item.price ? (
                                            <span className="shrink-0 text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                                          ) : null}
                                        </div>
                                      </div>
                                      
                                      {viewMode === 'grid' && item.tags?.length ? (
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

                                      <p className={`text-sm leading-relaxed text-muted-foreground ${viewMode === 'list' ? 'mt-2 line-clamp-2 max-w-3xl' : 'mt-5'}`}>
                                        {item.description}
                                      </p>
                                    </div>

                                    {viewMode === 'list' && (
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10" onClick={() => openEditItem(item)} title="Edit Item">
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item)} title="Delete Item">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </section>
                );
              })}
            </div>
          </DragDropContext>
        )}

      </div>
    </div>
  );
}
