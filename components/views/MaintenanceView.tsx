import React from 'react';
import { LogoIcon, LoginIcon, LogoutIcon } from '../../constants.tsx';
import Button from '../ui/Button.tsx';

interface MaintenanceViewProps {
  message: string;
  onAdminLogin?: () => void;
  onLogout?: () => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ message, onAdminLogin, onLogout }) => (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-bg-light dark:bg-brand-bg p-4">
        <div className="flex flex-col items-center space-y-6 text-center">
            <LogoIcon className="h-24 w-auto" />
            <div>
                <h1 className="text-3xl font-bold text-brand-green-text dark:text-brand-dark-green-text">Under Maintenance</h1>
                <p className="mt-2 text-lg text-brand-text-secondary-light dark:text-brand-text-secondary max-w-lg">
                    {message || 'The website is currently down for maintenance. We will be back shortly.'}
                </p>
            </div>
            {onAdminLogin && (
                <div className="pt-4">
                    <Button 
                        variant="primary" 
                        onClick={onAdminLogin}
                        leftIcon={<LoginIcon className="w-5 h-5"/>}
                    >
                        Admin/Editor Login
                    </Button>
                </div>
            )}
            {onLogout && (
                <div className="pt-4">
                    <Button 
                        variant="secondary" 
                        onClick={onLogout}
                        leftIcon={<LogoutIcon className="w-5 h-5"/>}
                    >
                        Logout
                    </Button>
                </div>
            )}
        </div>
    </div>
);

export default MaintenanceView;
