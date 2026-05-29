import React from 'react';
import { Shield, UserCircle, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogoClick: () => void;
  onLibraryClick: () => void;
  role: 'user' | 'admin';
  isAuthenticated: boolean;
  onRoleSelect: (role: 'user' | 'admin') => void;
  onAdminClick: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onLibraryClick,
  role, 
  isAuthenticated, 
  onRoleSelect, 
  onAdminClick,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-50 bg-kult-black/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div 
            className="text-4xl font-black tracking-tighter cursor-pointer hover:text-gray-300 transition-colors"
            onClick={onLogoClick}
          >
            KULT
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-zinc-400">
            <button onClick={onLibraryClick} className="hover:text-white transition-colors">Library</button>
            {isAuthenticated && (
              <button onClick={onAdminClick} className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1">
                <Shield size={14} />
                <span>Dashboard</span>
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline-block text-xs font-bold text-cyan-400 uppercase tracking-wider">Admin Active</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-all"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <button
                onClick={() => onRoleSelect('user')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  role === 'user' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <UserCircle size={16} />
                <span>User</span>
              </button>
              <button
                onClick={() => onRoleSelect('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  role === 'admin' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Shield size={16} />
                <span>Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Gradient Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-cyan-400 to-orange-400"></div>
    </header>
  );
};
