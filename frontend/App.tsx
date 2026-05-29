import React, { useState, useEffect } from 'react';
import './firebase.ts'; // Initialize Firebase
import { Header } from './components/Header.tsx';
import { Home } from './components/Home.tsx';
import { Catalog } from './components/Catalog.tsx';
import { TalentDetail } from './components/TalentDetail.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { TalentForm } from './components/TalentForm.tsx';
import { Login } from './components/Login.tsx';
import { talents as initialTalents } from './data.ts';
import { Talent } from './types.ts';

// API base URL - change this to your Railway backend URL when deployed
const getApiBase = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Ensure it starts with a protocol to avoid relative path issues
  if (url && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url;
};

const API_BASE = getApiBase();

type ViewState = 'home' | 'catalog' | 'detail' | 'admin' | 'form' | 'login';
type Role = 'user' | 'admin';

export default function App() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('user');
  const [view, setView] = useState<ViewState>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);

  // Fetch talents from API on mount
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        setLoading(true);
        console.log('App: Fetching talents from:', API_BASE);
        const response = await fetch(`${API_BASE}/api/talents`);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        console.log('App: Successfully fetched', data.length, 'talents');
        setTalents(data.length > 0 ? data : initialTalents);
        setError(null);
      } catch (err) {
        console.warn('App: API fetch failed, falling back to initial data:', err.message);
        setTalents(initialTalents);
        setError(null);
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
      // Wait for render then scroll
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

  const handleLogout = () => {
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
      const response = await fetch(`${API_BASE}/api/talents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete talent');
      setTalents(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting talent:', err);
      alert('Failed to delete talent. Please try again.');
    }
  };

  const handleReorderTalents = async (reordered: Talent[]) => {
    // Optimistically update local state immediately
    setTalents(reordered);
    // Persist new order to Supabase
    try {
      const order = reordered.map((t, i) => ({ id: t.id, position: i }));
      await fetch(`${API_BASE}/api/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
    } catch (err) {
      console.error('Failed to persist talent order:', err);
    }
  };

  const handleSaveTalent = async (savedTalent: Talent) => {
    try {
      if (editingTalent) {
        // Update existing talent
        const response = await fetch(`${API_BASE}/api/talents/${editingTalent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedTalent),
        });
        if (!response.ok) throw new Error('Failed to update talent');
        setTalents(prev => prev.map(t => t.id === editingTalent.id ? savedTalent : t));
      } else {
        // Create new talent
        const response = await fetch(`${API_BASE}/api/talents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedTalent),
        });
        if (!response.ok) throw new Error('Failed to create talent');
        const newTalent = await response.json();
        setTalents(prev => [...prev, newTalent]);
      }
      
      // If we were editing a specific talent from the detail view, go back to detail view
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
