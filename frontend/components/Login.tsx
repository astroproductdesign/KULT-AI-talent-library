import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.ts';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('Invalid email or password.');
      } else {
        onLoginSuccess();
      }
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 md:px-6 bg-wf-canvas">
      <div className="w-full max-w-md md:border md:border-wf-hairline md:rounded-[8px] md:p-10 md:shadow-wf-2">

        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-wf-ink rounded-full flex items-center justify-center">
            <Lock size={24} className="text-white" />
          </div>
        </div>

        <h2 className="text-[32px] font-semibold text-wf-ink text-center mb-2 tracking-[-0.8px]">Admin Access</h2>
        <p className="text-wf-mute text-center mb-8 text-sm">Enter your credentials to manage the catalog.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-wf-red/30 text-wf-red px-4 py-3 rounded-[4px] text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-wf-canvas border border-wf-hairline rounded-[4px] px-4 py-3 text-wf-ink text-[16px] placeholder-wf-mute-soft focus:outline-none focus:border-wf-ink transition-colors"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-wf-mute uppercase tracking-[1.5px] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-wf-canvas border border-wf-hairline rounded-[4px] px-4 py-3 text-wf-ink text-[16px] placeholder-wf-mute-soft focus:outline-none focus:border-wf-ink transition-colors"
              placeholder="Enter password"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-wf-ink text-white py-3 rounded-[4px] text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Checking…' : 'Login'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
