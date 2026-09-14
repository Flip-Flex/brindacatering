import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings, loading } = useSiteSettings();
  const [isGalleryEnabled, setIsGalleryEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsGalleryEnabled(settings.isGalleryEnabled);
    }
  }, [settings, loading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db!, 'settings', 'general');
      await setDoc(docRef, { isGalleryEnabled }, { merge: true });
      toast.success("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card border border-border rounded-lg shadow-sm p-6 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary mb-2 flex items-center gap-2">
              <SettingsIcon className="w-8 h-8" />
              Site Settings
            </h1>
            <p className="text-muted-foreground">Manage global features and visibility for the public website.</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving || settings.isGalleryEnabled === isGalleryEnabled}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-medium mb-6 border-b border-border pb-4">Feature Toggles</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="gallery-toggle" className="text-base">Enable Gallery Page</Label>
                <p className="text-sm text-muted-foreground">
                  Show or hide the gallery section on the homepage and the dedicated gallery page. 
                  When disabled, visitors trying to access the gallery will be redirected to the homepage.
                </p>
              </div>
              <Switch 
                id="gallery-toggle" 
                checked={isGalleryEnabled} 
                onCheckedChange={setIsGalleryEnabled} 
              />
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
