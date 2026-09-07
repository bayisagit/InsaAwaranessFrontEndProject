'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminSettings, updateAdminSetting, createAdminSetting, SiteSetting } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Loader2, 
  Save, 
  Image as ImageIcon, 
  Copy, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Eye, 
  Globe, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/input';

import enMessages from '@messages/en.json';
import amMessages from '@messages/am.json';
import omMessages from '@messages/om.json';
import swMessages from '@messages/sw.json';
import soMessages from '@messages/so.json';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic' },
  { code: 'om', label: 'Afaan Oromo' },
  { code: 'sw', label: 'Swahili' },
  { code: 'so', label: 'Somali' }
];

const MESSAGES_MAP: Record<string, any> = {
  en: enMessages,
  am: amMessages,
  om: omMessages,
  sw: swMessages,
  so: soMessages,
};

const SETTING_KEYS = [
  { 
    key: 'hero_title', 
    category: 'home', 
    label: 'Hero Title', 
    type: 'text',
    defaultNamespace: 'landing',
    defaultKey: 'heroTitle',
  },
  { 
    key: 'hero_subtitle', 
    category: 'home', 
    label: 'Hero Subtitle', 
    type: 'textarea',
    defaultNamespace: 'landing',
    defaultKey: 'heroSubtitle',
  },
  { 
    key: 'site_logo', 
    category: 'identity', 
    label: 'Site Logo', 
    type: 'image',
    defaultFallback: '/logo.png',
  },
  { 
    key: 'footer_about', 
    category: 'footer', 
    label: 'Footer About Text', 
    type: 'textarea',
    defaultNamespace: 'landing',
    defaultKey: 'aboutDesc',
  },
];

function cleanHtmlTags(text: string): string {
  if (!text) return '';
  return text.replace(/<\/?[^>]+(>|$)/g, '');
}

function getDefaultValue(key: string, lang: string): string {
  const def = SETTING_KEYS.find(k => k.key === key);
  if (!def) return '';

  if (def.type === 'image') {
    return def.defaultFallback || '/logo.png';
  }

  const msgBundle = MESSAGES_MAP[lang] || MESSAGES_MAP['en'];
  if (def.defaultNamespace && def.defaultKey && msgBundle?.[def.defaultNamespace]?.[def.defaultKey]) {
    return cleanHtmlTags(msgBundle[def.defaultNamespace][def.defaultKey]);
  }
  
  // Fallback to English if not present
  const enBundle = MESSAGES_MAP['en'];
  if (def.defaultNamespace && def.defaultKey && enBundle?.[def.defaultNamespace]?.[def.defaultKey]) {
    return cleanHtmlTags(enBundle[def.defaultNamespace][def.defaultKey]);
  }

  return '';
}

