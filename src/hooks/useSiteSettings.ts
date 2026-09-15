import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface SiteSettings {
  isGalleryEnabled: boolean;
}

const defaultSettings: SiteSettings = {
  isGalleryEnabled: false, // Default to false to prevent flashing before DB loads
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...defaultSettings, ...snapshot.data() });
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to load site settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
