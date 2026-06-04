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
    // 1. Filter
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

    // 2. Sort
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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="text-zinc-600 ml-2 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-cyan-400 ml-2 inline-block" />
      : <ChevronDown size={14} className="text-cyan-400 ml-2 inline-block" />;
  };

  const renderTalentRow = (talent: Talent) => (
    <tr 
      key={talent.id} 
      className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group cursor-pointer"
      onClick={() => onSelectTalent(talent.id)}
    >
      <td className="py-6 font-mono text-sm">{talent.id}</td>
      <td className="py-6">
        <div className="flex items-center space-x-4">
          <img 
            src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`} 
            alt={talent.name} 
            className="w-12 h-12 rounded-full object-cover border border-zinc-700"
          />
          <span className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">{talent.name}</span>
        </div>
      </td>
      <td className="py-6">{talent.ethnicity}</td>
      <td className="py-6">{talent.gender}</td>
      <td className="py-6 text-sm text-zinc-400 max-w-xs">{talent.bestFit.join(', ')}</td>
      <td className="py-6 text-right">
        <button className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-white group-hover:text-black transition-all">
          <ArrowRight size={18} />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      <section className="max-w-7xl mx-auto px-6 py-8">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">FULL CATALOG</h1>
            <p className="text-zinc-400">Browse and search through all available AI personas.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-zinc-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ethnicity, vibe..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-12 pr-10 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        {filteredAndSortedTalents.length > 0 ? (
          <div className="overflow-x-auto bg-zinc-900/30 border border-zinc-800 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-sm uppercase tracking-wider text-zinc-500 select-none">
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('id')}>
                    Talent ID <SortIcon columnKey="id" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    Name <SortIcon columnKey="name" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ethnicity')}>
                    Ethnicity <SortIcon columnKey="ethnicity" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('gender')}>
                    Gender <SortIcon columnKey="gender" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('bestFit')}>
                    Best For <SortIcon columnKey="bestFit" />
                  </th>
                  <th className="p-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300 divide-y divide-zinc-800/50">
                {filteredAndSortedTalents.map((talent) => (
                  <tr 
                    key={talent.id} 
                    className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectTalent(talent.id)}
                  >
                    <td className="p-6 font-mono text-sm">{talent.id}</td>
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="relative group/img cursor-zoom-in"
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
                            className="w-12 h-12 rounded-full object-cover border border-zinc-700 transition-transform group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 size={14} className="text-white" />
                          </div>
                        </div>
                        <span className="font-bold text-lg uppercase text-white group-hover:text-cyan-400 transition-colors">{talent.name}</span>
                      </div>
                    </td>
                    <td className="p-6">{talent.ethnicity}</td>
                    <td className="p-6">{talent.gender}</td>
                    <td className="p-6 text-sm text-zinc-400 max-w-xs">{talent.bestFit.join(', ')}</td>
                    <td className="p-6 text-right">
                      <button className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-white group-hover:text-black transition-all">
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
                <Search size={24} className="text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
              <p className="text-zinc-400">Your search "{searchTerm}" did not match any AI talent.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-6 text-cyan-400 hover:text-cyan-300 text-sm font-bold uppercase tracking-wider transition-colors"
              >
                Clear Search
              </button>
            </div>

            {/* Suggestions */}
            {talents.length > 0 && (
              <div className="px-8">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-6 border-b border-zinc-800 pb-2">Suggested Talents</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="text-zinc-300 divide-y divide-zinc-800/50">
                      {talents.slice(0, 3).map((talent) => (
                        <tr 
                          key={talent.id} 
                          className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                          onClick={() => onSelectTalent(talent.id)}
                        >
                          <td className="py-4 font-mono text-sm">{talent.id}</td>
                          <td className="py-4">
                            <div className="flex items-center space-x-4">
                              <img 
                                src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`} 
                                alt={talent.name} 
                                className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                              />
                              <span className="font-bold uppercase text-white group-hover:text-cyan-400 transition-colors">{talent.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-zinc-400">{talent.bestFit.join(', ')}</td>
                          <td className="py-4 text-right">
                            <ArrowRight size={16} className="inline-block text-zinc-500 group-hover:text-white transition-colors" />
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