export default function CMSAdminPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activeLang, setActiveLang] = useState('en');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states mapping setting keys to their values/images
  const [formData, setFormData] = useState<Record<string, { value: Record<string, string>; is_active: boolean; file?: File; previewUrl?: string }>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getAdminSettings();
      const rawData = res.data;
      const dataList: SiteSetting[] = Array.isArray(rawData) ? rawData : (rawData as any)?.results || [];
      setSettings(dataList);
      
      const initialForm: Record<string, any> = {};
      
      // Initialize with backend data
      dataList.forEach(s => {
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

  const handleCopyDefault = (key: string, lang: string) => {
    const defValue = getDefaultValue(key, lang);
    handleTextChange(key, lang, defValue);
    setCopiedKey(`${key}-${lang}`);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success(`Copied current default into ${LANGUAGES.find(l => l.code === lang)?.label} editor`);
  };

  const handleResetToDefault = (key: string, lang: string) => {
    setFormData(prev => {
      const updatedValue = { ...prev[key]?.value };
      delete updatedValue[lang]; // Deleting custom key allows fallback to take over
      return {
        ...prev,
        [key]: {
          ...prev[key],
          value: updatedValue
        }
      };
    });
    toast.success(`Reset ${key} to default for ${LANGUAGES.find(l => l.code === lang)?.label}`);
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
    setSavingKey(key);
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

      const exists = settings.some(s => s.key === key);
      if (exists) {
        await updateAdminSetting(key, payload);
      } else {
        await createAdminSetting(payload);
        fetchSettings();
      }
      
      toast.success(`${key.replace('_', ' ')} saved successfully`);
    } catch (err) {
      toast.error(`Failed to save ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  if (!user || user.role !== 'super_admin') {
    return <div className="p-8 text-center text-red-500 font-semibold">Access Denied. Super Admins only.</div>;
  }

  const categories = Array.from(new Set(SETTING_KEYS.map(k => k.category)));
  const currentLangObj = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Content Management (CMS)</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Customize live texts and branding across all 5 official languages with instant live previews.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading CMS configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Sidebar Tabs */}
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">
              Sections
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex items-center justify-between p-3 text-left rounded-xl transition-all text-sm font-medium ${
                  activeTab === cat 
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span>{cat.charAt(0).toUpperCase() + cat.slice(1)} Content</span>
                {activeTab === cat && <ArrowRight className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Main Form Content Area */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Global Language Selector Bar */}
            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="w-4 h-4 text-primary" />
                <span>Editing Language:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                {LANGUAGES.map(lang => {
                  const isSelected = activeLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => setActiveLang(lang.code)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30' 
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lang.label} ({lang.code})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            {SETTING_KEYS.filter(k => k.category === activeTab).map(setting => {
              const data = formData[setting.key] || { value: {}, is_active: true };
              const customValue = data.value?.[activeLang];
              const defaultValue = getDefaultValue(setting.key, activeLang);
              const hasCustomOverride = typeof customValue === 'string' && customValue.trim().length > 0;
              const isCurrentlySaving = savingKey === setting.key;

              // Effective text being shown live on website right now
              const effectiveLiveValue = hasCustomOverride ? customValue : defaultValue;

              return (
                <div key={setting.key} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 transition-all">
                  {/* Top Bar: Title, Status, and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-foreground">{setting.label}</h3>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          hasCustomOverride 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                          {hasCustomOverride ? 'Custom Override Active' : 'Default Fallback Active'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Key: <code className="text-primary font-mono text-[11px]">{setting.key}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/50">
                        <input 
                          type="checkbox" 
                          checked={data.is_active} 
                          onChange={() => handleToggleActive(setting.key)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
                        />
                        Active
                      </label>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        disabled={isCurrentlySaving}
                        onClick={() => handleSave(setting.key, setting.category)} 
                        className="flex items-center gap-2"
                      >
                        {isCurrentlySaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 1. What is Currently Displaying (Helper & Copy Box) */}
                  {setting.type !== 'image' && (
                    <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>Currently Displayed on Website ({currentLangObj.label}):</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyDefault(setting.key, activeLang)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border border-border text-foreground hover:bg-muted font-medium transition-colors cursor-pointer text-[11px]"
                            title="Copy the default text into the editor below to use as a starting template"
                          >
                            {copiedKey === `${setting.key}-${activeLang}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-primary" /> Use as Template
                              </>
                            )}
                          </button>
                          {hasCustomOverride && (
                            <button
                              type="button"
                              onClick={() => handleResetToDefault(setting.key, activeLang)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-medium transition-colors cursor-pointer text-[11px]"
                              title="Clear custom text and revert to default translation"
                            >
                              <RotateCcw className="w-3 h-3" /> Revert to Default
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground bg-background/80 p-2.5 rounded-lg border border-border/50 italic leading-relaxed">
                        "{effectiveLiveValue || getDefaultValue(setting.key, activeLang)}"
                      </p>
                    </div>
                  )}

                  {/* 2. Editor Input Area */}
                  {setting.type === 'image' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-36 h-36 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden relative shadow-inner p-2">
                          {data.previewUrl ? (
                            <img src={data.previewUrl} alt="Preview" className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                              <ImageIcon className="w-8 h-8 opacity-60" />
                              <span className="text-[10px]">Default Logo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-semibold text-foreground">Upload Custom Brand Logo</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-xs text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                            onChange={(e) => e.target.files?.[0] && handleFileChange(setting.key, e.target.files[0])}
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Recommended: PNG or SVG with transparent background (Max 2MB).
                          </p>
                        </div>
                      </div>

                      {/* Live Image Preview Component */}
                      <div className="border border-border/80 rounded-xl p-4 bg-muted/20 space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Header & Footer Preview
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Light Background Header Preview */}
                          <div className="p-3.5 rounded-lg bg-white text-gray-900 border border-gray-200 flex items-center gap-2.5 shadow-sm">
                            <img 
                              src={data.previewUrl || '/logo.png'} 
                              alt="Logo Light" 
                              className="h-6 w-6 object-contain" 
                            />
                            <span className="font-bold text-xs tracking-tight text-gray-900">INSA Cyber Awareness</span>
                          </div>
                          {/* Dark Background Header Preview */}
                          <div className="p-3.5 rounded-lg bg-slate-900 text-white border border-slate-800 flex items-center gap-2.5 shadow-sm">
                            <img 
                              src={data.previewUrl || '/logo.png'} 
                              alt="Logo Dark" 
                              className="h-6 w-6 object-contain" 
                            />
                            <span className="font-bold text-xs tracking-tight text-white">INSA Cyber Awareness</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : setting.type === 'text' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Custom Text in {currentLangObj.label}:</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            {(data.value?.[activeLang] || '').length} characters
                          </span>
                        </label>
                        <Input
                          value={data.value?.[activeLang] || ''}
                          onChange={(e) => handleTextChange(setting.key, activeLang, e.target.value)}
                          placeholder={`Type custom ${setting.label} or click 'Use as Template' above...`}
                          className="w-full text-sm"
                        />
                      </div>

                      {/* Live Hero Title Preview */}
                      {setting.key === 'hero_title' && (
                        <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-muted/40 px-3.5 py-1.5 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Homepage Hero Preview ({currentLangObj.label})
                          </div>
                          <div className="relative bg-slate-950 p-6 text-center text-white overflow-hidden">
                            <div className="absolute inset-0 bg-primary/10 opacity-30 mix-blend-overlay"></div>
                            <span className="relative text-[10px] font-bold tracking-widest text-primary uppercase">
                              Official Government Portal
                            </span>
                            <h2 className="relative mt-2 text-xl sm:text-2xl font-black tracking-tight text-white max-w-lg mx-auto">
                              {data.value?.[activeLang] || defaultValue}
                            </h2>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Custom Text in {currentLangObj.label}:</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            {(data.value?.[activeLang] || '').length} characters
                          </span>
                        </label>
                        <textarea
                          value={data.value?.[activeLang] || ''}
                          onChange={(e) => handleTextChange(setting.key, activeLang, e.target.value)}
                          placeholder={`Type custom ${setting.label} or click 'Use as Template' above...`}
                          rows={3}
                          className="flex min-h-[90px] w-full rounded-xl border border-input bg-transparent px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      {/* Live Subtitle / Footer Preview */}
                      {setting.key === 'hero_subtitle' && (
                        <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-muted/40 px-3.5 py-1.5 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Homepage Subtitle Preview ({currentLangObj.label})
                          </div>
                          <div className="bg-slate-950 p-6 text-center text-white">
                            <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                              {data.value?.[activeLang] || defaultValue}
                            </p>
                          </div>
                        </div>
                      )}

                      {setting.key === 'footer_about' && (
                        <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-muted/40 px-3.5 py-1.5 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Footer Column Preview ({currentLangObj.label})
                          </div>
                          <div className="bg-card p-5 border-t border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <img src="/logo.png" alt="INSA" className="h-5 w-5 object-contain" />
                              <span className="font-bold text-xs text-foreground">INSA Cyber Awareness</span>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                              {data.value?.[activeLang] || defaultValue}
                            </p>
                          </div>
                        </div>
                      )}
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
