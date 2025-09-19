

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Theme } from './types.ts';
import { AppProvider, useAppContext } from './components/AppContext.tsx';
import { ThemeContext } from './components/ThemeContext.tsx';
import { ToastProvider } from './components/ToastContext.tsx';
import { ToastContainer } from './components/ui/Toast.tsx';
import LoginView from './components/views/LoginView.tsx';
import GuestLayout from './components/layouts/GuestLayout.tsx';
import AuthenticatedLayout from './components/layouts/AuthenticatedLayout.tsx';
import { LogoIcon } from './constants.tsx';
import Spinner from './components/ui/Spinner.tsx';
import MaintenanceView from './components/views/MaintenanceView.tsx';
import { AccessibilityProvider } from './components/AccessibilityContext.tsx';

/**
 * A full-screen loader displayed during critical initialization phases.
 */
const FullScreenLoader: React.FC<{ message?: string }> = ({ message = "Initializing System..." }) => (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-bg-light dark:bg-brand-bg">
        <div className="flex flex-col items-center space-y-4 text-center">
            <LogoIcon className="h-24 w-auto animate-pulse" />
            <div>
                <h1 className="text-2xl font-bold text-brand-green-text dark:text-brand-dark-green-text">INTOURCAMS</h1>
                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                    Integrated Tourism Coordination and Monitoring System
                </p>
            </div>
            <Spinner className="w-8 h-8 text-brand-green dark:text-brand-dark-green-text" />
            <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">{message}</p>
        </div>
    </div>
);

/**
 * Renders the main content based on authentication, initialization, and maintenance states.
 * This component acts as a router, directing the user to the appropriate layout or view.
 */
const AppContent: React.FC = () => {
    const { 
        currentUser, 
        isInitializing, 
        isLoggingOut,
        logoutUser, 
        isAuthenticated,
        isMaintenanceMode,
        maintenanceMessage
    } = useAppContext();

    // State to control whether to show the GuestLayout or the LoginView for unauthenticated users.
    const [showGuestLayout, setShowGuestLayout] = useState(true);

    // Initial check for loading states. This is the highest priority.
    if (isInitializing) {
        return <FullScreenLoader message="Initializing System..." />;
    }
    
    if (isLoggingOut) {
        return <FullScreenLoader message="Logging out..." />;
    }

    // --- Maintenance Mode Flow ---
    if (isMaintenanceMode) {
        // Authenticated users (like admins) might be able to bypass maintenance.
        if (isAuthenticated && currentUser) {
            if (currentUser.role === 'Admin' || currentUser.role === 'Editor') {
                return <AuthenticatedLayout handleLogout={logoutUser} />;
            }
            // Other authenticated users see the maintenance page with a logout option.
            return <MaintenanceView message={maintenanceMessage} onLogout={logoutUser} />;
        }
        
        // Unauthenticated users see the maintenance page with an option to log in (for admins).
        // If they try to log in, we show the LoginView.
        if (!showGuestLayout) {
            return <LoginView onGuestAccess={() => setShowGuestLayout(true)} />;
        }
        return <MaintenanceView message={maintenanceMessage} onAdminLogin={() => setShowGuestLayout(false)} />;
    }

    // --- Normal Flow (Maintenance Mode OFF) ---
    if (isAuthenticated) {
        return <AuthenticatedLayout handleLogout={logoutUser} />;
    }
    
    // Unauthenticated flow: show either the guest-facing content or the login form.
    if (showGuestLayout) {
        return <GuestLayout onSwitchToLogin={() => setShowGuestLayout(false)} />;
    }
    
    return <LoginView onGuestAccess={() => setShowGuestLayout(true)} />;
};

/**
 * The root component of the application.
 * It sets up global providers for Toast notifications, application state (AppContext), and theming.
 */
const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  // Effect to apply the current theme to the root HTML element.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  // Memoized callback to prevent re-creation on every render.
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Memoized context value to prevent unnecessary re-renders of consumers.
  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ToastProvider>
      <AppProvider>
        <AccessibilityProvider>
          <ThemeContext.Provider value={themeContextValue}>
              <div className="font-sans bg-brand-bg-light dark:bg-brand-bg text-brand-text-light dark:text-brand-text">
                  <AppContent />
                  <ToastContainer />
              </div>
          </ThemeContext.Provider>
        </AccessibilityProvider>
      </AppProvider>
    </ToastProvider>
  );
};

export default App;