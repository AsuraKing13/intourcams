
import React from 'react';
import Modal from './Modal.tsx';
import { Cluster, AppEvent, GrantApplication } from '../../types.ts';
import { TourismClusterIcon, EventsCalendarIcon, ChevronRightIcon, GrantApplicationsIcon } from '../../constants.tsx';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  results: {
    clusters: Cluster[];
    events: AppEvent[];
    grants: GrantApplication[];
  };
  onResultClick: (item: Cluster | AppEvent | GrantApplication, type: 'cluster' | 'event' | 'grant') => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ isOpen, onClose, query, results, onResultClick }) => {
    const hasResults = results.clusters.length > 0 || results.events.length > 0 || results.grants.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Search Results for "${query}"`} size="lg">
            <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {!hasResults ? (
                    <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8">
                        No results found. Try a different search term.
                    </p>
                ) : (
                    <>
                        {/* Clusters Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-brand-green-text dark:text-brand-dark-green-text mb-2 border-b border-neutral-200-light dark:border-neutral-700-dark pb-2">
                                Tourism Clusters ({results.clusters.length})
                            </h3>
                            {results.clusters.length > 0 ? (
                                <ul className="space-y-2">
                                    {results.clusters.map(cluster => (
                                        <li key={cluster.id}>
                                            <button 
                                                onClick={() => onResultClick(cluster, 'cluster')}
                                                className="w-full text-left p-3 rounded-md flex items-center justify-between hover:bg-neutral-100-light dark:hover:bg-neutral-800-dark transition-colors group"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <TourismClusterIcon className="w-6 h-6 text-brand-green dark:text-brand-dark-green-text flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold text-brand-text-light dark:text-brand-text">{cluster.name}</p>
                                                        <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">{cluster.category.join(', ')}</p>
                                                    </div>
                                                </div>
                                                <ChevronRightIcon className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary pl-3">No matching clusters found.</p>
                            )}
                        </div>

                        {/* Events Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-brand-green-text dark:text-brand-dark-green-text mb-2 border-b border-neutral-200-light dark:border-neutral-700-dark pb-2">
                                Events ({results.events.length})
                            </h3>
                             {results.events.length > 0 ? (
                                <ul className="space-y-2">
                                    {results.events.map(event => (
                                        <li key={event.id}>
                                            <button 
                                                onClick={() => onResultClick(event, 'event')}
                                                className="w-full text-left p-3 rounded-md flex items-center justify-between hover:bg-neutral-100-light dark:hover:bg-neutral-800-dark transition-colors group"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <EventsCalendarIcon className="w-6 h-6 text-brand-green dark:text-brand-dark-green-text flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold text-brand-text-light dark:text-brand-text">{event.title}</p>
                                                        <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">{new Date(event.start_date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <ChevronRightIcon className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary pl-3">No matching events found.</p>
                            )}
                        </div>

                        {/* Grants Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-brand-green-text dark:text-brand-dark-green-text mb-2 border-b border-neutral-200-light dark:border-neutral-700-dark pb-2">
                                Grant Applications ({results.grants.length})
                            </h3>
                             {results.grants.length > 0 ? (
                                <ul className="space-y-2">
                                    {results.grants.map(grant => (
                                        <li key={grant.id}>
                                            <button 
                                                onClick={() => onResultClick(grant, 'grant')}
                                                className="w-full text-left p-3 rounded-md flex items-center justify-between hover:bg-neutral-100-light dark:hover:bg-neutral-800-dark transition-colors group"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <GrantApplicationsIcon className="w-6 h-6 text-brand-green dark:text-brand-dark-green-text flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold text-brand-text-light dark:text-brand-text">{grant.project_name}</p>
                                                        <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">{grant.organization_name}</p>
                                                    </div>
                                                </div>
                                                <ChevronRightIcon className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary pl-3">No matching grants found.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SearchResultsModal;
