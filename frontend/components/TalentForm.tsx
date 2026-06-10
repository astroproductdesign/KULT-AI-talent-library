import React, { useState, useEffect } from 'react';
import { Talent, Outfit, Voice, UseCase } from '../types.ts';
import { ArrowLeft, Save, UploadCloud, Plus, Trash2, Image as ImageIcon, Mic, ChevronDown } from 'lucide-react';
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

  const [personalityStr, setPersonalityStr] = useState(formData.personality.join(', '));
  const [bestFitStr, setBestFitStr] = useState(formData.bestFit.join(', '));

  const parseBaseAge = (range: string) => range.match(/\d+/)?.[0] ?? '';
  const [baseAge, setBaseAge] = useState<string>(parseBaseAge(formData.ageRange));
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBaseAge(val);
    const num = parseInt(val, 10);
    setFormData(prev => ({ ...prev, ageRange: !isNaN(num) ? `${num} - ${num + 5}` : '' }));
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'personality' | 'bestFit') => {
    const value = e.target.value;
    if (field === 'personality') setPersonalityStr(value);
    else setBestFitStr(value);
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData(prev => ({ ...prev, [field]: arrayValue }));
  };

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

  const inputClass = "w-full bg-wf-canvas border border-wf-hairline rounded-[4px] px-4 py-3 text-wf-ink text-[15px] placeholder-wf-mute-soft focus:outline-none focus:border-wf-ink transition-colors";
  const selectClass = `${inputClass} appearance-none pr-10 cursor-pointer`;
  const labelClass = "block text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-2";

  const FileUploadBtn = ({ label, accept, onChange, previewUrl, multiple = false }: { label: string, accept: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, previewUrl?: string, multiple?: boolean }) => (
    <div className="relative group">
      <div className={`border border-dashed border-wf-hairline rounded-[8px] p-4 text-center hover:border-wf-ink transition-colors cursor-pointer bg-wf-canvas ${previewUrl ? 'overflow-hidden' : ''} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {previewUrl && !multiple ? (
          <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
        ) : null}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
          <UploadCloud size={22} className={`${uploading ? 'text-wf-mute-soft animate-pulse' : 'text-wf-mute group-hover:text-wf-ink'} transition-colors`} />
          <span className="text-[13px] font-medium text-wf-body">{uploading ? 'Uploading…' : label}</span>
        </div>
        <input type="file" accept={accept} multiple={multiple} onChange={onChange} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-wf-canvas pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <button onClick={onCancel} className="flex items-center space-x-2 text-wf-mute hover:text-wf-ink transition-colors mb-10 text-sm font-medium">
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-wf-canvas border border-wf-hairline rounded-[8px] overflow-hidden shadow-wf-2">
          <div className="px-6 md:px-10 py-6 md:py-8 border-b border-wf-hairline">
            <p className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">
              {initialData ? 'Edit' : 'Add'}
            </p>
            <h1 className="text-[32px] font-semibold text-wf-ink tracking-[-0.5px] mb-2">
              {initialData ? 'Edit Talent' : 'Add New Talent'}
            </h1>
            <p className="text-wf-body text-[15px]">Update the catalog entry. Changes are saved to the database.</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-wf-hairline px-6">
            <div className="flex overflow-x-auto space-x-8 pt-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'media', label: 'Media & Assets' },
                { id: 'usecases', label: 'Use Cases' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FormTab)}
                  className={`flex-shrink-0 whitespace-nowrap text-sm font-medium pb-4 mb-[-1px] transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-wf-ink border-wf-ink'
                      : 'text-wf-mute border-transparent hover:text-wf-body'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-10">

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
                    <span className="ml-2 text-wf-mute-soft normal-case font-normal tracking-normal text-[11px]">— auto-generated</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    disabled
                    placeholder="Select ethnicity and gender below"
                    required
                    className={`${inputClass} opacity-50 cursor-not-allowed select-none font-mono tracking-widest`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Ethnicity</label>
                  <div className="relative">
                    <select required name="ethnicity" value={formData.ethnicity} onChange={handleChange} className={selectClass}>
                      <option value="" disabled>Select ethnicity</option>
                      <option value="Malay">Malay</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Indian">Indian</option>
                      <option value="Iban">Iban</option>
                      <option value="Kadazan-Dusun">Kadazan-Dusun</option>
                      <option value="Others">Others</option>
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-wf-mute" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <div className="relative">
                    <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-wf-mute" />
                  </div>
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
                    <p className="text-[12px] text-wf-mute mt-2">
                      Age range: <span className="text-wf-ink font-medium font-mono">{baseAge} – {Number(baseAge) + 5}</span>
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-wf-hairline" />

              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Personality Traits <span className="normal-case font-normal tracking-normal text-wf-mute-soft">(comma separated)</span></label>
                  <input type="text" value={personalityStr} onChange={(e) => handleArrayChange(e, 'personality')} placeholder="e.g. Friendly, Professional, Gen Z" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Best Fit For <span className="normal-case font-normal tracking-normal text-wf-mute-soft">(comma separated)</span></label>
                  <input type="text" value={bestFitStr} onChange={(e) => handleArrayChange(e, 'bestFit')} placeholder="e.g. Beauty, Tech, Gaming" className={inputClass} />
                </div>
              </div>
            </div>

            {/* TAB: MEDIA & ASSETS */}
            <div className={activeTab === 'media' ? 'block space-y-10' : 'hidden'}>

              {/* Core Images */}
              <div>
                <h3 className="text-[18px] font-semibold text-wf-ink mb-1">Core Profile Image</h3>
                <div className="h-px bg-wf-hairline mb-5 mt-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Main Card Image (3:4)</label>
                    <p className="text-[13px] text-wf-mute mb-3">Used as the talent card, avatar, and all profile appearances across the site.</p>
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
                <h3 className="text-[18px] font-semibold text-wf-ink mb-1">Galleries</h3>
                <div className="h-px bg-wf-hairline mb-5 mt-3" />
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
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[18px] font-semibold text-wf-ink">Outfits</h3>
                  <button type="button" onClick={addOutfit} className="flex items-center space-x-1.5 text-[13px] font-medium text-wf-body hover:text-wf-ink transition-colors border border-wf-hairline rounded-[4px] px-3 py-1.5 hover:border-wf-ink">
                    <Plus size={13} /> <span>Add Outfit</span>
                  </button>
                </div>
                <div className="h-px bg-wf-hairline mb-5 mt-3" />
                <div className="space-y-4">
                  {formData.outfits.map((outfit, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 gap-3 sm:gap-0 bg-gray-50 p-4 rounded-[8px] border border-wf-hairline">
                      {/* Text field — full width on mobile, flex-1 on desktop */}
                      <div className="w-full sm:flex-1">
                        <input type="text" value={outfit.label} onChange={(e) => updateOutfit(idx, 'label', e.target.value)} placeholder="Outfit Name (e.g. Casual)" className={inputClass} />
                      </div>
                      {/* Upload + delete — side by side on mobile */}
                      <div className="flex items-start gap-3 sm:gap-0 sm:space-x-4">
                        <div className="flex-1 sm:flex-none sm:w-48">
                          <FileUploadBtn
                            label="Image" accept="image/*" previewUrl={outfit.imageUrl}
                            onChange={(e) => handleFileUpload(e, url => updateOutfit(idx, 'imageUrl', url))}
                          />
                        </div>
                        <button type="button" onClick={() => removeOutfit(idx)} className="p-2.5 text-wf-mute hover:text-wf-red hover:bg-red-50 rounded-[4px] transition-colors sm:mt-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.outfits.length === 0 && <p className="text-[14px] text-wf-mute italic">No outfits added.</p>}
                </div>
              </div>

              {/* Voices */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[18px] font-semibold text-wf-ink">Voice Acting</h3>
                  <button type="button" onClick={addVoice} className="flex items-center space-x-1.5 text-[13px] font-medium text-wf-body hover:text-wf-ink transition-colors border border-wf-hairline rounded-[4px] px-3 py-1.5 hover:border-wf-ink">
                    <Plus size={13} /> <span>Add Voice</span>
                  </button>
                </div>
                <div className="h-px bg-wf-hairline mb-5 mt-3" />
                <div className="space-y-4">
                  {formData.voices.map((voice, idx) => (
                    <div key={idx} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-[8px] border border-wf-hairline">
                      <div className="flex-1">
                        <input type="text" value={voice.language} onChange={(e) => updateVoice(idx, 'language', e.target.value)} placeholder="Language (e.g. English)" className={inputClass} />
                      </div>
                      <div className="w-48 relative">
                        <div className={`border border-wf-hairline rounded-[4px] p-3 text-center hover:border-wf-ink transition-colors cursor-pointer bg-wf-canvas ${voice.audioUrl ? 'border-wf-ink bg-wf-ink/5' : ''}`}>
                          <div className="flex items-center justify-center space-x-2">
                            <Mic size={15} className={voice.audioUrl ? 'text-wf-ink' : 'text-wf-mute'} />
                            <span className="text-[13px] font-medium text-wf-body">{voice.audioUrl ? 'Audio Set' : 'Upload Audio'}</span>
                          </div>
                          <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, url => updateVoice(idx, 'audioUrl', url))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeVoice(idx)} className="p-2.5 text-wf-mute hover:text-wf-red hover:bg-red-50 rounded-[4px] transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.voices.length === 0 && <p className="text-[14px] text-wf-mute italic">No voices added.</p>}
                </div>
              </div>

              {/* Fallback Seed */}
              <div className="pt-6 border-t border-wf-hairline">
                <label className={labelClass}>Fallback Image Seed</label>
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ImageIcon size={16} className="text-wf-mute" />
                    </div>
                    <input required type="text" name="imageSeed" value={formData.imageSeed} onChange={handleChange} placeholder="Unique word for fallback generation" className={`${inputClass} pl-11`} />
                  </div>
                </div>
                <p className="text-[12px] text-wf-mute mt-2">Used to generate placeholder images if custom media is not uploaded.</p>
              </div>
            </div>

            {/* TAB: USE CASES */}
            <div className={activeTab === 'usecases' ? 'block space-y-6' : 'hidden'}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[18px] font-semibold text-wf-ink">Campaign Use Cases</h3>
                <button type="button" onClick={addUseCase} className="flex items-center space-x-1.5 text-[13px] font-medium text-wf-body hover:text-wf-ink transition-colors border border-wf-hairline rounded-[4px] px-3 py-1.5 hover:border-wf-ink">
                  <Plus size={13} /> <span>Add Use Case</span>
                </button>
              </div>
              <div className="h-px bg-wf-hairline mb-5" />

              <div className="space-y-8">
                {(formData.useCases || []).map((useCase, idx) => (
                  <div key={idx} className="bg-gray-50 p-6 rounded-[8px] border border-wf-hairline relative">
                    <button type="button" onClick={() => removeUseCase(idx)} className="absolute top-4 right-4 p-2 text-wf-mute hover:text-wf-red hover:bg-red-50 rounded-[4px] transition-colors">
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className={labelClass}>Title</label>
                          <input type="text" value={useCase.title} onChange={(e) => updateUseCase(idx, 'title', e.target.value)} placeholder="e.g. Social Media Campaign" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Description</label>
                          <textarea value={useCase.description} onChange={(e) => updateUseCase(idx, 'description', e.target.value)} placeholder="Describe how the talent is used…" rows={4} className={inputClass} />
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
                {(!formData.useCases || formData.useCases.length === 0) && <p className="text-[14px] text-wf-mute italic">No use cases added.</p>}
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-10 mt-10 border-t border-wf-hairline flex items-center justify-end space-x-3">
              <button type="button" onClick={onCancel} className="px-6 py-3 border border-wf-hairline rounded-[4px] text-sm font-medium text-wf-body hover:border-wf-ink hover:text-wf-ink transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={uploading} className="flex items-center space-x-2 bg-wf-ink text-white px-8 py-3 rounded-[4px] text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                <Save size={17} />
                <span>Save Talent</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
