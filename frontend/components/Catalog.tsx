import React, { useState, useMemo } from 'react';
import { Talent } from '../types.ts';
import { ArrowRight, Search, ArrowUpDown, ChevronUp, ChevronDown, X, ArrowLeft, Maximize2 } from 'lucide-react';
import { ImageModal } from './ImageModal.tsx';

interface CatalogProps {
  talents: Talent[];
  onSelectTalent: (id: string) => void;
  onBack: () => void;
}

type SortKey = 'id' | 'name' | 'ethnicity' | 'gender' | 'bestFit';
type SortDirection = 'asc' | 'desc';

export const Catalog: React.FC<CatalogProps> = ({ talents, onSelectTalent, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [modalImage, setModalImage] = useState<{ url: string, alt: string } | null>(null);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedTalents = useMemo(() => {
    let result = talents.filter(talent => {
      if (!searchTerm) return true;
      const lowerTerm = searchTerm.toLowerCase();
      return (
        talent.name.toLowerCase().includes(lowerTerm) ||
        talent.id.toLowerCase().includes(lowerTerm) ||
        talent.ethnicity.toLowerCase().includes(lowerTerm) ||
        talent.gender.toLowerCase() === lowerTerm ||
        talent.personality.some(p => p.toLowerCase().includes(lowerTerm)) ||
        talent.bestFit.some(b => b.toLowerCase().includes(lowerTerm))
      );
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: string = '';
        let bValue: string = '';

        if (sortConfig.key === 'bestFit') {
          aValue = a.bestFit.join(', ').toLowerCase();
          bValue = b.bestFit.join(', ').toLowerCase();
        } else {
          aValue = String(a[sortConfig.key]).toLowerCase();
          bValue = String(b[sortConfig.key]).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [talents, searchTerm, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={13} className="text-wf-mute-soft ml-1.5 inline-block" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={13} className="text-wf-ink ml-1.5 inline-block" />
      : <ChevronDown size={13} className="text-wf-ink ml-1.5 inline-block" />;
  };

  return (
    <div className="min-h-screen bg-wf-canvas pb-24">
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-wf-mute hover:text-wf-ink transition-colors mb-10 text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Catalog</p>
            <h1 className="text-[44px] font-semibold text-wf-ink tracking-[-0.5px] leading-[46px] mb-2">Full Catalog</h1>
            <p className="text-wf-body text-[15px]">Browse and search through all available AI personas.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-wf-mute" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ethnicity, vibe…"
              className="w-full bg-wf-canvas border border-wf-hairline rounded-[4px] py-3 pl-11 pr-10 text-[14px] text-wf-ink placeholder-wf-mute-soft focus:outline-none focus:border-wf-ink transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-wf-mute hover:text-wf-ink transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredAndSortedTalents.length > 0 ? (
          <div className="overflow-x-auto bg-wf-canvas border border-wf-hairline rounded-[8px] shadow-wf-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-wf-hairline bg-gray-50 text-[11px] font-medium uppercase tracking-[1.5px] text-wf-mute select-none">
                  <th className="px-6 py-4 cursor-pointer hover:text-wf-ink transition-colors" onClick={() => handleSort('id')}>
                    Talent ID <SortIcon columnKey="id" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-wf-ink transition-colors" onClick={() => handleSort('name')}>
                    Name <SortIcon columnKey="name" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-wf-ink transition-colors" onClick={() => handleSort('ethnicity')}>
                    Ethnicity <SortIcon columnKey="ethnicity" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-wf-ink transition-colors" onClick={() => handleSort('gender')}>
                    Gender <SortIcon columnKey="gender" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-wf-ink transition-colors" onClick={() => handleSort('bestFit')}>
                    Best For <SortIcon columnKey="bestFit" />
                  </th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-wf-body divide-y divide-wf-hairline">
                {filteredAndSortedTalents.map((talent) => (
                  <tr
                    key={talent.id}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => onSelectTalent(talent.id)}
                  >
                    <td className="px-6 py-5 font-mono text-[13px] text-wf-mute">{talent.id}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div
                          className="relative group/img cursor-zoom-in flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalImage({
                              url: talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`,
                              alt: talent.name
                            });
                          }}
                        >
                          <img
                            src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`}
                            alt={talent.name}
                            className="w-11 h-11 rounded-full object-cover border border-wf-hairline transition-transform group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={12} className="text-white" />
                          </div>
                        </div>
                        <span className="font-semibold text-[15px] uppercase text-wf-ink group-hover:opacity-60 transition-opacity">{talent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[14px]">{talent.ethnicity}</td>
                    <td className="px-6 py-5 text-[14px]">{talent.gender}</td>
                    <td className="px-6 py-5 text-[14px] text-wf-body-mid max-w-xs">{talent.bestFit.join(', ')}</td>
                    <td className="px-6 py-5 text-right">
                      <button className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-wf-hairline text-wf-mute group-hover:bg-wf-ink group-hover:text-white group-hover:border-wf-ink transition-all">
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 bg-wf-canvas border border-wf-hairline rounded-[8px]">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-wf-hairline mb-4">
                <Search size={22} className="text-wf-mute" />
              </div>
              <h3 className="text-[20px] font-semibold text-wf-ink mb-2">No matches found</h3>
              <p className="text-wf-body text-[15px]">Your search "{searchTerm}" did not match any AI talent.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 text-wf-ink hover:opacity-60 text-sm font-medium underline underline-offset-2 transition-opacity"
              >
                Clear Search
              </button>
            </div>

            {/* Suggestions */}
            {talents.length > 0 && (
              <div className="px-6 md:px-8">
                <h4 className="text-[11px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-6 border-b border-wf-hairline pb-3">Suggested Talents</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="text-wf-body divide-y divide-wf-hairline">
                      {talents.slice(0, 3).map((talent) => (
                        <tr
                          key={talent.id}
                          className="hover:bg-gray-50 transition-colors group cursor-pointer"
                          onClick={() => onSelectTalent(talent.id)}
                        >
                          <td className="py-4 font-mono text-[13px] text-wf-mute">{talent.id}</td>
                          <td className="py-4">
                            <div className="flex items-center space-x-4">
                              <img
                                src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`}
                                alt={talent.name}
                                className="w-10 h-10 rounded-full object-cover border border-wf-hairline"
                              />
                              <span className="font-semibold uppercase text-wf-ink group-hover:opacity-60 transition-opacity">{talent.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-[14px] text-wf-body-mid">{talent.bestFit.join(', ')}</td>
                          <td className="py-4 text-right">
                            <ArrowRight size={15} className="inline-block text-wf-mute group-hover:text-wf-ink transition-colors" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          altText={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
};
