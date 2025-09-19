

import React, { useState } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import { UserCircleIcon, ShieldCheckIcon, BellAlertIcon, PaintBrushIcon, ArrowDownTrayIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import ProfileSettings from '../ui/ProfileSettings.tsx';
import FeedbackSettings from '../ui/FeedbackSettings.tsx';

type ActiveSetting = 'profile' | 'security' | 'notifications' | 'appearance' | 'data' | 'feedback' | null;

const SettingsView: React.FC = () => {
  const [activeSetting, setActiveSetting] = useState<ActiveSetting>('profile');

  const renderActiveSetting = () => {
    switch (activeSetting) {
      case 'profile':
        return <ProfileSettings />;
      case 'feedback':
        return <FeedbackSettings />;
      case 'security':
      case 'notifications':
      case 'appearance':
      case 'data':
        return (
          <Card title="Under Construction">
            <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8">
              This settings section will be available in a future update.
            </p>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Settings</h2>
        <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Manage your account, preferences, and application settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar for settings navigation */}
        <div className="lg:col-span-1 space-y-2">
            <Button
                variant={activeSetting === 'profile' ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => setActiveSetting('profile')}
                leftIcon={<UserCircleIcon className="w-5 h-5" />}
            >
                Profile
            </Button>
            <Button
                variant={activeSetting === 'security' ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => setActiveSetting('security')}
                leftIcon={<ShieldCheckIcon className="w-5 h-5" />}
            >
                Security
            </Button>
             <Button
                variant={activeSetting === 'feedback' ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => setActiveSetting('feedback')}
                leftIcon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5" />}
            >
                System Feedback
            </Button>
            <Button
                variant={activeSetting === 'notifications' ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => setActiveSetting('notifications')}
                leftIcon={<BellAlertIcon className="w-5 h-5" />}
            >
                Notifications
            </Button>
            <Button
                variant={activeSetting === 'appearance' ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => setActiveSetting('appearance')}
                leftIcon={<PaintBrushIcon className="w-5 h-5" />}
            >
                Appearance
            </Button>
            <Button
                variant={activeSetting === 'data' ? 'primary' : 'secondary'}
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => setActiveSetting('data')}
                leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
            >
                Data Download
            </Button>
        </div>

        {/* Content area for the active setting */}
        <div className="lg:col-span-3">
          {renderActiveSetting()}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsView);