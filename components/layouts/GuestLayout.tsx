import React, { useState } from 'react';
import { ViewName } from '../../types.ts';
import Header from '../Header.tsx';
import DashboardView from '../views/DashboardView.tsx';
import TourismClustersView from '../views/TourismClustersView.tsx';
import EventsCalendarView from '../views/EventsCalendarView.tsx';
import TourismStatisticsView from '../views/TourismStatisticsView.tsx';
import LoginPromptModal from '../ui/LoginPromptModal.tsx';
import LoginModal from '../auth/LoginModal.tsx';
import RegistrationModal from '../auth/RegistrationModal.tsx';
import GlobalNotificationBanner from '../ui/GlobalNotificationBanner.tsx';
import { useAppContext } from '../AppContext.tsx';
import TourismMappingView from '../views/TourismMappingView.tsx';
import AIPlannerView from '../views/AIPlannerView.tsx';

interface GuestLayoutProps {
  onSwitchToLogin: () => void;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ onSwitchToLogin }) => {
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.Dashboard);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const { notifications } = useAppContext();
  const [isBannerVisible, setIsBannerVisible] = useState(false);


  const handleAuthRequired = (message?: string) => {
    setLoginPromptMessage(message || '');
    setIsLoginPromptOpen(true);
  };

  const handlePromptLogin = () => {
    setIsLoginPromptOpen(false);
    setIsLoginModalOpen(true);
  };

  const handlePromptRegister = () => {
    setIsLoginPromptOpen(false);
    setIsRegistrationModalOpen(true);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewName.Dashboard:
        return <DashboardView setCurrentView={setCurrentView} onAuthRequired={handleAuthRequired} />;
      case ViewName.AIPlanner:
        return <AIPlannerView setCurrentView={setCurrentView} onAuthRequired={handleAuthRequired} />;
      case ViewName.TourismCluster:
        return <TourismClustersView setCurrentView={setCurrentView} />;
      case ViewName.TourismMapping:
        return <TourismMappingView setCurrentView={setCurrentView} />;
      case ViewName.TourismStatistics:
        return <TourismStatisticsView />;
      case ViewName.EventsCalendar:
        return <EventsCalendarView />;
      default:
        return <DashboardView setCurrentView={setCurrentView} onAuthRequired={handleAuthRequired} />;
    }
  };

  return (
    <>
      <div className="relative min-h-screen bg-content-bg-light dark:bg-content-bg">
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          isGuest={true} 
          onSwitchToLogin={() => setIsLoginModalOpen(true)}
          onRegister={() => setIsRegistrationModalOpen(true)}
        />
        <GlobalNotificationBanner notifications={notifications} onVisibilityChange={setIsBannerVisible} />
        <main className={`transition-all duration-300 ${isBannerVisible ? 'pt-[calc(4rem+2.75rem)]' : 'pt-16'}`}>
           <div className={currentView === ViewName.Dashboard ? '' : "p-4 sm:p-6"}>
                {renderView()}
            </div>
        </main>
      </div>
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
        onLogin={handlePromptLogin}
        onRegister={handlePromptRegister}
        message={loginPromptMessage}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />
    </>
  );
};

export default GuestLayout;