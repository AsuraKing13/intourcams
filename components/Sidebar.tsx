import React, { useContext, useMemo } from 'react';
import { ViewName, NavItemType } from '../types.ts';
import { NAV_ITEMS, GUEST_NAV_ITEMS, LogoIcon, MoonIcon, SunIcon, LoginIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '../constants.tsx';
import { ThemeContext } from './ThemeContext.tsx';
import Button from './ui/Button.tsx';
import { useAppContext } from './AppContext.tsx'; 

interface SidebarProps {
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  isGuest?: boolean;
  onSwitchToLogin?: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

// Defines access rules for different views based on user roles.
const VIEW_ACCESS_RULES: { [key in ViewName]?: string[] } = {
  [ViewName.UserManagement]: ['admin'],
  [ViewName.WebsiteManagement]: ['admin', 'editor'],
  [ViewName.GrantApplications]: ['admin', 'editor', 'tourism player', 'user'],
  [ViewName.ManageMyClusters]: ['tourism player', 'admin', 'editor'],
  [ViewName.SystemFeedback]: ['admin', 'editor'],
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isGuest = false, onSwitchToLogin, isCollapsed, toggleCollapse }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { currentUser } = useAppContext(); 

  // Memoized calculation of navigation items based on user role and guest status.
  const navItems = useMemo(() => {
    if (isGuest) {
      return GUEST_NAV_ITEMS;
    }
    
    const userRole = currentUser?.role?.trim()?.toLowerCase();
    if (!userRole) return [];

    // Filter items based on the user's role.
    return NAV_ITEMS.filter(item => {
      const requiredRoles = VIEW_ACCESS_RULES[item.name];
      // If no specific roles are required, the item is visible to everyone.
      if (!requiredRoles) {
        return true;
      }
      // Otherwise, check if the user's role is included in the required roles.
      return requiredRoles.includes(userRole);
    });
  }, [isGuest, currentUser]);

  return (
    <aside className={`flex flex-col h-full shadow-lg print:hidden bg-sidebar-bg-light dark:bg-sidebar-bg text-brand-text-secondary-light dark:text-brand-text-secondary transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className={`p-6 border-b border-neutral-300-light dark:border-neutral-700-dark flex flex-col items-center text-center ${isCollapsed ? 'px-2' : ''}`}>
        <LogoIcon className={`w-auto transition-all duration-300 ${isCollapsed ? 'h-12' : 'h-20'}`}/>
        {!isCollapsed && (
          <>
            <h2 className="mt-3 text-lg font-bold text-brand-green-text dark:text-brand-dark-green-text">INTOURCAMS</h2>
            <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">
                Integrated Tourism Coordination and Monitoring System
            </p>
          </>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item: NavItemType) => (
          <button
            key={item.name}
            onClick={() => setCurrentView(item.name)}
            title={item.name}
            className={`w-full flex items-center space-x-3 rounded-lg transition-all duration-200 ease-in-out ${isCollapsed ? 'justify-center h-12' : 'px-4 py-3'}
                        ${currentView === item.name 
                            ? 'bg-brand-green dark:bg-brand-dark-green text-white dark:text-white font-semibold shadow-md' 
                            : 'hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark hover:text-brand-green-text dark:hover:text-brand-dark-green-text'
                        }`}
            aria-current={currentView === item.name ? "page" : undefined}
            aria-label={item.name}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${currentView === item.name ? 'text-white' : 'text-brand-green dark:text-brand-dark-green-text'}`} />
            {!isCollapsed && <span className="transition-opacity duration-200">{item.name}</span>}
          </button>
        ))}
      </nav>
      <div className={`p-4 border-t border-neutral-300-light dark:border-neutral-700-dark ${isCollapsed ? 'px-2' : ''}`}>
        {isGuest && onSwitchToLogin && !isCollapsed && (
            <div className='mb-4'>
                <Button 
                    variant="primary" 
                    size="md" 
                    onClick={onSwitchToLogin} 
                    leftIcon={<LoginIcon className="w-5 h-5"/>}
                    className="w-full"
                    title="Admin & User Login"
                >
                    Admin & User Login
                </Button>
            </div>
        )}
        <div className="flex flex-col space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-neutral-200-light dark:bg-neutral-700-dark hover:bg-neutral-300-light dark:hover:bg-neutral-600-dark text-brand-text-secondary-light dark:text-brand-text-secondary transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-indigo-400" />}
              {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
             <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-neutral-200-light dark:bg-neutral-700-dark hover:bg-neutral-300-light dark:hover:bg-neutral-600-dark text-brand-text-secondary-light dark:text-brand-text-secondary transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5 text-brand-green dark:text-brand-dark-green-text" /> : <ChevronDoubleLeftIcon className="w-5 h-5 text-brand-green dark:text-brand-dark-green-text" />}
              {!isCollapsed && <span>Collapse Menu</span>}
            </button>
        </div>
        {!isCollapsed && (
            <p className="text-xs text-center mt-4 text-neutral-500-light dark:text-neutral-500-dark">
              © {new Date().getFullYear()} All rights reserved.
            </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;