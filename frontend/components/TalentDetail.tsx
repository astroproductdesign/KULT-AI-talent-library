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

  const hasAnyAudio = talent.voices.some(v => v.audioUrl);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'turnaround', label: 'Views & Expressions' },
    { id: 'outfits', label: 'Outfits' },
  ];

  if (hasAnyAudio) {
    tabs.push({ id: 'voices', label: 'Voice Acting' });
  }

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
      if (playingAudio !== null && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio]?.pause();
      }
      audioEl.play();
      setPlayingAudio(idx);
    }
  };

  const getMainImg = () => talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}_main/600/800`;
  const getTurnaroundImg = (idx: number) => talent.turnaroundUrls?.[idx] || `https://picsum.photos/seed/${talent.imageSeed}_turn_${idx}/400/800`;
  const getExpressionImg = (idx: number) => talent.expressionUrls?.[idx] || `https://picsum.photos/seed/${talent.imageSeed}_exp_${idx}/500/500`;

  return (
    <div className="min-h-screen bg-wf-canvas pb-24">
      <div className="max-w-[1440px] mx-auto px-8 py-10">

        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-10">
          <button onClick={onBack} className="flex items-center space-x-2 text-wf-mute hover:text-wf-ink transition-colors text-sm font-medium">
            <ArrowLeft size={18} />
            <span>Back to Library</span>
          </button>

          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 border border-wf-hairline hover:border-wf-ink text-wf-body hover:text-wf-ink px-5 py-2.5 rounded-[4px] transition-colors text-sm font-medium"
            >
              <Edit2 size={15} />
              <span>Edit Talent</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-wf-canvas border border-wf-hairline p-8 rounded-[8px] shadow-wf-2">
              <div className="mb-6">
                <span className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px]">{talent.id}</span>
                <h1 className="text-[32px] font-semibold text-wf-ink tracking-[-0.5px] mt-2 leading-[38px]">{talent.name}</h1>
              </div>

              <div
                className="aspect-[3/4] w-full mb-8 rounded-[8px] overflow-hidden bg-gray-100 cursor-zoom-in relative group/img"
                onClick={() => setModalImage({ url: getMainImg(), alt: `${talent.name} - Profile` })}
              >
                <img src={getMainImg()} alt={talent.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 size={28} className="text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-7">
                <div>
                  <div className="text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-1.5">Ethnicity</div>
                  <div className="text-wf-ink text-[15px]">{talent.ethnicity}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-1.5">Gender</div>
                  <div className="text-wf-ink text-[15px]">{talent.gender === 'M' ? 'Male' : 'Female'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-1.5">Apparent Age Range</div>
                  <div className="text-wf-ink text-[15px]">{talent.ageRange}</div>
                </div>
              </div>

              <div className="mb-7">
                <div className="text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-2">Brand Personality Fit</div>
                <div className="text-wf-ink text-[15px] leading-snug">
                  {talent.personality.join(', ')}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Best Fit For</div>
                <ul className="space-y-2.5">
                  {talent.bestFit.map((fit, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <Check size={16} className="text-wf-blue-info mt-0.5 flex-shrink-0" />
                      <span className="text-wf-ink text-[15px]">{fit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Tabs & Content */}
          <div className="lg:col-span-8">
            <div className="flex space-x-8 border-b border-wf-hairline mb-8 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-wf-ink border-b-2 border-wf-ink pb-4 -mb-[18px]'
                      : 'text-wf-mute hover:text-wf-body'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>

              {activeTab === 'turnaround' && (
                <div className="space-y-0">
                  {/* Turnaround Views */}
                  <div className="space-y-4 pb-10">
                    <h3 className="text-[18px] font-semibold text-wf-ink">Turnaround Views</h3>
                    <div
                      className="aspect-video bg-gray-100 rounded-[8px] overflow-hidden cursor-zoom-in relative group/img"
                      onClick={() => setModalImage({ url: getTurnaroundImg(0), alt: `${talent.name} - Turnaround View` })}
                    >
                      <img src={getTurnaroundImg(0)} alt="Turnaround" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={28} className="text-white" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-wf-hairline" />

                  {/* Expression Sample */}
                  <div className="space-y-4 pt-10">
                    <h3 className="text-[18px] font-semibold text-wf-ink">Expression Sample</h3>
                    <div
                      className="aspect-video bg-gray-100 rounded-[8px] overflow-hidden cursor-zoom-in relative group/img"
                      onClick={() => setModalImage({ url: getExpressionImg(0), alt: `${talent.name} - Expressions` })}
                    >
                      <img src={getExpressionImg(0)} alt="Expressions" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={28} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'outfits' && (
                <div className="space-y-4">
                  <h3 className="text-[18px] font-semibold text-wf-ink">Outfit Variations</h3>
                  {(() => {
                    const uploadedOutfits = talent.outfits.filter(o => o.imageUrl);
                    const gallery = uploadedOutfits.map(o => ({ url: o.imageUrl!, alt: o.label }));
                    return uploadedOutfits.length === 0 ? (
                      <p className="text-wf-mute italic text-sm">No data found.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {uploadedOutfits.map((outfit, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="text-[11px] font-medium text-wf-mute uppercase tracking-wider text-left">{outfit.label}</div>
                            <div
                              className="aspect-[1/2] bg-gray-100 rounded-[8px] overflow-hidden cursor-zoom-in relative group/img"
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
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 size={20} className="text-white" />
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
                <div className="space-y-4">
                  <h3 className="text-[18px] font-semibold text-wf-ink">Voice Acting</h3>
                  <div className="flex flex-wrap gap-8 pt-2">
                    {talent.voices.map((voice, idx) => (
                      <div key={idx} className="flex flex-col items-center space-y-4">
                        <div className="text-sm font-medium text-wf-mute uppercase tracking-[1.5px]">{voice.language}</div>

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
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all border ${
                            playingAudio === idx
                              ? 'bg-wf-ink border-wf-ink text-white'
                              : 'bg-wf-canvas border-wf-hairline text-wf-body hover:border-wf-ink hover:text-wf-ink'
                          }`}
                        >
                          {playingAudio === idx ? (
                            <Pause size={28} className="text-white" />
                          ) : (
                            <Play size={28} className="ml-1" />
                          )}
                        </button>
                        {!voice.audioUrl && <span className="text-xs text-wf-mute-soft">No Audio</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'usecases' && talent.useCases && (
                <div className="space-y-0">
                  {talent.useCases.map((useCase, idx) => (
                    <React.Fragment key={idx}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-10">
                        <div
                          className="aspect-video bg-gray-100 rounded-[8px] overflow-hidden cursor-zoom-in relative group/img"
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
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={28} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[18px] font-semibold text-wf-ink mb-4">{useCase.title}</h4>
                          <p className="text-wf-body leading-relaxed text-[15px] whitespace-pre-wrap">
                            {useCase.description}
                          </p>
                        </div>
                      </div>
                      {idx < (talent.useCases?.length ?? 0) - 1 && <hr className="border-wf-hairline" />}
                    </React.Fragment>
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
