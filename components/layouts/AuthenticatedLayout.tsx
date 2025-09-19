import React, { useState } from 'react';
import { ViewName } from '../../types.ts';
import Header from '../Header.tsx';
import HomeView from '../views/HomeView.tsx';
import DashboardView from '../views/DashboardView.tsx';
import TourismClustersView from '../views/TourismClustersView.tsx';
import { GrantApplicationsView } from '../views/GrantApplicationsView.tsx';
import EventsCalendarView from '../views/EventsCalendarView.tsx';
import UserManagementView from '../views/UserManagementView.tsx';
import SettingsView from '../views/SettingsView.tsx';
import ManageMyClustersView from '../views/ManageMyClustersView.tsx';
import WebsiteManagementView from '../views/WebsiteManagementView.tsx';
import TourismStatisticsView from '../views/TourismStatisticsView.tsx';
import { useAppContext } from '../AppContext.tsx';
import TourismMappingView from '../views/TourismMappingView.tsx';
import FeedbackManagementView from '../views/FeedbackManagementView.tsx';
import AIPlannerView from '../views/AIPlannerView.tsx';

interface AuthenticatedLayoutProps {
  handleLogout: () => void;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ handleLogout }) => {
  const { currentUser, isPhoneView } = useAppContext();
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.MainMenu);

  const renderView = () => {
    const userRole = currentUser?.role?.trim().toLowerCase();
    
    switch (currentView) {
      case ViewName.MainMenu: {
        return <HomeView setCurrentView={setCurrentView} />;
      }
      case ViewName.Dashboard: {
        return <DashboardView setCurrentView={setCurrentView} />;
      }
      case ViewName.AIPlanner: {
        return <AIPlannerView setCurrentView={setCurrentView} />;
      }
      case ViewName.TourismCluster: {
        return <TourismClustersView setCurrentView={setCurrentView} />;
      }
      case ViewName.TourismMapping: {
        return <TourismMappingView setCurrentView={setCurrentView} />;
      }
      case ViewName.ManageMyClusters: {
        if (userRole === 'tourism player' || userRole === 'admin' || userRole === 'editor') {
          return <ManageMyClustersView setCurrentView={setCurrentView} />;
        }
        return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
      }
      case ViewName.GrantApplications: {
        return <GrantApplicationsView />;
      }
      case ViewName.TourismStatistics: {
        return <TourismStatisticsView />;
      }
      case ViewName.EventsCalendar: {
        return <EventsCalendarView />;
      }
      case ViewName.UserManagement: {
        if (userRole === 'admin') {
            return <UserManagementView />;
        }
        return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
      }
      case ViewName.WebsiteManagement: {
        if (userRole === 'admin' || userRole === 'editor') {
            return <WebsiteManagementView />;
        }
        return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
      }
      case ViewName.SystemFeedback: {
        if (userRole === 'admin' || userRole === 'editor') {
          return <FeedbackManagementView />;
        }
        return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
      }
      case ViewName.Settings: {
        return <SettingsView />;
      }
      default: {
        return <HomeView setCurrentView={setCurrentView} />;
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-content-bg-light dark:bg-content-bg">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        handleLogout={handleLogout} 
      />
      <main className="pt-16">
        <div className={`transition-all duration-500 ease-in-out ${isPhoneView ? 'max-w-sm mx-auto my-4 border-4 border-neutral-400 dark:border-neutral-600 rounded-2xl shadow-2xl overflow-hidden' : ''}`}>
            <div className={currentView === ViewName.Dashboard ? '' : 'p-4 sm:p-6'}>
               {renderView()}
            </div>
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;