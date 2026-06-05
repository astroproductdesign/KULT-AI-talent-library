import React, { useState, useEffect } from 'react';
import { Talent, Outfit, Voice, UseCase } from '../types.ts';
import { ArrowLeft, Save, UploadCloud, Plus, Trash2, Image as ImageIcon, Mic } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.ts';

const ETHNICITY_CODES: Record<string, string> = {
  'Malay':         'MY',
  'Chinese':       'CN',
  'Indian':        'IN',
  'Iban':          'IB',
  'Kadazan-Dusun': 'KD',
  'Others':        'OT',
};

interface TalentFormProps {
  initialData?: Talent | null;
  onSave: (talent: Talent) => void;
  onCancel: () => void;
}

const DEFAULT_OUTFITS = [
  { label: 'Base Look' },
  { label: 'Casual' },
  { label: 'Business' },
  { label: 'Formal' },
  { label: 'Festive' },
];

const defaultTalent: Talent = {
  id: '',
  name: '',
  ethnicity: '',
  gender: 'F',
  ageRange: '',
  personality: [],
  bestFit: [],
  outfits: DEFAULT_OUTFITS,
  voices: [],
  imageSeed: Math.random().toString(36).substring(7),
  useCases: [],
  turnaroundUrls: [],
  expressionUrls: []
};

type FormTab = 'basic' | 'media' | 'usecases';

