import React, { useState, useMemo } from 'react';
import { Talent } from '../types.ts';
import { ArrowRight, Search, X, MousePointerClick, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface HomeProps {
  talents: Talent[];
  onSelectTalent: (id: string) => void;
  onSeeMore: () => void;
}

type Filters = {
  gender: string[];
  ethnicity: string[];
  ageRange: string[];
};

const AGE_BUCKETS = [
  { label: 'Under 25', test: (n: number) => n < 25 },
  { label: '25 – 30',  test: (n: number) => n >= 25 && n <= 30 },
  { label: '31 – 40',  test: (n: number) => n >= 31 && n <= 40 },
  { label: '41+',      test: (n: number) => n >= 41 },
];

const parseBaseAge = (range: string): number | null => {
  const m = range.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

const emptyFilters: Filters = { gender: [], ethnicity: [], ageRange: [] };

const activeFilterCount = (f: Filters) =>
  f.gender.length + f.ethnicity.length + f.ageRange.length;

const toggleArr = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

export const Home: React.FC<HomeProps> = ({ talents, onSelectTalent }) => {
  const [query, setQuery]         = useState('');
  const [filters, setFilters]     = useState<Filters>(emptyFilters);
  const [panelOpen, setPanelOpen] = useState(false);

  // Auto-updates whenever talents change (new/edited talent picked up instantly)
  const ethnicities = useMemo(
    () => [...new Set(talents.map(t => t.ethnicity).filter(Boolean))].sort(),
    [talents]
  );

  const filtered = useMemo(() => {
    return talents.filter(t => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.personality.some(p => p.toLowerCase().includes(q)) ||
          t.bestFit.some(b => b.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.gender.length && !filters.gender.includes(t.gender)) return false;
      if (filters.ethnicity.length && !filters.ethnicity.includes(t.ethnicity)) return false;
      if (filters.ageRange.length) {
        const age = parseBaseAge(t.ageRange);
        if (age === null) return false;
        const matched = filters.ageRange.some(label => {
          const bucket = AGE_BUCKETS.find(b => b.label === label);
          return bucket?.test(age);
        });
        if (!matched) return false;
      }
      return true;
    });
  }, [talents, query, filters]);

  const count  = activeFilterCount(filters);
  const hasAny = count > 0 || query.trim().length > 0;

  const ChipBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
        active
          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );

  const activeTags = [
    ...filters.gender.map(g => ({ label: g === 'F' ? 'Female' : 'Male', clear: () => setFilters(f => ({ ...f, gender: f.gender.filter(v => v !== g) })) })),
    ...filters.ethnicity.map(e => ({ label: e, clear: () => setFilters(f => ({ ...f, ethnicity: f.ethnicity.filter(v => v !== e) })) })),
    ...filters.ageRange.map(a => ({ label: a, clear: () => setFilters(f => ({ ...f, ageRange: f.ageRange.filter(v => v !== a) })) })),
  ];

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
          AI TALENT<br />LIBRARY
        </h1>
        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl font-light">
          Build what people follow. This library contains a collection of KULT AI-generated personas that can be reused, customized, and activated across brand campaigns.
        </p>
      </section>

      {/* Steps */}
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

      {/* Talent Overview */}
      <section id="talent-overview" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-wide">Talent Overview</h2>
        </div>

        {/* Search + Filter row — filter panel is an overlay, not in flow */}
        <div className="relative flex gap-3 mb-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, code, personality, or best fit…"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setPanelOpen(o => !o)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
              panelOpen || count > 0
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <Sliders size={16} />
            <span>Filters</span>
            {count > 0 && (
              <span className="bg-cyan-400 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
            {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Overlay filter panel — floats over content, does not push page */}
          {panelOpen && (
            <>
              {/* Invisible backdrop to close on outside click */}
              <div className="fixed inset-0 z-10" onClick={() => setPanelOpen(false)} />
              <div className="absolute top-full right-0 mt-2 z-20 w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl shadow-black/60">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Gender */}
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Gender</div>
                <div className="flex flex-wrap gap-2">
                  {[{ val: 'F', label: 'Female' }, { val: 'M', label: 'Male' }].map(({ val, label }) => (
                    <ChipBtn key={val} active={filters.gender.includes(val)} onClick={() => setFilters(f => ({ ...f, gender: toggleArr(f.gender, val) }))}>
                      {label}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              {/* Ethnicity */}
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Ethnicity</div>
                <div className="flex flex-wrap gap-2">
                  {ethnicities.map(eth => (
                    <ChipBtn key={eth} active={filters.ethnicity.includes(eth)} onClick={() => setFilters(f => ({ ...f, ethnicity: toggleArr(f.ethnicity, eth) }))}>
                      {eth}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Age Range</div>
                <div className="flex flex-wrap gap-2">
                  {AGE_BUCKETS.map(b => (
                    <ChipBtn key={b.label} active={filters.ageRange.includes(b.label)} onClick={() => setFilters(f => ({ ...f, ageRange: toggleArr(f.ageRange, b.label) }))}>
                      {b.label}
                    </ChipBtn>
                  ))}
                </div>
              </div>

            </div>

            {count > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => { setFilters(emptyFilters); setPanelOpen(false); }}
                  className="text-xs text-zinc-500 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
              </div>
            </>
          )}
        </div>

        {/* Active filter tags — always visible below search row, outside overlay */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {activeTags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-400/40 rounded-full text-xs font-bold text-cyan-300">
                {tag.label}
                <button onClick={tag.clear} className="ml-1 hover:text-white transition-colors"><X size={10} /></button>
              </span>
            ))}
            <button
              onClick={() => setFilters(emptyFilters)}
              className="text-xs text-zinc-500 hover:text-white underline underline-offset-2 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-white mt-5 mb-8">
          {filtered.length} talent{filtered.length !== 1 ? 's' : ''}
          {hasAny && <span className="text-zinc-500 ml-1">found</span>}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(talent => (
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
                <h3 className="text-xl font-bold uppercase text-white group-hover:text-cyan-400 transition-colors mb-2">{talent.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                  {talent.bestFit.join(', ')}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-zinc-800/60">
                  <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{talent.ethnicity}</span>
                  <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{talent.ageRange}</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
              <p className="text-zinc-500 mb-4">No talents match your current filters.</p>
              <button
                onClick={() => { setQuery(''); setFilters(emptyFilters); }}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-bold uppercase tracking-wider transition-colors"
              >
                Clear Filters
              </button>
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
