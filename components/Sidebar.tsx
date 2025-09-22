
import React, { useContext, useMemo } from 'react';
import { ViewName, NavItemType } from '../types.ts';
import { NAV_ITEMS, GUEST_NAV_ITEMS, LogoIcon, MoonIcon, SunIcon, LoginIcon, XMarkIcon, UserPlusIcon } from '../constants.tsx';
import { ThemeContext } from './ThemeContext.tsx';
import Button from './ui/Button.tsx';
import { useAppContext } from './AppContext.tsx'; 

interface SidebarProps {
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  isGuest?: boolean;
  onSwitchToLogin?: () => void;
  onRegister?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// Defines access rules for different views based on user roles.
const VIEW_ACCESS_RULES: { [key in ViewName]?: string[] } = {
  [ViewName.UserManagement]: ['admin'],
  [ViewName.WebsiteManagement]: ['admin', 'editor'],
  [ViewName.GrantApplications]: ['admin', 'editor', 'tourism player', 'user'],
  [ViewName.ManageMyClusters]: ['tourism player', 'admin', 'editor'],
  [ViewName.SystemFeedback]: ['admin', 'editor'],
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isGuest = false, onSwitchToLogin, onRegister, isOpen, onClose }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { currentUser } = useAppContext(); 

  const navItems = useMemo(() => {
    if (isGuest) {
      return GUEST_NAV_ITEMS;
    }
    
    const userRole = currentUser?.role?.trim()?.toLowerCase();
    if (!userRole) return [];

    return NAV_ITEMS.filter(item => {
      const requiredRoles = VIEW_ACCESS_RULES[item.name];
      if (!requiredRoles) return true;
      return requiredRoles.includes(userRole);
    });
  }, [isGuest, currentUser]);

  const handleNavItemClick = (view: ViewName) => {
    setCurrentView(view);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar Content */}
      <aside 
        className={`fixed top-0 right-0 h-full w-72 bg-sidebar-bg-light dark:bg-sidebar-bg text-brand-text-secondary-light dark:text-brand-text-secondary shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex flex-col h-full">
            <div className={`p-6 border-b border-neutral-300-light dark:border-neutral-700-dark flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <LogoIcon className="h-10 w-auto"/>
                <h2 id="sidebar-title" className="text-lg font-bold text-brand-green-text dark:text-brand-dark-green-text">INTOURCAMS</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark lg:hidden" aria-label="Close menu">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
              {navItems.map((item: NavItemType) => (
                <button
                  key={item.name}
                  onClick={() => handleNavItemClick(item.name)}
                  title={item.name}
                  className={`w-full flex items-center space-x-3 rounded-lg transition-all duration-200 ease-in-out px-4 py-3
                              ${currentView === item.name 
                                  ? 'bg-brand-green dark:bg-brand-dark-green text-white dark:text-white font-semibold shadow-md' 
                                  : 'hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark hover:text-brand-green-text dark:hover:text-brand-dark-green-text'
                              }`}
                  aria-current={currentView === item.name ? "page" : undefined}
                  aria-label={item.name}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${currentView === item.name ? 'text-white' : 'text-brand-green dark:text-brand-dark-green-text'}`} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
            <div className={`p-4 border-t border-neutral-300-light dark:border-neutral-700-dark`}>
              {isGuest && (
                  <div className='mb-4 space-y-3'>
                      {onSwitchToLogin && (
                        <Button 
                            variant="primary" 
                            size="md" 
                            onClick={onSwitchToLogin} 
                            leftIcon={<LoginIcon className="w-5 h-5"/>}
                            className="w-full"
                            title="Admin & User Login"
                        >
                            Login
                        </Button>
                      )}
                      {onRegister && (
                        <Button 
                            variant="secondary" 
                            size="md" 
                            onClick={onRegister} 
                            leftIcon={<UserPlusIcon className="w-5 h-5"/>}
                            className="w-full"
                            title="Create a New Account"
                        >
                            Register
                        </Button>
                      )}
                  </div>
              )}
              <div className="flex flex-col space-y-2">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-neutral-200-light dark:bg-neutral-700-dark hover:bg-neutral-300-light dark:hover:bg-neutral-600-dark text-brand-text-secondary-light dark:text-brand-text-secondary transition-colors"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-indigo-400" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
              </div>
              <p className="text-xs text-center mt-4 text-neutral-500-light dark:text-neutral-500-dark">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;