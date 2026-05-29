import React, { useState } from 'react';
import { Talent } from '../types.ts';
import { ArrowRight, Search, X, MousePointerClick, Sliders } from 'lucide-react';

interface HomeProps {
  talents: Talent[];
  onSelectTalent: (id: string) => void;
  onSeeMore: () => void;
}

export const Home: React.FC<HomeProps> = ({ talents, onSelectTalent }) => {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? talents.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.personality.some((p) => p.toLowerCase().includes(q)) ||
          t.bestFit.some((b) => b.toLowerCase().includes(q))
        );
      })
    : talents;

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
          AI TALENT<br />LIBRARY
        </h1>
        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl font-light">
          Build what people follow. This library contains a collection of KULT AI-generated personas that can be reused, customized, and activated across brand campaigns.
        </p>
      </section>

      {/* Steps Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Search size={24} className="text-white mb-4" />
            <h3 className="text-2xl font-bold mb-4">BROWSE</h3>
            <p className="text-zinc-400">View available AI talents by ethnicity, gender, style, and campaign fit.</p>
          </div>
          <div>
            <MousePointerClick size={24} className="text-white mb-4" />
            <h3 className="text-2xl font-bold mb-4">SELECT</h3>
            <p className="text-zinc-400">Choose the talent that best matches your brand or campaign.</p>
          </div>
          <div>
            <Sliders size={24} className="text-white mb-4" />
            <h3 className="text-2xl font-bold mb-4">CUSTOMISE</h3>
            <p className="text-zinc-400">We adapt the selected talent into your product, scene, outfit, video, or campaign format.</p>
          </div>
        </div>
      </section>

      {/* Talent Overview Grid Section */}
      <section id="talent-overview" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-wide">Talent Overview</h2>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, personality, or best fit…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-sm text-white mb-8">
          {filtered.length} talent{filtered.length !== 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((talent) => (
            <div
              key={talent.id}
              onClick={() => onSelectTalent(talent.id)}
              className="group cursor-pointer bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-400 transition-colors flex flex-col"
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-800 relative">
                <img
                  src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}_main/400/600`}
                  alt={talent.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-cyan-400 font-bold flex items-center space-x-2">
                    <span>View Profile</span>
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-mono text-zinc-500 mb-2">{talent.id}</div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">{talent.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2 mt-auto">
                  {talent.bestFit.join(', ')}
                </p>
              </div>
            </div>
          ))}

          {filtered.length === 0 && query && (
            <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              No talents match "<span className="text-zinc-300">{query}</span>".
            </div>
          )}

          {talents.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              No talents available in the catalog.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
