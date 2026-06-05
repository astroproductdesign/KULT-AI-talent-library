import React, { useState, useRef } from 'react';
import { Talent } from '../types.ts';
import { ArrowLeft, Check, Play, Pause, Edit2, Maximize2 } from 'lucide-react';
import { ImageModal } from './ImageModal.tsx';

interface TalentDetailProps {
  talent: Talent;
  onBack: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
}

type Tab = 'turnaround' | 'outfits' | 'voices' | 'usecases';

export const TalentDetail: React.FC<TalentDetailProps> = ({ talent, onBack, isAdmin, onEdit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('turnaround');
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string; images?: Array<{ url: string; alt: string }>; initialIndex?: number } | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});

  const tabs: { id: Tab; label: string }[] = [
    { id: 'turnaround', label: 'Views & Expressions' },
    { id: 'outfits', label: 'Outfits' },
    { id: 'voices', label: 'Voice Acting' },
  ];

  if (talent.useCases && talent.useCases.length > 0) {
    tabs.push({ id: 'usecases', label: 'Use Cases' });
  }

  const toggleAudio = (idx: number) => {
    const audioEl = audioRefs.current[idx];
    if (!audioEl) return;

    if (playingAudio === idx) {
      audioEl.pause();
      setPlayingAudio(null);
    } else {
      // Pause currently playing
      if (playingAudio !== null && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio]?.pause();
      }
      audioEl.play();
      setPlayingAudio(idx);
    }
  };

  // Helper to get image URL (custom or fallback)
  const getMainImg = () => talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}_main/600/800`;
  const getTurnaroundImg = (idx: number) => talent.turnaroundUrls?.[idx] || `https://picsum.photos/seed/${talent.imageSeed}_turn_${idx}/400/800`;
  const getExpressionImg = (idx: number) => talent.expressionUrls?.[idx] || `https://picsum.photos/seed/${talent.imageSeed}_exp_${idx}/500/500`;

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Library</span>
          </button>

          {isAdmin && onEdit && (
            <button 
              onClick={onEdit}
              className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-full transition-colors text-sm font-bold border border-zinc-700 hover:border-cyan-400"
            >
              <Edit2 size={16} className="text-cyan-400" />
              <span>Edit Talent</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative group">
              <div className="mb-6">
                <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">{talent.id}</span>
                <h1 className="text-4xl font-black uppercase mt-2">{talent.name}</h1>
              </div>

              <div 
                className="aspect-[3/4] w-full mb-8 rounded-xl overflow-hidden bg-zinc-800 cursor-zoom-in relative group/img"
                onClick={() => setModalImage({ url: getMainImg(), alt: `${talent.name} - Profile` })}
              >
                <img src={getMainImg()} alt={talent.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 size={32} className="text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Age Range</div>
                  <div className="font-medium text-base">{talent.ageRange}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Gender</div>
                  <div className="font-medium text-base">{talent.gender === 'M' ? 'Male' : 'Female'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Ethnicity</div>
                  <div className="font-medium text-base">{talent.ethnicity}</div>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Brand Personality Fit</div>
                <div className="font-medium text-base leading-snug">
                  {talent.personality.join(', ')}
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Best Fit For</div>
                <ul className="space-y-3">
                  {talent.bestFit.map((fit, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <Check size={18} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="font-medium text-base">{fit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Tabs & Content */}
          <div className="lg:col-span-8">
            <div className="flex space-x-8 border-b border-zinc-800 mb-8 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab.id ? 'text-white border-b-2 border-cyan-400 pb-4 -mb-[18px]' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8">
              
              {activeTab === 'turnaround' && (
                <div className="space-y-10">
                  {/* Turnaround Views */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold uppercase tracking-wide">Turnaround Views</h3>
                    <div
                      className="aspect-video bg-zinc-800 rounded-xl overflow-hidden cursor-zoom-in relative group/img"
                      onClick={() => setModalImage({ url: getTurnaroundImg(0), alt: `${talent.name} - Turnaround View` })}
                    >
                      <img src={getTurnaroundImg(0)} alt="Turnaround" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={32} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Expression Sample */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold uppercase tracking-wide">Expression Sample</h3>
                    <div
                      className="aspect-video bg-zinc-800 rounded-xl overflow-hidden cursor-zoom-in relative group/img"
                      onClick={() => setModalImage({ url: getExpressionImg(0), alt: `${talent.name} - Expressions` })}
                    >
                      <img src={getExpressionImg(0)} alt="Expressions" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={32} className="text-white" />
                      </div>
                      <div className="absolute bottom-4 left-4 text-xs bg-black/50 px-3 py-1.5 rounded-full text-white font-bold uppercase tracking-wider">Expression Sheet</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'outfits' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-6">Outfit Variations</h3>
                  {(() => {
                    const uploadedOutfits = talent.outfits.filter(o => o.imageUrl);
                    const gallery = uploadedOutfits.map(o => ({ url: o.imageUrl!, alt: o.label }));
                    return uploadedOutfits.length === 0 ? (
                      <p className="text-zinc-500 italic text-sm">No data found.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {uploadedOutfits.map((outfit, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">{outfit.label}</div>
                            <div
                              className="aspect-[1/2] bg-zinc-800 rounded-lg overflow-hidden cursor-zoom-in relative group/img"
                              onClick={() => setModalImage({
                                url: outfit.imageUrl!,
                                alt: outfit.label,
                                images: gallery,
                                initialIndex: idx,
                              })}
                            >
                              <img
                                src={outfit.imageUrl}
                                alt={outfit.label}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 size={24} className="text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'voices' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-6">Voice Acting</h3>
                  <div className="flex flex-wrap gap-8">
                    {talent.voices.map((voice, idx) => (
                      <div key={idx} className="flex flex-col items-center space-y-4">
                        <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{voice.language}</div>
                        
                        {voice.audioUrl && (
                          <audio 
                            ref={el => audioRefs.current[idx] = el} 
                            src={voice.audioUrl} 
                            onEnded={() => setPlayingAudio(null)}
                            className="hidden"
                          />
                        )}

                        <button 
                          onClick={() => voice.audioUrl ? toggleAudio(idx) : alert('No audio file uploaded for this voice.')}
                          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all group border ${
                            playingAudio === idx 
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]' 
                              : 'bg-zinc-800 border-zinc-700 hover:border-cyan-400 hover:bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {playingAudio === idx ? (
                            <Pause size={32} className="text-cyan-400" />
                          ) : (
                            <Play size={32} className="group-hover:text-cyan-400 transition-colors ml-2" />
                          )}
                        </button>
                        {!voice.audioUrl && <span className="text-xs text-zinc-600">No Audio</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'usecases' && talent.useCases && (
                <div className="space-y-12">
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-6">Use Cases</h3>
                  {talent.useCases.map((useCase, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-zinc-800/50 pb-12 last:border-0 last:pb-0">
                      <div 
                        className="aspect-video bg-zinc-800 rounded-xl overflow-hidden cursor-zoom-in relative group/img"
                        onClick={() => setModalImage({ 
                          url: useCase.imageUrl || `https://picsum.photos/seed/${talent.imageSeed}_usecase_${idx}/800/450`, 
                          alt: useCase.title 
                        })}
                      >
                         <img 
                            src={useCase.imageUrl || `https://picsum.photos/seed/${talent.imageSeed}_usecase_${idx}/800/450`} 
                            alt={useCase.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={32} className="text-white" />
                          </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-4 text-white">{useCase.title}</h4>
                        <p className="text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          altText={modalImage.alt}
          onClose={() => setModalImage(null)}
          images={modalImage.images}
          initialIndex={modalImage.initialIndex}
        />
      )}
    </div>
  );
};
