
import React, { useState, useRef, useEffect } from 'react';
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
import Footer from '../ui/Footer.tsx';

interface AuthenticatedLayoutProps {
  handleLogout: () => void;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ handleLogout }) => {
  const { currentUser, isPhoneView, logPageView } = useAppContext();
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.Dashboard);
  const mainScrollRef = useRef<HTMLElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionIdRef.current) {
        let sid = sessionStorage.getItem('app_session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            sessionStorage.setItem('app_session_id', sid);
        }
        sessionIdRef.current = sid;
    }
    if (sessionIdRef.current) {
        logPageView(currentView, sessionIdRef.current);
    }
  }, [currentView, logPageView]);


  const renderView = () => {
    const userRole = currentUser?.role?.trim().toLowerCase();
    
    switch (currentView) {
      case ViewName.MainMenu:
        return <HomeView setCurrentView={setCurrentView} />;
      case ViewName.Dashboard:
        return <DashboardView setCurrentView={setCurrentView} />;
      case ViewName.AIPlanner:
        return <AIPlannerView setCurrentView={setCurrentView} />;
      case ViewName.TourismCluster:
        return <TourismClustersView setCurrentView={setCurrentView} />;
      case ViewName.TourismMapping:
        return <TourismMappingView setCurrentView={setCurrentView} />;
      case ViewName.ManageMyClusters: {
        if (userRole === 'tourism player' || userRole === 'admin' || userRole === 'editor') {
          return <ManageMyClustersView setCurrentView={setCurrentView} />;
        }
        return <div className="text-center p-8"><h2 className="text-2xl font-semibold">Access Denied</h2><p>You do not have permission to view this page.</p></div>;
      }
      case ViewName.GrantApplications:
        return <GrantApplicationsView />;
      case ViewName.TourismStatistics:
        return <TourismStatisticsView />;
      case ViewName.EventsCalendar:
        return <EventsCalendarView />;
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
      case ViewName.Settings:
        return <SettingsView />;
      default:
        return <DashboardView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg-light dark:bg-brand-bg">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          handleLogout={handleLogout}
          scrollContainerRef={mainScrollRef}
        />
        <main ref={mainScrollRef} className="flex-1 overflow-x-hidden overflow-y-auto bg-content-bg-light dark:bg-content-bg custom-scrollbar pt-16">
          <div className={`transition-all duration-500 ease-in-out ${isPhoneView ? 'max-w-sm mx-auto my-4 border-4 border-neutral-400 dark:border-neutral-600 rounded-2xl shadow-2xl overflow-hidden' : ''}`}>
            <div className={currentView === ViewName.Dashboard ? 'mt-[-4rem]' : 'p-4 sm:p-6'}>
               {renderView()}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