export const TalentForm: React.FC<TalentFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Talent>(initialData || defaultTalent);
  const [activeTab, setActiveTab] = useState<FormTab>('basic');
  const [uploading, setUploading] = useState(false);

  // Local states for comma-separated inputs to allow spaces/commas while typing
  const [personalityStr, setPersonalityStr] = useState(formData.personality.join(', '));
  const [bestFitStr, setBestFitStr] = useState(formData.bestFit.join(', '));

  // Age range: single base age input, auto-calculates +5 range
  const parseBaseAge = (range: string) => range.match(/\d+/)?.[0] ?? '';
  const [baseAge, setBaseAge] = useState<string>(parseBaseAge(formData.ageRange));
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBaseAge(val);
    const num = parseInt(val, 10);
    setFormData(prev => ({ ...prev, ageRange: !isNaN(num) ? `${num} - ${num + 5}` : '' }));
  };

  // Auto-generate ID from ethnicity + gender + name initials (e.g. MY-F-NP)
  useEffect(() => {
    const ethCode = ETHNICITY_CODES[formData.ethnicity] || '';
    const genCode = formData.gender === 'F' ? 'F' : 'M';
    const initials = formData.name
      .trim()
      .split(/\s+/)
      .map(w => w[0]?.toUpperCase() || '')
      .join('');
    if (!ethCode || !initials) {
      setFormData(prev => ({ ...prev, id: ethCode ? `${ethCode}-${genCode}-` : '' }));
      return;
    }
    setFormData(prev => ({ ...prev, id: `${ethCode}-${genCode}-${initials}` }));
  }, [formData.ethnicity, formData.gender, formData.name]);

  // --- Basic Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'personality' | 'bestFit') => {
    const value = e.target.value;
    
    // Update the local string state immediately so the user can type freely
    if (field === 'personality') setPersonalityStr(value);
    else setBestFitStr(value);

    // Update the actual array in formData
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData(prev => ({ ...prev, [field]: arrayValue }));
  };

  // --- File Upload Handlers (Supabase Storage) ---
  const uploadToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('talent-assets')
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('talent-assets')
      .getPublicUrl(data.path);
    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToStorage(file);
      callback(url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (urls: string[]) => void) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading(true);
      const urls = await Promise.all(files.map(uploadToStorage));
      callback(urls);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload one or more images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // --- Dynamic Array Handlers ---
  const addOutfit = () => setFormData(prev => ({ ...prev, outfits: [...prev.outfits, { label: '' }] }));
  const updateOutfit = (index: number, field: keyof Outfit, value: string) => {
    const newOutfits = [...formData.outfits];
    newOutfits[index] = { ...newOutfits[index], [field]: value };
    setFormData(prev => ({ ...prev, outfits: newOutfits }));
  };
  const removeOutfit = (index: number) => setFormData(prev => ({ ...prev, outfits: prev.outfits.filter((_, i) => i !== index) }));

  const addVoice = () => setFormData(prev => ({ ...prev, voices: [...prev.voices, { language: '' }] }));
  const updateVoice = (index: number, field: keyof Voice, value: string) => {
    const newVoices = [...formData.voices];
    newVoices[index] = { ...newVoices[index], [field]: value };
    setFormData(prev => ({ ...prev, voices: newVoices }));
  };
  const removeVoice = (index: number) => setFormData(prev => ({ ...prev, voices: prev.voices.filter((_, i) => i !== index) }));

  const addUseCase = () => setFormData(prev => ({ ...prev, useCases: [...(prev.useCases || []), { title: '', description: '' }] }));
  const updateUseCase = (index: number, field: keyof UseCase, value: string) => {
    const newUseCases = [...(formData.useCases || [])];
    newUseCases[index] = { ...newUseCases[index], [field]: value };
    setFormData(prev => ({ ...prev, useCases: newUseCases }));
  };
  const removeUseCase = (index: number) => setFormData(prev => ({ ...prev, useCases: (prev.useCases || []).filter((_, i) => i !== index) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      await onSave(formData);
    } catch (err) {
      console.error('TalentForm: Save failed:', err);
      alert(`Save Failed: ${err.message || 'Unknown error'}. Check if the backend is running.`);
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all";
  const labelClass = "block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2";

  const FileUploadBtn = ({ label, accept, onChange, previewUrl, multiple = false }: { label: string, accept: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, previewUrl?: string, multiple?: boolean }) => (
    <div className="relative group">
      <div className={`border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center hover:border-cyan-400 transition-colors cursor-pointer bg-zinc-900/50 ${previewUrl ? 'overflow-hidden' : ''} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {previewUrl && !multiple ? (
          <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
        ) : null}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
          <UploadCloud size={24} className={`${uploading ? 'text-zinc-600 animate-pulse' : 'text-zinc-400 group-hover:text-cyan-400'}`} />
          <span className="text-sm font-medium text-zinc-300">{uploading ? 'Uploading...' : label}</span>
        </div>
        <input type="file" accept={accept} multiple={multiple} onChange={onChange} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={onCancel} className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-8 md:p-12 border-b border-zinc-800">
            <h1 className="text-3xl font-black tracking-tighter mb-2">
              {initialData ? 'EDIT TALENT' : 'ADD NEW TALENT'}
            </h1>
            <p className="text-zinc-400">Update the catalog entry. Changes are saved locally for this session.</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 px-8 md:px-12 bg-zinc-900/50">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'media', label: 'Media & Assets' },
              { id: 'usecases', label: 'Use Cases' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as FormTab)}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-cyan-400 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            
            {/* TAB: BASIC INFO */}
            <div className={activeTab === 'basic' ? 'block space-y-8' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Sarah Chen" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    Talent ID
                    <span className="ml-2 text-zinc-500 normal-case font-normal tracking-normal">— auto-generated from ethnicity, gender &amp; name</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    disabled
                    placeholder="Select ethnicity and gender below"
                    required
                    className={`${inputClass} opacity-60 cursor-not-allowed select-none bg-zinc-900 font-mono tracking-widest text-cyan-400`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Ethnicity</label>
                  <select required name="ethnicity" value={formData.ethnicity} onChange={handleChange} className={inputClass}>
                    <option value="" disabled>Select ethnicity</option>
                    <option value="Malay">Malay</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Indian">Indian</option>
                    <option value="Iban">Iban</option>
                    <option value="Kadazan-Dusun">Kadazan-Dusun</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="99"
                    value={baseAge}
                    onChange={handleAgeChange}
                    placeholder="e.g. 25"
                    className={inputClass}
                  />
                  {baseAge && !isNaN(Number(baseAge)) && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Age range: <span className="text-cyan-400 font-mono">{baseAge} – {Number(baseAge) + 5}</span>
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-zinc-800" />

              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Personality Traits (Comma separated)</label>
                  <input type="text" value={personalityStr} onChange={(e) => handleArrayChange(e, 'personality')} placeholder="e.g. Friendly, Professional, Gen Z" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Best Fit For (Comma separated)</label>
                  <input type="text" value={bestFitStr} onChange={(e) => handleArrayChange(e, 'bestFit')} placeholder="e.g. Beauty, Tech, Gaming" className={inputClass} />
                </div>
              </div>
            </div>

            {/* TAB: MEDIA & ASSETS */}
            <div className={activeTab === 'media' ? 'block space-y-10' : 'hidden'}>
              
              {/* Core Images */}
              <div>
                <h3 className="text-lg font-bold mb-4 border-b border-zinc-800 pb-2">Core Profile Image</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Main Card Image (3:4)</label>
                    <p className="text-xs text-zinc-500 mb-3">Used as the talent card, avatar, and all profile appearances across the site.</p>
                    <FileUploadBtn
                      label="Upload Main Image" accept="image/*"
                      previewUrl={formData.mainImageUrl}
                      onChange={(e) => handleFileUpload(e, url => setFormData(prev => ({ ...prev, mainImageUrl: url, profileImageUrl: url })))}
                    />
                  </div>
                </div>
              </div>

              {/* Galleries */}
              <div>
                <h3 className="text-lg font-bold mb-4 border-b border-zinc-800 pb-2">Galleries</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Turnaround View (16:9)</label>
                    <FileUploadBtn 
                      label="Upload Turnaround" accept="image/*" 
                      previewUrl={formData.turnaroundUrls?.[0]}
                      onChange={(e) => handleFileUpload(e, url => setFormData(prev => ({ ...prev, turnaroundUrls: [url] })))} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expression Sheet (16:9)</label>
                    <FileUploadBtn 
                      label="Upload Expressions" accept="image/*" 
                      previewUrl={formData.expressionUrls?.[0]}
                      onChange={(e) => handleFileUpload(e, url => setFormData(prev => ({ ...prev, expressionUrls: [url] })))} 
                    />
                  </div>
                </div>
              </div>

              {/* Outfits */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                  <h3 className="text-lg font-bold">Outfits</h3>
                  <button type="button" onClick={addOutfit} className="text-xs flex items-center space-x-1 text-cyan-400 hover:text-cyan-300">
                    <Plus size={14} /> <span>Add Outfit</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.outfits.map((outfit, idx) => (
                    <div key={idx} className="flex items-start space-x-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                      <div className="flex-1">
                        <input type="text" value={outfit.label} onChange={(e) => updateOutfit(idx, 'label', e.target.value)} placeholder="Outfit Name (e.g. Casual)" className={inputClass} />
                      </div>
                      <div className="w-48">
                        <FileUploadBtn 
                          label="Image" accept="image/*" previewUrl={outfit.imageUrl}
                          onChange={(e) => handleFileUpload(e, url => updateOutfit(idx, 'imageUrl', url))} 
                        />
                      </div>
                      <button type="button" onClick={() => removeOutfit(idx)} className="p-3 text-zinc-500 hover:text-red-400 transition-colors mt-1">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  {formData.outfits.length === 0 && <p className="text-sm text-zinc-500 italic">No outfits added.</p>}
                </div>
              </div>

              {/* Voices */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                  <h3 className="text-lg font-bold">Voice Acting</h3>
                  <button type="button" onClick={addVoice} className="text-xs flex items-center space-x-1 text-cyan-400 hover:text-cyan-300">
                    <Plus size={14} /> <span>Add Voice</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.voices.map((voice, idx) => (
                    <div key={idx} className="flex items-center space-x-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                      <div className="flex-1">
                        <input type="text" value={voice.language} onChange={(e) => updateVoice(idx, 'language', e.target.value)} placeholder="Language (e.g. English)" className={inputClass} />
                      </div>
                      <div className="w-48 relative">
                        <div className={`border border-zinc-700 rounded-lg p-3 text-center hover:border-cyan-400 transition-colors cursor-pointer bg-zinc-950 ${voice.audioUrl ? 'border-cyan-500/50 bg-cyan-500/10' : ''}`}>
                          <div className="flex items-center justify-center space-x-2">
                            <Mic size={16} className={voice.audioUrl ? 'text-cyan-400' : 'text-zinc-400'} />
                            <span className="text-xs font-medium text-zinc-300">{voice.audioUrl ? 'Audio Set' : 'Upload Audio'}</span>
                          </div>
                          <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, url => updateVoice(idx, 'audioUrl', url))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeVoice(idx)} className="p-3 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  {formData.voices.length === 0 && <p className="text-sm text-zinc-500 italic">No voices added.</p>}
                </div>
              </div>

              {/* Fallback Seed */}
              <div className="pt-6 border-t border-zinc-800">
                <label className={labelClass}>Fallback Image Seed</label>
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ImageIcon size={18} className="text-zinc-500" />
                    </div>
                    <input required type="text" name="imageSeed" value={formData.imageSeed} onChange={handleChange} placeholder="Unique word for fallback generation" className={`${inputClass} pl-12`} />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Used to generate placeholder images if custom media is not uploaded.</p>
              </div>
            </div>

            {/* TAB: USE CASES */}
            <div className={activeTab === 'usecases' ? 'block space-y-6' : 'hidden'}>
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                <h3 className="text-lg font-bold">Campaign Use Cases</h3>
                <button type="button" onClick={addUseCase} className="text-xs flex items-center space-x-1 text-cyan-400 hover:text-cyan-300">
                  <Plus size={14} /> <span>Add Use Case</span>
                </button>
              </div>
              
              <div className="space-y-8">
                {(formData.useCases || []).map((useCase, idx) => (
                  <div key={idx} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative">
                    <button type="button" onClick={() => removeUseCase(idx)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className={labelClass}>Title</label>
                          <input type="text" value={useCase.title} onChange={(e) => updateUseCase(idx, 'title', e.target.value)} placeholder="e.g. Social Media Campaign" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Description</label>
                          <textarea value={useCase.description} onChange={(e) => updateUseCase(idx, 'description', e.target.value)} placeholder="Describe how the talent is used..." rows={4} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Preview Image (16:9)</label>
                        <div className="h-full min-h-[150px]">
                          <FileUploadBtn 
                            label="Upload Image" accept="image/*" previewUrl={useCase.imageUrl}
                            onChange={(e) => handleFileUpload(e, url => updateUseCase(idx, 'imageUrl', url))} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!formData.useCases || formData.useCases.length === 0) && <p className="text-sm text-zinc-500 italic">No use cases added.</p>}
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-10 mt-10 border-t border-zinc-800 flex items-center justify-end space-x-4">
              <button type="button" onClick={onCancel} className="px-6 py-3 rounded-full font-bold text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20">
                <Save size={20} />
                <span>Save Talent</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
