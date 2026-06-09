import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

interface HeaderProps {
  onLogoClick: () => void;
  onLibraryClick: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onLogout: () => void;
  currentView?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onLogoClick,
  onLibraryClick,
  isAuthenticated,
  onLoginClick,
  onAdminClick,
  onLogout,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLibraryActive = !currentView || ['home', 'catalog', 'detail'].includes(currentView);
  const isDashboardActive = currentView === 'admin' || currentView === 'form';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-wf-canvas border-b border-wf-hairline">
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">

        {/* Hamburger (mobile) + Logo + Desktop Nav */}
        <div className="flex items-center space-x-3 md:space-x-10">
          {/* Hamburger — mobile only, leftmost */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-[4px] border border-wf-hairline text-wf-body hover:border-wf-ink hover:text-wf-ink transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div
            className="text-xl font-semibold tracking-tight text-wf-ink cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => { onLogoClick(); closeMobileMenu(); }}
          >
            KULT
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-7 h-full">
            <button
              onClick={onLibraryClick}
              className={`text-sm font-medium transition-colors border-b-2 pb-[1px] ${
                isLibraryActive
                  ? 'text-wf-ink border-wf-ink'
                  : 'text-wf-mute border-transparent hover:text-wf-ink'
              }`}
            >
              Library
            </button>
            {isAuthenticated && (
              <button
                onClick={onAdminClick}
                className={`text-sm font-medium transition-colors border-b-2 pb-[1px] ${
                  isDashboardActive
                    ? 'text-wf-ink border-wf-ink'
                    : 'text-wf-mute border-transparent hover:text-wf-ink'
                }`}
              >
                Dashboard
              </button>
            )}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="hidden md:inline-block text-xs font-medium text-wf-mute uppercase tracking-[1.5px]">
                Admin
              </span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 border border-wf-hairline rounded-[4px] text-sm font-medium text-wf-body hover:border-wf-ink hover:text-wf-ink transition-colors"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onLoginClick(); closeMobileMenu(); }}
              className="px-4 py-2 border border-wf-hairline rounded-[4px] text-sm font-medium text-wf-body hover:border-wf-ink hover:text-wf-ink transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-wf-hairline bg-wf-canvas">
          <nav className="max-w-[1440px] mx-auto px-8 py-4 flex flex-col space-y-1">
            <button
              onClick={() => { onLibraryClick(); closeMobileMenu(); }}
              className={`w-full text-left px-4 py-3 rounded-[4px] text-sm font-medium transition-colors ${
                isLibraryActive
                  ? 'bg-gray-50 text-wf-ink'
                  : 'text-wf-mute hover:text-wf-ink hover:bg-gray-50'
              }`}
            >
              Library
            </button>
            {isAuthenticated && (
              <button
                onClick={() => { onAdminClick(); closeMobileMenu(); }}
                className={`w-full text-left px-4 py-3 rounded-[4px] text-sm font-medium transition-colors ${
                  isDashboardActive
                    ? 'bg-gray-50 text-wf-ink'
                    : 'text-wf-mute hover:text-wf-ink hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
