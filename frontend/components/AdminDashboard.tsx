import React, { useState, useMemo } from 'react';
import { Talent } from '../types.ts';
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown, X } from 'lucide-react';

interface AdminDashboardProps {
  talents: Talent[];
  onAddTalent: () => void;
  onEditTalent: (talent: Talent) => void;
  onDeleteTalent: (id: string) => void;
}

type SortKey = 'id' | 'name' | 'ethnicity' | 'gender' | 'bestFit';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  talents, 
  onAddTalent, 
  onEditTalent, 
  onDeleteTalent 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="text-zinc-600 ml-2 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-cyan-400 ml-2 inline-block" />
      : <ChevronDown size={14} className="text-cyan-400 ml-2 inline-block" />;
  };

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">ADMIN DASHBOARD</h1>
            <p className="text-zinc-400">Manage your AI talent catalog. Add, edit, or remove personas.</p>
          </div>
          <button 
            onClick={onAddTalent}
            className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={20} />
            <span>Add New Talent</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog..."
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

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500 select-none">
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    Profile <SortIcon columnKey="name" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('id')}>
                    ID <SortIcon columnKey="id" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ethnicity')}>
                    Demographics <SortIcon columnKey="ethnicity" />
                  </th>
                  <th className="p-6 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('bestFit')}>
                    Best For <SortIcon columnKey="bestFit" />
                  </th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300 divide-y divide-zinc-800/50">
                {filteredAndSortedTalents.map((talent) => (
                  <tr key={talent.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={talent.profileImageUrl || `https://picsum.photos/seed/${talent.imageSeed}_profile/100/100`} 
                          alt={talent.name} 
                          className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                        />
                        <span className="font-bold text-white">{talent.name}</span>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-sm text-zinc-400">{talent.id}</td>
                    <td className="p-6">
                      <div className="text-sm">{talent.ethnicity}</div>
                      <div className="text-xs text-zinc-500 mt-1">{talent.gender === 'M' ? 'Male' : 'Female'}, {talent.ageRange}</div>
                    </td>
                    <td className="p-6 text-sm text-zinc-400 max-w-xs truncate">
                      {talent.bestFit.join(', ')}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => onEditTalent(talent)}
                          className="p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                          title="Edit Talent"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm(`Are you sure you want to delete ${talent.name}?`)) {
                              onDeleteTalent(talent.id);
                            }
                          }}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Talent"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedTalents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                      {searchTerm ? `No talents found matching "${searchTerm}".` : 'No talents found. Click "Add New Talent" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
