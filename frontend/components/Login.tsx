import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded credentials for demo purposes
    if (username === 'admin' && password === 'astrogobeyond@1') {
      onLoginSuccess();
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
            <Lock size={28} className="text-cyan-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-center mb-2 tracking-tighter">ADMIN ACCESS</h2>
        <p className="text-zinc-400 text-center mb-8 text-sm">Enter your credentials to manage the catalog.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              placeholder="Enter password"
            />
          </div>

          <div className="pt-4 flex space-x-4">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-full font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 bg-white text-black py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
            >
              <span>Login</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
