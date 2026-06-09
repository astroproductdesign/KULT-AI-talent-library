import React, { useState, useRef } from 'react';
import { Talent } from '../types.ts';
import { Plus, Edit2, Trash2, Search, X, GripVertical } from 'lucide-react';

interface AdminDashboardProps {
  talents: Talent[];
  onAddTalent: () => void;
  onEditTalent: (talent: Talent) => void;
  onDeleteTalent: (id: string) => void;
  onReorderTalents?: (reordered: Talent[]) => void;
  onSelectTalent?: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  talents,
  onAddTalent,
  onEditTalent,
  onDeleteTalent,
  onReorderTalents,
  onSelectTalent,
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
    <div className="min-h-screen bg-wf-canvas pb-24">
      <section className="max-w-[1440px] mx-auto px-8 pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <p className="text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-3">Management</p>
            <h1 className="text-[44px] font-semibold text-wf-ink tracking-[-0.5px] leading-[46px] mb-2">Admin Dashboard</h1>
            <p className="text-wf-body text-[15px]">Manage your AI talent catalog. Drag rows to reorder the talent library display order.</p>
          </div>
          <button
            onClick={onAddTalent}
            className="flex items-center space-x-2 bg-wf-ink text-white px-6 py-3 rounded-[4px] text-sm font-medium hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Plus size={18} />
            <span>Add New Talent</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-wf-mute" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog…"
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

        {/* ── Mobile card list ── */}
        <div className="md:hidden space-y-3">
          {displayList.map((talent) => (
            <div
              key={talent.id}
              className="bg-wf-canvas border border-wf-hairline rounded-[8px] p-4 shadow-wf-2"
            >
              {/* Top row: avatar + name + ID — clickable to view profile */}
              <div
                className={`flex items-center space-x-3 mb-3 ${onSelectTalent ? 'cursor-pointer group/profile' : ''}`}
                onClick={() => onSelectTalent?.(talent.id)}
              >
                <img
                  src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`}
                  alt={talent.name}
                  className="w-12 h-12 rounded-full object-cover border border-wf-hairline flex-shrink-0 group-hover/profile:opacity-80 transition-opacity"
                />
                <div className="min-w-0">
                  <div className="font-semibold uppercase text-wf-ink text-[15px] leading-tight truncate group-hover/profile:opacity-60 transition-opacity">{talent.name}</div>
                  <div className="font-mono text-[12px] text-wf-mute mt-0.5">{talent.id}</div>
                </div>
              </div>

              {/* Demographics row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                <span className="text-[13px] text-wf-body">{talent.ethnicity}</span>
                <span className="text-[13px] text-wf-mute">{talent.gender === 'M' ? 'Male' : 'Female'} · {talent.ageRange}</span>
              </div>

              {/* Best for */}
              <p className="text-[13px] text-wf-body-mid leading-snug line-clamp-2 mb-4">
                {talent.bestFit.join(', ')}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-wf-hairline">
                <button
                  onClick={() => onEditTalent(talent)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[4px] border border-wf-hairline text-[13px] font-medium text-wf-body hover:border-wf-ink hover:text-wf-ink transition-colors"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => { if (window.confirm(`Delete ${talent.name}?`)) onDeleteTalent(talent.id); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[4px] border border-wf-hairline text-[13px] font-medium text-wf-mute hover:border-red-300 hover:text-wf-red hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {displayList.length === 0 && (
            <div className="py-14 text-center text-wf-mute text-[15px] border border-wf-hairline rounded-[8px]">
              {searchTerm ? `No talents found matching "${searchTerm}".` : 'No talents yet. Tap "Add New Talent" to create one.'}
            </div>
          )}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block bg-wf-canvas border border-wf-hairline rounded-[8px] overflow-hidden shadow-wf-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-wf-hairline bg-gray-50 text-[11px] font-medium uppercase tracking-[1.5px] text-wf-mute select-none">
                  <th className="px-4 py-4 w-10"></th>
                  <th className="px-6 py-4">Profile</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Demographics</th>
                  <th className="px-6 py-4">Best For</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-wf-body divide-y divide-wf-hairline">
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
                        ${isDragging ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50'}
                        ${isDragOver && !isDragging ? 'border-t-2 border-t-wf-ink bg-wf-ink/5' : ''}
                      `}
                    >
                      {/* Drag handle */}
                      <td className="pl-4 pr-0 w-10">
                        <div className={`flex items-center justify-center h-full ${searchTerm ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing text-wf-mute-soft hover:text-wf-mute'}`}>
                          <GripVertical size={16} />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className={`flex items-center space-x-4 ${onSelectTalent ? 'cursor-pointer group/profile' : ''}`}
                          onClick={() => onSelectTalent?.(talent.id)}
                        >
                          <img
                            src={talent.mainImageUrl || `https://picsum.photos/seed/${talent.imageSeed}/100/100`}
                            alt={talent.name}
                            className="w-11 h-11 rounded-full object-cover border border-wf-hairline group-hover/profile:opacity-80 transition-opacity"
                          />
                          <span className="font-semibold uppercase text-wf-ink text-[15px] group-hover/profile:opacity-60 transition-opacity">{talent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-[13px] text-wf-mute">{talent.id}</td>
                      <td className="px-6 py-5">
                        <div className="text-[14px] text-wf-body">{talent.ethnicity}</div>
                        <div className="text-[13px] text-wf-mute mt-0.5">{talent.gender === 'M' ? 'Male' : 'Female'}, {talent.ageRange}</div>
                      </td>
                      <td className="px-6 py-5 text-[14px] text-wf-body-mid max-w-xs truncate">{talent.bestFit.join(', ')}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onEditTalent(talent)}
                            className="p-2 text-wf-mute hover:text-wf-ink hover:bg-gray-100 rounded-[4px] transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Delete ${talent.name}?`)) onDeleteTalent(talent.id); }}
                            className="p-2 text-wf-mute hover:text-wf-red hover:bg-red-50 rounded-[4px] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-wf-mute text-[15px]">
                      {searchTerm ? `No talents found matching "${searchTerm}".` : 'No talents found. Click "Add New Talent" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!searchTerm && localOrder.length > 1 && (
            <div className="px-6 py-3 border-t border-wf-hairline text-[12px] text-wf-mute-soft flex items-center gap-2">
              <GripVertical size={11} />
              Drag rows to reorder. Order is reflected on the main talent library page.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
