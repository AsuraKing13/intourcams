import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { ViewName, NestedNavItemType } from '../types.ts';
import { 
    BellIcon, LoginIcon, UserPlusIcon, LogoutIcon, SettingsIcon, 
    LogoIcon, MoonIcon, SunIcon, Bars3Icon, XMarkIcon, 
    DevicePhoneMobileIcon, AccessibilityIcon, ChevronDownIcon,
    GUEST_HEADER_NAV_ITEMS
} from '../constants.tsx';
import { useAppContext } from './AppContext.tsx';
import NotificationPanel from './ui/NotificationPanel.tsx';
import Button from './ui/Button.tsx';
import { ThemeContext } from './ThemeContext.tsx';
import AccessibilityMenu from './ui/AccessibilityMenu.tsx';
import Sidebar from './Sidebar.tsx';
import { useAccessibility } from './AccessibilityContext.tsx';

interface HeaderProps {
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  isGuest?: boolean;
  onSwitchToLogin?: () => void;
  onRegister?: () => void;
  handleLogout?: () => void;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

// --- Dropdown Menu Component for Top Nav ---
const NavDropdown: React.FC<{ 
    item: NestedNavItemType; 
    currentView: ViewName; 
    setCurrentView: (view: ViewName) => void; 
    className: string;
}> = ({ item, currentView, setCurrentView, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(p => !p)}
                className={`h-16 inline-flex items-center px-3 text-sm font-semibold transition-colors ${className}`}
            >
                {item.name}
                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-card-bg-light dark:bg-card-bg rounded-lg shadow-xl border border-neutral-300-light dark:border-neutral-700-dark z-50 animate-modalShow origin-top-left p-1">
                    {item.children?.map(child => (
                        <button
                            key={child.name}
                            onClick={() => {
                                if (child.view) setCurrentView(child.view);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors text-brand-text-light dark:text-brand-text ${
                                child.view === currentView ? 'bg-neutral-200-light dark:bg-neutral-700-dark font-semibold' : 'hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark'
                            }`}
                        >
                            <child.icon className="w-5 h-5 mr-3 text-brand-text-secondary-light dark:text-brand-text-secondary" />
                            {child.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, isGuest = false, onSwitchToLogin, onRegister, handleLogout, scrollContainerRef }) => {
  const { currentUser, getNotificationsForCurrentUser, isPhoneView, togglePhoneView, HEADER_NAV_ITEMS } = useAppContext();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { contrastMode } = useAccessibility();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const accessibilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollTarget = scrollContainerRef?.current || window;

    const handleScroll = () => {
        const scrollTop = scrollContainerRef?.current
            ? scrollContainerRef.current.scrollTop
            : window.scrollY;
        setIsScrolled(scrollTop > 10);
    };

    // Initial check to set state correctly on page load
    handleScroll();

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef]);

  const navItems = useMemo(() => {
    if (isGuest) {
        return GUEST_HEADER_NAV_ITEMS;
    }
    
    const userRole = currentUser?.role?.trim()?.toLowerCase();
    const accessRules: { [key in ViewName]?: string[] } = {
        [ViewName.UserManagement]: ['admin'],
        [ViewName.WebsiteManagement]: ['admin', 'editor'],
        [ViewName.SystemFeedback]: ['admin', 'editor'],
        [ViewName.ManageMyClusters]: ['tourism player', 'admin', 'editor'],
        [ViewName.GrantApplications]: ['admin', 'editor', 'tourism player', 'user']
    };

    const filterChildren = (children: NestedNavItemType['children']) => {
        return children?.filter(child => {
            if (!child.view) return true;
            const requiredRoles = accessRules[child.view];
            if (!requiredRoles) return true;
            return userRole ? requiredRoles.includes(userRole) : false;
        });
    };
    
    return HEADER_NAV_ITEMS.map(item => {
        if (item.children) {
            const visibleChildren = filterChildren(item.children);
            if (visibleChildren && visibleChildren.length > 0) {
                return { ...item, children: visibleChildren };
            }
            return null; // Hide dropdown if no children are visible
        }
        if (item.view) {
             const requiredRoles = accessRules[item.view];
             if (!requiredRoles) return item;
             if (userRole && requiredRoles.includes(userRole)) return item;
             return null;
        }
        return item;

    }).filter(Boolean) as NestedNavItemType[];
  }, [isGuest, currentUser, HEADER_NAV_ITEMS]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
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
  
  const onLogoutClick = async () => {
    setIsProfileDropdownOpen(false);
    if (handleLogout) handleLogout();
  };

  const isTransparent = currentView === ViewName.Dashboard && !isScrolled && contrastMode !== 'high';

  const headerClasses = `fixed top-0 left-0 right-0 z-40 h-16 print:hidden transition-all duration-300 ease-in-out ${
    isTransparent
      ? 'bg-transparent border-b border-transparent'
      : 'bg-sidebar-bg-light dark:bg-sidebar-bg shadow-md border-b border-neutral-300-light dark:border-neutral-700-dark'
  }`;
  
  const navLinkClasses = (isActive: boolean) => {
    if (isTransparent) {
        return isActive
            ? 'text-white border-b-2 border-white text-shadow-md'
            : 'text-gray-200 hover:text-white text-shadow-md';
    }
    return isActive
        ? 'text-brand-green-text dark:text-brand-dark-green-text border-b-2 border-brand-green dark:border-brand-dark-green'
        : 'text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-green-text dark:hover:text-brand-dark-green-text';
  };

  const dropdownLinkClasses = (isChildActive: boolean) => {
      if (isTransparent) {
          return isChildActive ? 'text-white text-shadow-md' : 'text-gray-200 hover:text-white text-shadow-md';
      }
      return isChildActive
          ? 'text-brand-green-text dark:text-brand-dark-green-text font-semibold'
          : 'text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-green-text dark:hover:text-brand-dark-green-text';
  };
  
  const iconButtonClasses = isTransparent
    ? 'text-gray-200 hover:text-white hover:bg-white/10'
    : 'text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark';
  
  return (
    <>
      <header className={headerClasses}>
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Left Side */}
          <div className="flex items-center space-x-3">
            <button onClick={() => setCurrentView(ViewName.Dashboard)} className="flex-shrink-0" aria-label="Go to Home Dashboard">
                <LogoIcon className="h-10 w-auto" />
            </button>
          </div>

          {/* Centered Navigation */}
          <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center space-x-1 h-full">
              {navItems.map(item => {
                const isChildActive = item.children?.some(child => child.view === currentView);
                return item.children ? (
                    <NavDropdown key={item.name} item={item} currentView={currentView} setCurrentView={setCurrentView} className={dropdownLinkClasses(!!isChildActive)} />
                ) : (
                    <button
                        key={item.name}
                        onClick={() => item.view && setCurrentView(item.view)}
                        className={`h-16 inline-flex items-center px-3 text-sm font-semibold transition-colors ${navLinkClasses(currentView === item.view)}`}
                    >
                        {item.name}
                    </button>
                )
              })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-colors ${iconButtonClasses}`}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-indigo-400" />}
                </button>
                
                <div ref={accessibilityRef} className="relative">
                  <button
                      onClick={() => setIsAccessibilityMenuOpen(p => !p)}
                      className={`p-2 rounded-full transition-colors ${iconButtonClasses}`}
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
                            : iconButtonClasses
                    }`}
                    aria-label={isPhoneView ? "Switch to Desktop View" : "Switch to Phone View"}
                    title={isPhoneView ? "Switch to Desktop View" : "Switch to Phone View"}
                    >
                    <DevicePhoneMobileIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
            
            {currentUser ? (
              <>
                <div className="relative">
                    <button 
                      onClick={() => setIsNotificationPanelOpen(p => !p)}
                      className={`${iconButtonClasses} p-2 rounded-full transition-colors`}
                      aria-label={`View notifications (${unreadCount} unread)`}
                    >
                      <BellIcon className="w-6 h-6" />
                      {unreadCount > 0 && <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                </div>
                
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setIsProfileDropdownOpen(p => !p)} className="flex items-center space-x-2 cursor-pointer group rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green dark:focus:ring-brand-dark-green dark:focus:ring-offset-card-bg" aria-label="Open user menu" aria-haspopup="true" aria-expanded={isProfileDropdownOpen}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${currentUser?.role === 'Admin' ? 'bg-brand-dark-green' : 'bg-brand-green'} group-hover:opacity-80 transition-opacity`}>
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
                <Button variant={isTransparent ? 'outline' : 'ghost'} className={isTransparent ? '!text-white !border-white hover:!bg-white/10' : ''} size="sm" onClick={onSwitchToLogin} leftIcon={<LoginIcon className="w-5 h-5" />}>Login</Button>
                <Button variant="primary" size="sm" onClick={onRegister} leftIcon={<UserPlusIcon className="w-5 h-5" />}>Register</Button>
              </div>
            )}

            <div className="lg:hidden">
                <button onClick={() => setIsMobileMenuOpen(p => !p)} className={`p-2 rounded-md ${iconButtonClasses}`} aria-controls="mobile-menu" aria-expanded={isMobileMenuOpen}>
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6"/> : <Bars3Icon className="w-6 h-6"/>}
                </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isGuest ? (
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isGuest={true}
          onSwitchToLogin={() => {
            setIsMobileMenuOpen(false);
            onSwitchToLogin?.();
          }}
          onRegister={() => {
            setIsMobileMenuOpen(false);
            onRegister?.();
          }}
        />
      ) : (
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}
      

      {currentUser && <NotificationPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} setCurrentView={setCurrentView} />}
    </>
  );
};

export default Header;