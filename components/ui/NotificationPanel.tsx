import React from 'react';
import { useAppContext } from '../AppContext.tsx';
import { Notification, ViewName } from '../../types.ts';
import Button from './Button.tsx';
import { XMarkIcon } from '../../constants.tsx';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentView: (view: ViewName) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, setCurrentView }) => {
  const { getNotificationsForCurrentUser, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications, currentUser } = useAppContext();
  
  if (!isOpen || !currentUser) return null;

  const userNotifications = getNotificationsForCurrentUser();
  const unreadCount = userNotifications.filter(n => !(n.read_by || []).includes(currentUser.id)).length;
  
  const canClearNotifications = userNotifications.length > 0;

  const buttonLabel = (currentUser.role === 'Admin' || currentUser.role === 'Editor')
    ? 'Clear All Notifications'
    : 'Clear Personal Notifications';


  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const handleNotificationClick = (notification: Notification) => {
    const isReadForCurrentUser = (notification.read_by || []).includes(currentUser.id);
    if (!isReadForCurrentUser) {
        markNotificationAsRead(notification);
    }
    // If it's a grant-related notification, redirect and close
    if (notification.related_application_id) {
        setCurrentView(ViewName.GrantApplications);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
      <div 
        className="absolute top-16 right-6 w-80 sm:w-96 max-h-[70vh] flex flex-col rounded-lg shadow-xl 
                   bg-card-bg-light dark:bg-card-bg 
                   border border-neutral-300-light dark:border-neutral-700-dark 
                   text-brand-text-light dark:text-brand-text animate-modalShow"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside panel
      >
        <div className="flex justify-between items-center p-3 border-b border-neutral-200-light dark:border-neutral-600-dark">
          <h3 className="text-md font-semibold text-brand-green-text dark:text-brand-dark-green-text">Notifications</h3>
          <button 
            onClick={onClose} 
            className="text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-green-text dark:hover:text-brand-dark-green-text"
            aria-label="Close notifications"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {userNotifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">No new notifications.</p>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
              {userNotifications.map(notification => {
                const isReadForCurrentUser = (notification.read_by || []).includes(currentUser.id);
                return (
                  <div 
                    key={notification.id} 
                    className={`p-2.5 rounded-md ${isReadForCurrentUser ? 'bg-opacity-50' : 'bg-neutral-100-light dark:bg-neutral-700-dark shadow-sm'} border border-transparent hover:border-brand-green dark:hover:border-brand-dark-green cursor-pointer transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                    role="listitem"
                    aria-busy={!isReadForCurrentUser ? "true" : "false"} // Indicates unread item
                  >
                    <p className={`text-sm ${isReadForCurrentUser ? 'text-brand-text-secondary-light dark:text-brand-text-secondary' : 'text-brand-text-light dark:text-brand-text'}`}>
                      {notification.message}
                    </p>
                    <p className={`text-xs mt-1 ${isReadForCurrentUser ? 'text-neutral-500-light dark:text-neutral-500-dark' : 'text-brand-green-text dark:text-brand-dark-green-text'}`}>
                      {timeAgo(notification.timestamp)}
                    </p>
                  </div>
                );
              })}
            </div>
            {(unreadCount > 0 || canClearNotifications) && (
              <div className="p-2 border-t border-neutral-200-light dark:border-neutral-600-dark flex flex-col gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="w-full">
                    Mark all as read
                  </Button>
                )}
                {canClearNotifications && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                  >
                    {buttonLabel}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;