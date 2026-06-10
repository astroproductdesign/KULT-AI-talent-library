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

  // Predefined ethnicity display order
  const ETHNICITY_ORDER = ['Malay', 'Chinese', 'Indian', 'Kadazan-Dusun', 'Iban'];

  // Auto-updates whenever talents change; sorted by predefined order, extras appended
  const ethnicities = useMemo(() => {
    const unique = [...new Set(talents.map(t => t.ethnicity).filter(Boolean))];
    return unique.sort((a, b) => {
      const ai = ETHNICITY_ORDER.indexOf(a);
      const bi = ETHNICITY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [talents]);

  const filtered = useMemo(() => {
    return talents.filter(t => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.ethnicity.toLowerCase().includes(q) ||
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
      className={`px-3 py-1 rounded-[4px] text-[12px] font-medium border transition-all ${
        active
          ? 'bg-wf-blue-info border-wf-blue-info text-white'
          : 'bg-wf-canvas border-wf-blue-info/30 text-wf-blue-info hover:bg-wf-blue-info/5'
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
    <div className="min-h-screen bg-wf-canvas pb-24">
      {/* Hero */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:pt-16 text-center flex flex-col items-center">
        <h1 className="text-[clamp(40px,8vw,80px)] font-semibold text-wf-ink tracking-[-0.8px] leading-[1.04] mb-8 w-full">
          KULT AI Talent Library
        </h1>
        <p className="text-[18px] text-wf-body max-w-2xl leading-[29px] mb-8">
          Collection of KULT AI-generated personas that can be reused, customized, and activated across brand campaigns.
        </p>
        <button
          onClick={() => document.getElementById('talent-overview')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-wf-ink text-white px-6 py-3 rounded-[4px] text-[16px] font-medium hover:opacity-80 transition-opacity"
        >
          Explore AI Talents
        </button>
      </section>

      {/* Steps */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <p className="text-[15px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-10">How it works</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Search size={22} />, title: 'Browse', desc: 'View available AI talents by ethnicity, gender, style, and campaign fit.' },
            { icon: <MousePointerClick size={22} />, title: 'Select', desc: 'Choose the talent that best matches your brand or campaign.' },
            { icon: <Sliders size={22} />, title: 'Customise', desc: 'We adapt the selected talent into your product, scene, outfit, video, or campaign format.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-wf-canvas border border-wf-hairline rounded-[8px] p-6 md:p-8">
              <div className="text-wf-ink mb-5">{icon}</div>
              <h3 className="text-[20px] font-semibold text-wf-ink mb-3">{title}</h3>
              <p className="text-wf-body text-[15px] leading-[24px]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Talent Overview */}
      <section id="talent-overview" className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 scroll-mt-24">
        <div className="mb-10">
          <p className="text-[15px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Catalog</p>
          <h2 className="text-[44px] font-semibold text-wf-ink tracking-[-0.5px] leading-[46px]">Talent Overview</h2>
        </div>

        {/* Search + Filter row */}
        <div className="relative flex flex-col md:flex-row gap-3 mb-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-wf-mute pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, code, personality, or best fit…"
              className="w-full bg-wf-canvas border border-wf-hairline rounded-[4px] pl-10 pr-10 py-3 text-[15px] text-wf-ink placeholder-wf-mute-soft focus:outline-none focus:border-wf-ink transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-wf-mute hover:text-wf-ink transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setPanelOpen(o => !o)}
            className={`flex items-center gap-2 px-5 py-3 rounded-[4px] border text-sm font-medium transition-all ${
              panelOpen || count > 0
                ? 'bg-wf-ink border-wf-ink text-white'
                : 'bg-wf-canvas border-wf-hairline text-wf-body hover:border-wf-ink hover:text-wf-ink'
            }`}
          >
            <Sliders size={15} />
            <span>Filters</span>
            {count > 0 && (
              <span className="bg-white text-wf-ink text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
            {panelOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Overlay filter panel */}
          {panelOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPanelOpen(false)} />
              <div className="absolute top-full right-0 mt-2 z-20 w-full bg-wf-canvas border border-wf-hairline rounded-[8px] p-6 shadow-wf-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {/* Gender */}
                  <div>
                    <div className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Gender</div>
                    <div className="flex flex-wrap gap-2">
                      {[{ val: 'M', label: 'Male' }, { val: 'F', label: 'Female' }].map(({ val, label }) => (
                        <ChipBtn key={val} active={filters.gender.includes(val)} onClick={() => setFilters(f => ({ ...f, gender: toggleArr(f.gender, val) }))}>
                          {label}
                        </ChipBtn>
                      ))}
                    </div>
                  </div>

                  {/* Ethnicity */}
                  <div>
                    <div className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Ethnicity</div>
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
                    <div className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Age Range</div>
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
                  <div className="mt-5 pt-4 border-t border-wf-hairline flex justify-end">
                    <button
                      onClick={() => { setFilters(emptyFilters); setPanelOpen(false); }}
                      className="text-xs text-wf-mute hover:text-wf-ink underline underline-offset-2 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Active filter tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {activeTags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-wf-blue-info border border-wf-blue-info rounded-[4px] text-[12px] font-medium text-white">
                {tag.label}
                <button onClick={tag.clear} className="ml-1 hover:opacity-60 transition-opacity"><X size={10} /></button>
              </span>
            ))}
            <button
              onClick={() => setFilters(emptyFilters)}
              className="text-xs text-wf-mute hover:text-wf-ink underline underline-offset-2 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-wf-body mt-5 mb-8">
          {filtered.length} talent{filtered.length !== 1 ? 's' : ''}
          {hasAny && <span className="text-wf-mute ml-1">found</span>}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map(talent => (
            <div
              key={talent.id}
              onClick={() => onSelectTalent(talent.id)}
              className="group cursor-pointer bg-wf-canvas border border-wf-hairline rounded-[8px] overflow-hidden hover:shadow-wf-2 transition-shadow flex flex-col"
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 relative">
                <img
                  src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}_main/400/600`}
                  alt={talent.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-5">
                  <span className="text-white font-medium flex items-center space-x-1.5 text-xs sm:text-sm">
                    <span>View Profile</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-5 flex-1 flex flex-col">
                <div className="text-[10px] sm:text-[11px] font-medium text-wf-mute mb-1 sm:mb-1.5 tracking-wide">{talent.id}</div>
                <h3 className="text-[13px] sm:text-[16px] font-semibold text-wf-ink mb-1 sm:mb-2 leading-tight">{talent.name}</h3>
                <p className="text-[12px] sm:text-sm text-wf-body-mid line-clamp-2 mb-2 sm:mb-3 leading-snug sm:leading-[22px]">
                  {talent.bestFit.join(', ')}
                </p>
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-auto pt-2 sm:pt-3">
                  <span className="text-[10px] sm:text-[11px] font-medium border border-wf-blue-info/30 text-wf-blue-info bg-wf-canvas px-1.5 sm:px-2 py-0.5 rounded-[4px]">{talent.ethnicity}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium border border-wf-blue-info/30 text-wf-blue-info bg-wf-canvas px-1.5 sm:px-2 py-0.5 rounded-[4px]">{talent.ageRange}</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-wf-hairline rounded-[8px]">
              <p className="text-wf-mute mb-4">No talents match your current filters.</p>
              <button
                onClick={() => { setQuery(''); setFilters(emptyFilters); }}
                className="text-wf-ink hover:opacity-60 text-sm font-medium underline underline-offset-2 transition-opacity"
              >
                Clear Filters
              </button>
            </div>
          )}

          {talents.length === 0 && (
            <div className="col-span-full py-12 text-center text-wf-mute border border-dashed border-wf-hairline rounded-[8px]">
              No talents available in the catalog.
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
