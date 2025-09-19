

import React from 'react';
import { StatusHistoryEntry, GrantApplicationStatus } from '../../types.ts';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperClipIcon,
  ArrowDownCircleIcon,
  ArrowPathIcon,
} from '../../constants.tsx';

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

const getIconForStatus = (status: GrantApplicationStatus): { icon: React.FC<{ className?: string }>, color: string } => {
  switch (status) {
    case 'Pending':
      return { icon: ClockIcon, color: 'text-yellow-500 dark:text-yellow-400' };
    case 'Conditional Offer':
    case 'Approved':
    case 'Complete':
      return { icon: CheckCircleIcon, color: 'text-green-500 dark:text-green-400' };
    case 'Rejected':
      return { icon: XCircleIcon, color: 'text-red-500 dark:text-red-400' };
    case 'Early Report Submitted':
    case 'Final Report Submitted':
      return { icon: PaperClipIcon, color: 'text-blue-500 dark:text-blue-400' };
    case 'Early Report Required':
    case 'Final Report Required':
      return { icon: ArrowDownCircleIcon, color: 'text-blue-500 dark:text-blue-400' };
    default:
      return { icon: ArrowPathIcon, color: 'text-brand-text-secondary-light dark:text-brand-text-secondary' };
  }
};

const formatDate = (timestamp: string) => new Date(timestamp).toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const StatusTimeline: React.FC<StatusTimelineProps> = ({ history }) => {
  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <ol className="relative border-l-2 border-neutral-200 dark:border-neutral-700">
      {sortedHistory.map((entry, index) => {
        const { icon: Icon, color } = getIconForStatus(entry.status);
        return (
          <li key={index} className="mb-6 ml-6">
            <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white dark:ring-card-bg bg-card-bg-light dark:bg-card-bg`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </span>
            <div className="ml-2">
              <h3 className="flex items-center mb-1 text-base font-semibold text-brand-text-light dark:text-brand-text">
                {entry.status}
                {index === 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-3">
                    Latest
                  </span>
                )}
              </h3>
              <time className="block mb-2 text-sm font-normal leading-none text-brand-text-secondary-light dark:text-brand-text-secondary">
                {formatDate(entry.timestamp)} by {entry.changed_by}
              </time>
              {entry.notes && (
                <p className="text-sm font-normal text-brand-text-secondary-light dark:text-brand-text-secondary bg-neutral-100-light dark:bg-neutral-700-dark p-2 rounded-md">
                  {entry.notes}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default StatusTimeline;