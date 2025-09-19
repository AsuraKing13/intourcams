import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { ViewName, NavItemType } from '../types.ts';
import { 
    BellIcon, LoginIcon, UserPlusIcon, LogoutIcon, SettingsIcon, 
    LogoIcon, MoonIcon, SunIcon, NAV_ITEMS, GUEST_NAV_ITEMS, Bars3Icon, XMarkIcon, DevicePhoneMobileIcon, AccessibilityIcon
} from '../constants.tsx';
import { useAppContext } from './AppContext.tsx';
import NotificationPanel from './ui/NotificationPanel.tsx';
import Button from './ui/Button.tsx';
import { ThemeContext } from './ThemeContext.tsx';
import AccessibilityMenu from './ui/AccessibilityMenu.tsx';

interface HeaderProps {
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  isGuest?: boolean;
  onSwitchToLogin?: () => void;
  onRegister?: () => void;
  handleLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, isGuest = false, onSwitchToLogin, onRegister, handleLogout }) => {
  const { currentUser, getNotificationsForCurrentUser, isPhoneView, togglePhoneView } = useAppContext();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const accessibilityRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => {
    const baseItems = isGuest ? GUEST_NAV_ITEMS : NAV_ITEMS;
    const itemsWithoutHome = baseItems.filter(item => item.name !== ViewName.MainMenu);

    if (isGuest) {
        return itemsWithoutHome;
    }
    
    const userRole = currentUser?.role?.trim()?.toLowerCase();
    const accessRules: { [key in ViewName]?: string[] } = {
        [ViewName.UserManagement]: ['admin'],
        [ViewName.WebsiteManagement]: ['admin', 'editor'],
        [ViewName.SystemFeedback]: ['admin', 'editor'],
        [ViewName.ManageMyClusters]: ['tourism player'],
        [ViewName.GrantApplications]: ['admin', 'editor', 'tourism player', 'user']
    };

    return itemsWithoutHome.filter(item => {
        const requiredRoles = accessRules[item.name];
        if (!requiredRoles) return true;
        return userRole ? requiredRoles.includes(userRole) : false;
    });
  }, [isGuest, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
          // Note: NotificationPanel handles its own outside click, this is just for the button icon state if needed.
      }
      if (accessibilityRef.current && !accessibilityRef.current.contains(event.target as Node)) {
        setIsAccessibilityMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userNotifications = useMemo(() => currentUser ? getNotificationsForCurrentUser() : [], [currentUser, getNotificationsForCurrentUser]);
  const unreadCount = useMemo(() => currentUser ? userNotifications.filter(n => !(n.read_by || []).includes(currentUser.id)).length : 0, [currentUser, userNotifications]);
  
  const userInitial = currentUser?.name?.substring(0, 1).toUpperCase() || 'U';
  const userAvatar = currentUser?.avatar;
  const userThemeColor = currentUser?.role === 'Admin' ? 'bg-brand-dark-green text-white' : 'bg-brand-green text-white';

  const onLogoutClick = async () => {
    setIsProfileDropdownOpen(false);
    if (handleLogout) handleLogout();
  };

  const handleMobileNavClick = (view: ViewName) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-sidebar-bg-light dark:bg-sidebar-bg h-16 shadow-md print:hidden border-b border-neutral-300-light dark:border-neutral-700-dark">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <button onClick={() => setCurrentView(ViewName.MainMenu)} className="flex-shrink-0" aria-label="Go to Main Menu">
                <LogoIcon className="h-10 w-auto" />
            </button>
            <span className="text-xl font-bold text-brand-green-text dark:text-brand-dark-green-text hidden sm:block">
              INTOURCAMS
            </span>
          </div>

          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main navigation">
            {navItems.map((item: NavItemType) => (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.name)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.name
                    ? 'bg-brand-green dark:bg-brand-dark-green text-white'
                    : 'text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark'
                }`}
                aria-current={currentView === item.name ? "page" : undefined}
              >
                {item.name}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-indigo-400" />}
            </button>
            
            <div ref={accessibilityRef} className="relative">
              <button
                onClick={() => setIsAccessibilityMenuOpen(p => !p)}
                className="p-2 rounded-full text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark transition-colors"
                aria-label="Accessibility Settings"
                aria-haspopup="true"
                aria-expanded={isAccessibilityMenuOpen}
              >
                <AccessibilityIcon className="w-6 h-6" />
              </button>
              {isAccessibilityMenuOpen && <AccessibilityMenu onClose={() => setIsAccessibilityMenuOpen(false)} />}
            </div>

            {currentUser?.role === 'Editor' && (
               <button
                  onClick={togglePhoneView}
                  className={`p-2 rounded-full transition-colors ${
                    isPhoneView 
                        ? 'bg-brand-green/20 text-brand-green-text dark:bg-brand-dark-green/30 dark:text-brand-dark-green-text' 
                        : 'text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark'
                  }`}
                  aria-label={isPhoneView ? "Switch to Desktop View" : "Switch to Phone View"}
                  title={isPhoneView ? "Switch to Desktop View" : "Switch to Phone View"}
                >
                  <DevicePhoneMobileIcon className="w-6 h-6" />
                </button>
            )}
            
            {currentUser ? (
              <>
                <div ref={notificationRef} className="relative">
                    <button 
                      onClick={() => setIsNotificationPanelOpen(p => !p)}
                      className="text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-green-text dark:hover:text-brand-dark-green-text transition-colors p-2 rounded-full hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark"
                      aria-label={`View notifications (${unreadCount} unread)`}
                    >
                      <BellIcon className="w-6 h-6" />
                      {unreadCount > 0 && <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                </div>
                
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setIsProfileDropdownOpen(p => !p)} className="flex items-center space-x-2 cursor-pointer group rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green dark:focus:ring-brand-dark-green" aria-label="Open user menu" aria-haspopup="true" aria-expanded={isProfileDropdownOpen}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${userThemeColor} group-hover:opacity-80 transition-opacity`}>
                      {userAvatar || userInitial}
                    </div>
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-card-bg-light dark:bg-card-bg rounded-lg shadow-xl border border-neutral-300-light dark:border-neutral-700-dark z-50 animate-modalShow origin-top-right">
                      <div className="p-3 border-b border-neutral-200-light dark:border-neutral-600-dark">
                          <p className="font-semibold text-sm text-brand-text-light dark:text-brand-text truncate">{currentUser.name}</p>
                          <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary truncate">{currentUser.email}</p>
                      </div>
                      <ul className="p-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                          <li><button role="menuitem" onClick={() => { setCurrentView(ViewName.Settings); setIsProfileDropdownOpen(false); }} className="w-full text-left flex items-center px-3 py-2 text-sm text-brand-text-light dark:text-brand-text hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark transition-colors rounded-md"><SettingsIcon className="w-5 h-5 mr-3 text-brand-text-secondary-light dark:text-brand-text-secondary" />Profile Settings</button></li>
                          <li><button role="menuitem" onClick={onLogoutClick} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark transition-colors rounded-md"><LogoutIcon className="w-5 h-5 mr-3" />Logout</button></li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={onSwitchToLogin} leftIcon={<LoginIcon className="w-5 h-5" />}>Login</Button>
                <Button variant="primary" size="sm" onClick={onRegister} leftIcon={<UserPlusIcon className="w-5 h-5" />}>Register</Button>
              </div>
            )}

            <div className="lg:hidden">
                <button onClick={() => setIsMobileMenuOpen(p => !p)} className="p-2 rounded-md text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark" aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen}>
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6"/> : <Bars3Icon className="w-6 h-6"/>}
                </button>
            </div>
          </div>
        </div>
      </header>
      
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-sidebar-bg-light dark:bg-sidebar-bg p-4 border-b border-neutral-300-light dark:border-neutral-700-dark shadow-lg animate-modalShow">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item: NavItemType) => (
              <button
                key={item.name}
                onClick={() => handleMobileNavClick(item.name)}
                className={`px-4 py-3 rounded-md text-base font-medium transition-colors text-left flex items-center space-x-3 ${
                  currentView === item.name
                    ? 'bg-brand-green dark:bg-brand-dark-green text-white'
                    : 'text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark'
                }`}
                aria-current={currentView === item.name ? "page" : undefined}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
            {isGuest && (
              <div className="pt-4 mt-4 border-t border-neutral-300-light dark:border-neutral-700-dark space-y-2">
                 <Button variant="ghost" size="md" className="w-full" onClick={() => { onSwitchToLogin?.(); setIsMobileMenuOpen(false); }} leftIcon={<LoginIcon className="w-5 h-5" />}>Login</Button>
                 <Button variant="primary" size="md" className="w-full" onClick={() => { onRegister?.(); setIsMobileMenuOpen(false); }} leftIcon={<UserPlusIcon className="w-5 h-5" />}>Register</Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {currentUser && <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} setCurrentView={setCurrentView} />}
    </>
  );
};

export default Header;