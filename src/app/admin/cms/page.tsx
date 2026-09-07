'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminSettings, updateAdminSetting, createAdminSetting, SiteSetting } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic' },
  { code: 'om', label: 'Afaan Oromo' },
  { code: 'sw', label: 'Swahili' },
  { code: 'so', label: 'Somali' }
];

const SETTING_KEYS = [
  { key: 'hero_title', category: 'home', label: 'Hero Title', type: 'text' },
  { key: 'hero_subtitle', category: 'home', label: 'Hero Subtitle', type: 'textarea' },
  { key: 'site_logo', category: 'identity', label: 'Site Logo', type: 'image' },
  { key: 'footer_about', category: 'footer', label: 'Footer About Text', type: 'textarea' },
];

export default function CMSAdminPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [activeLang, setActiveLang] = useState('en');

  // Form states mapping setting keys to their values/images
  const [formData, setFormData] = useState<Record<string, { value: any; is_active: boolean; file?: File; previewUrl?: string }>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getAdminSettings();
      setSettings(data);
      
      const initialForm: Record<string, any> = {};
      
      // Initialize with backend data
      data.forEach(s => {
        initialForm[s.key] = {
          value: s.value || {},
          is_active: s.is_active,
          previewUrl: s.image || undefined
        };
      });
      
      // Initialize predefined keys that might not exist in backend yet
      SETTING_KEYS.forEach(k => {
        if (!initialForm[k.key]) {
          initialForm[k.key] = { value: {}, is_active: true };
        }
      });
      
      setFormData(initialForm);
    } catch (err) {
      toast.error("Failed to load CMS settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (key: string, lang: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: {
          ...prev[key]?.value,
          [lang]: text
        }
      }
    }));
  };

  const handleToggleActive = (key: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        is_active: !prev[key]?.is_active
      }
    }));
  };

  const handleFileChange = (key: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        file,
        previewUrl: URL.createObjectURL(file)
      }
    }));
  };

  const handleSave = async (key: string, category: string) => {
    try {
      const data = formData[key];
      const payload = new FormData();
      payload.append('key', key);
      payload.append('category', category);
      payload.append('value', JSON.stringify(data.value));
      payload.append('is_active', String(data.is_active));
      
      if (data.file) {
        payload.append('image', data.file);
      }

      // Check if it exists to decide POST vs PATCH
      const exists = settings.some(s => s.key === key);
      if (exists) {
        await updateAdminSetting(key, payload);
      } else {
        await createAdminSetting(payload);
        // Refresh to get ID
        fetchSettings();
      }
      
      toast.success(`${key.replace('_', ' ')} saved successfully`);
    } catch (err) {
      toast.error(`Failed to save ${key}`);
    }
  };

  if (!user || user.role !== 'super_admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Super Admins only.</div>;
  }

  const categories = Array.from(new Set(SETTING_KEYS.map(k => k.category)));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground mt-2">Manage dynamic text and imagery across the platform.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`p-3 text-left rounded-lg transition-colors font-medium ${activeTab === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)} Content
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Language Switcher for multilingual text fields */}
            <div className="bg-card border border-border p-4 rounded-xl flex gap-2 flex-wrap items-center shadow-sm shadow-black/5">
              <span className="text-sm font-semibold mr-2 text-muted-foreground">Editing Language:</span>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setActiveLang(lang.code)}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${activeLang === lang.code ? 'bg-primary text-primary-foreground font-bold shadow' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Form Fields for Active Category */}
            {SETTING_KEYS.filter(k => k.category === activeTab).map(setting => {
              const data = formData[setting.key] || { value: {}, is_active: true };
              
              return (
                <div key={setting.key} className="bg-card border border-border rounded-xl p-6 shadow-sm shadow-black/5 dark:shadow-none transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{setting.label}</h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input 
                          type="checkbox" 
                          checked={data.is_active} 
                          onChange={() => handleToggleActive(setting.key)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                        />
                        Active
                      </label>
                      <Button variant="primary" size="sm" onClick={() => handleSave(setting.key, setting.category)} className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save
                      </Button>
                    </div>
                  </div>

                  {setting.type === 'image' && (
                    <div className="flex items-start gap-6">
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden relative group">
                        {data.previewUrl ? (
                          <img src={data.previewUrl} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                          onChange={(e) => e.target.files?.[0] && handleFileChange(setting.key, e.target.files[0])}
                        />
                        <p className="text-xs text-muted-foreground mt-2">Upload a high-quality image. Max size 2MB.</p>
                      </div>
                    </div>
                  )}

                  {setting.type === 'text' && (
                    <div>
                      <Input
                        value={data.value[activeLang] || ''}
                        onChange={(e) => handleTextChange(setting.key, activeLang, e.target.value)}
                        placeholder={`Enter ${setting.label} in ${LANGUAGES.find(l => l.code === activeLang)?.label}...`}
                        className="w-full"
                      />
                    </div>
                  )}

                  {setting.type === 'textarea' && (
                    <div>
                      <textarea
                        value={data.value[activeLang] || ''}
                        onChange={(e) => handleTextChange(setting.key, activeLang, e.target.value)}
                        placeholder={`Enter ${setting.label} in ${LANGUAGES.find(l => l.code === activeLang)?.label}...`}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
