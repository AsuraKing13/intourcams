
import React from 'react';
import { ViewName, NavItemType } from '../../types.ts';
import { NAV_ITEMS } from '../../constants.tsx';
import { useAppContext } from '../AppContext.tsx';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

interface HomeViewProps {
  setCurrentView: (view: ViewName) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setCurrentView }) => {
  const { currentUser } = useAppContext();

  // FIX: Corrected ViewName.Home to ViewName.MainMenu to match the enum definition.
  const menuItems: NavItemType[] = NAV_ITEMS.filter(item => 
    item.name !== ViewName.MainMenu && item.name !== ViewName.Settings
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">
          Welcome, {currentUser?.name || 'User'}!
        </h2>
        <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">
          Select a module to begin your journey with INTOURCAMS.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setCurrentView(item.name)}
            className="p-6 rounded-lg shadow-lg bg-card-bg-light dark:bg-card-bg border border-neutral-300-light dark:border-neutral-700-dark text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand-green dark:hover:border-brand-dark-green-text group"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-lg bg-neutral-200-light dark:bg-neutral-700-dark">
                <item.icon className="w-8 h-8 text-brand-green-text dark:text-brand-dark-green-text" />
              </div>
              <ChevronRightIcon className="w-6 h-6 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-brand-text-light dark:text-brand-text">
              {item.name}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeView;