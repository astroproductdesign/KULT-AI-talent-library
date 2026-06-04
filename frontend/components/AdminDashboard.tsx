import React, { useState, useRef } from 'react';
import { Talent } from '../types.ts';
import { Plus, Edit2, Trash2, Search, X, GripVertical } from 'lucide-react';

interface AdminDashboardProps {
  talents: Talent[];
  onAddTalent: () => void;
  onEditTalent: (talent: Talent) => void;
  onDeleteTalent: (id: string) => void;
  onReorderTalents?: (reordered: Talent[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  talents,
  onAddTalent,
  onEditTalent,
  onDeleteTalent,
  onReorderTalents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localOrder, setLocalOrder] = useState<Talent[]>(talents);
  const draggedId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIdState, setDragOverIdState] = useState<string | null>(null);

  // Keep localOrder in sync when talents prop changes
  React.useEffect(() => { setLocalOrder(talents); }, [talents]);

  const displayList = searchTerm.trim()
    ? localOrder.filter(t => {
        const q = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.ethnicity.toLowerCase().includes(q) ||
          t.bestFit.some(b => b.toLowerCase().includes(q))
        );
      })
    : localOrder;

  const handleDragStart = (id: string) => {
    draggedId.current = id;
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id === draggedId.current) return;
    dragOverId.current = id;
    setDragOverIdState(id);
  };

  const handleDrop = () => {
    if (!draggedId.current || !dragOverId.current || draggedId.current === dragOverId.current) return;
    const from = localOrder.findIndex(t => t.id === draggedId.current);
    const to   = localOrder.findIndex(t => t.id === dragOverId.current);
    const reordered = [...localOrder];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setLocalOrder(reordered);
    onReorderTalents?.(reordered);
  };

  const handleDragEnd = () => {
    draggedId.current = null;
    dragOverId.current = null;
    setDraggingId(null);
    setDragOverIdState(null);
  };

  return (
    <div className="min-h-screen bg-kult-black pb-24">
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">ADMIN DASHBOARD</h1>
            <p className="text-zinc-400">Manage your AI talent catalog. Drag rows to reorder the talent library display order.</p>
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
                  <th className="p-4 w-10"></th>
                  <th className="p-6 font-medium">Profile</th>
                  <th className="p-6 font-medium">ID</th>
                  <th className="p-6 font-medium">Demographics</th>
                  <th className="p-6 font-medium">Best For</th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300 divide-y divide-zinc-800/50">
                {displayList.map((talent) => {
                  const isDragging = draggingId === talent.id;
                  const isDragOver = dragOverIdState === talent.id;
                  return (
                    <tr
                      key={talent.id}
                      draggable={!searchTerm}
                      onDragStart={() => handleDragStart(talent.id)}
                      onDragOver={(e) => handleDragOver(e, talent.id)}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors
                        ${isDragging ? 'opacity-40 bg-zinc-800/50' : 'hover:bg-zinc-800/30'}
                        ${isDragOver && !isDragging ? 'border-t-2 border-t-cyan-400 bg-cyan-400/5' : ''}
                      `}
                    >
                      {/* Drag handle */}
                      <td className="pl-4 pr-0 w-10">
                        <div className={`flex items-center justify-center h-full ${searchTerm ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300'}`}>
                          <GripVertical size={18} />
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center space-x-4">
                          <img
                            src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`}
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
                      <td className="p-6 text-sm text-zinc-400 max-w-xs truncate">{talent.bestFit.join(', ')}</td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => onEditTalent(talent)}
                            className="p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Delete ${talent.name}?`)) onDeleteTalent(talent.id); }}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-500">
                      {searchTerm ? `No talents found matching "${searchTerm}".` : 'No talents found. Click "Add New Talent" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!searchTerm && localOrder.length > 1 && (
            <div className="px-6 py-3 border-t border-zinc-800 text-xs text-zinc-600 flex items-center gap-2">
              <GripVertical size={12} />
              Drag rows to reorder. Order is reflected on the main talent library page.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
