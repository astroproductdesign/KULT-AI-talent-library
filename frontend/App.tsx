import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Home } from './components/Home.tsx';
import { Catalog } from './components/Catalog.tsx';
import { TalentDetail } from './components/TalentDetail.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { TalentForm } from './components/TalentForm.tsx';
import { Login } from './components/Login.tsx';
import { talents as initialTalents } from './data.ts';
import { Talent } from './types.ts';
import { supabase, toDb, fromDb } from './lib/supabaseClient.ts';

type ViewState = 'home' | 'catalog' | 'detail' | 'admin' | 'form' | 'login';
type Role = 'user' | 'admin';

export default function App() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('user');
  const [view, setView] = useState<ViewState>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);

  // Restore session on page load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setRole('admin');
      }
    });
  }, []);

  // Fetch talents from Supabase on mount
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('talents')
          .select('*')
          .order('position', { ascending: true, nullsFirst: false });
        if (error) throw error;
        setTalents(data && data.length > 0 ? data.map(fromDb) : initialTalents);
      } catch (err) {
        console.warn('Supabase fetch failed, using local data:', err);
        setTalents(initialTalents);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();
  }, []);

  const navigateToHome = () => {
    setSelectedTalentId(null);
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCatalog = () => {
    setView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLibraryClick = () => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        document.getElementById('talent-overview')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('talent-overview')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigateToAdmin = () => {
    if (!isAuthenticated) {
      setView('login');
    } else {
      setView('admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleSelect = (selectedRole: Role) => {
    if (selectedRole === 'user') {
      setRole('user');
      navigateToHome();
    } else if (selectedRole === 'admin') {
      if (!isAuthenticated) {
        setView('login');
      } else {
        setRole('admin');
        navigateToAdmin();
      }
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setRole('admin');
    setView('admin');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setRole('user');
    navigateToHome();
  };

  const handleSelectTalent = (id: string) => {
    setSelectedTalentId(id);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddTalentClick = () => {
    setEditingTalent(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTalentClick = (talent: Talent) => {
    setEditingTalent(talent);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTalent = async (id: string) => {
    try {
      const { error } = await supabase.from('talents').delete().eq('id', id);
      if (error) throw error;
      setTalents(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting talent:', err);
      alert('Failed to delete talent. Please try again.');
    }
  };

  const handleReorderTalents = async (reordered: Talent[]) => {
    setTalents(reordered);
    try {
      const updates = reordered.map((t, i) =>
        supabase.from('talents').update({ position: i }).eq('id', t.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Failed to persist talent order:', err);
    }
  };

  const handleSaveTalent = async (savedTalent: Talent) => {
    try {
      if (editingTalent) {
        const { error } = await supabase
          .from('talents')
          .upsert(toDb(savedTalent));
        if (error) throw error;
        setTalents(prev => prev.map(t => t.id === editingTalent.id ? savedTalent : t));
      } else {
        const { count } = await supabase
          .from('talents')
          .select('*', { count: 'exact', head: true });
        const { data, error } = await supabase
          .from('talents')
          .insert(toDb({ ...savedTalent, position: count ?? 0 }))
          .select()
          .single();
        if (error) throw error;
        setTalents(prev => [...prev, fromDb(data)]);
      }

      if (selectedTalentId === savedTalent.id) {
        setView('detail');
      } else {
        navigateToAdmin();
      }
    } catch (err) {
      console.error('Error saving talent:', err);
      alert('Failed to save talent. Please try again.');
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium animate-pulse uppercase tracking-widest text-xs">Loading Library...</p>
        </div>
      );
    }

    switch (view) {
      case 'home':
        return <Home onSelectTalent={handleSelectTalent} talents={talents} onSeeMore={navigateToCatalog} />;
      case 'catalog':
        return <Catalog onSelectTalent={handleSelectTalent} talents={talents} onBack={navigateToHome} />;
      case 'detail': {
        const selectedTalent = talents.find(t => t.id === selectedTalentId);
        if (!selectedTalent) return <Home onSelectTalent={handleSelectTalent} talents={talents} onSeeMore={navigateToCatalog} />;
        return (
          <TalentDetail
            talent={selectedTalent}
            onBack={navigateToHome}
            isAdmin={role === 'admin' && isAuthenticated}
            onEdit={() => handleEditTalentClick(selectedTalent)}
          />
        );
      }
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} onCancel={navigateToHome} />;
      case 'admin':
        if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} onCancel={navigateToHome} />;
        return (
          <AdminDashboard
            talents={talents}
            onAddTalent={handleAddTalentClick}
            onEditTalent={handleEditTalentClick}
            onDeleteTalent={handleDeleteTalent}
            onReorderTalents={handleReorderTalents}
          />
        );
      case 'form':
        if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} onCancel={navigateToHome} />;
        return (
          <TalentForm
            initialData={editingTalent}
            onSave={handleSaveTalent}
            onCancel={() => {
              if (selectedTalentId) {
                setView('detail');
              } else {
                navigateToAdmin();
              }
            }}
          />
        );
      default:
        return <Home onSelectTalent={handleSelectTalent} talents={talents} onSeeMore={navigateToCatalog} />;
    }
  };

  return (
    <div className="min-h-screen bg-kult-black text-white font-sans selection:bg-cyan-500/30">
      <Header
        onLogoClick={navigateToHome}
        onLibraryClick={handleLibraryClick}
        role={role}
        isAuthenticated={isAuthenticated}
        onRoleSelect={handleRoleSelect}
        onAdminClick={navigateToAdmin}
        onLogout={handleLogout}
      />
      <main>
        {renderView()}
      </main>
    </div>
  );
}
