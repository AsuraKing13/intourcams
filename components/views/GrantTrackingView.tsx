
import React from 'react';
import Card from '../ui/Card.tsx';

const GrantTrackingView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Grant Tracking</h2>
        <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">This view is under construction.</p>
      </div>
      <Card>
        <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8">
            Detailed grant tracking features will be available here in a future update.
        </p>
      </Card>
    </div>
  );
};

export default GrantTrackingView;