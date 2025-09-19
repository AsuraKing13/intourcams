

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import Modal from '../ui/Modal.tsx';
import GrantApplicationForm from './GrantApplicationForm.tsx';
import { PlusIcon, SearchIcon, InfoIcon, GrantApplicationsIcon, DownloadIcon, XCircleIcon } from '../../constants.tsx'; 
import { useAppContext } from '../AppContext.tsx';
import { GrantApplication, GrantApplicationStatus, ReportFile } from '../../types.ts';
import GrantApplicationCard from '../ui/GrantApplicationCard.tsx';
import AdminReviewModal from './AdminReviewModal.tsx';
import StatusTimeline from '../ui/StatusTimeline.tsx';
import { useToast } from '../ToastContext.tsx';
import Spinner from '../ui/Spinner.tsx';
import Select from '../ui/Select.tsx';

interface GuidelineLink {
  url: string;
  title: string;
  description: string;
}

const GUIDELINE_LINKS: GuidelineLink[] = [
  {
    url: 'https://mtcp.sarawak.gov.my/web/subpage/webpage_view/250',
    title: 'Tourism Event Management Guideline',
    description: 'Specific Guideline for Tourism Event Management.'
  },
  {
    url: 'https://mtcp.sarawak.gov.my/web/subpage/webpage_view/249',
    title: 'Research & Development Fund Guideline',
    description: 'Specific Guideline for Research & Development Fund.'
  },
  {
    url: 'https://mtcp.sarawak.gov.my/web/subpage/webpage_view/252',
    title: 'Sarawak Heritage Facilitation Funds Guideline',
    description: 'Specific guidelines for the Sarawak Heritage Facilitation Funds.'
  },
  {
    url: 'https://mtcp.sarawak.gov.my/web/subpage/webpage_view/251',
    title: 'Filming, Videography & Documentary Fund Guideline',
    description: 'Specific guidelines for the Filming, Videography & Documentary Fund.'
  },
];

type FilterStatus = GrantApplicationStatus | 'All' | 'In Progress';
const FILTER_STATUSES: FilterStatus[] = ['All', 'In Progress', 'Pending', 'Conditional Offer', 'Early Report Required', 'Early Report Submitted', 'Final Report Required', 'Final Report Submitted', 'Complete', 'Rejected'];
const IN_PROGRESS_STATUSES: GrantApplicationStatus[] = ['Pending', 'Conditional Offer', 'Early Report Required', 'Early Report Submitted', 'Final Report Required', 'Final Report Submitted'];


export const GrantApplicationsView: React.FC = () => {
  const { 
    grantApplications, 
    isLoadingGrantApplications, 
    rejectPendingApplication,
    makeConditionalOffer,
    acceptConditionalOffer, 
    declineConditionalOffer,
    submitEarlyReport, 
    submitFinalReport, 
    approveEarlyReportAndDisburse,
    rejectEarlyReportSubmission,
    rejectFinalReportSubmission,
    completeGrantApplication,
    currentUser,
    isLoadingUsers,
    grantCategories,
    creativeCategories,
    createSignedUrl,
  } = useAppContext();
  const { showToast } = useToast();
  
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [selectedCategoryIdForForm, setSelectedCategoryIdForForm] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  
  const [selectedApplicationForDetails, setSelectedApplicationForDetails] = useState<GrantApplication | null>(null);
  const [applicationToReapply, setApplicationToReapply] = useState<GrantApplication | null>(null);
  const [isReapplyModalOpen, setIsReapplyModalOpen] = useState(false);
  const [applicationToReview, setApplicationToReview] = useState<GrantApplication | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const userRole = currentUser?.role?.trim()?.toLowerCase();
  const canManageAllApps = userRole === 'admin';

  useEffect(() => {
    const initialSearch = sessionStorage.getItem('initialGrantSearch');
    if (initialSearch) {
        setSearchTerm(initialSearch);
        sessionStorage.removeItem('initialGrantSearch');
    }
  }, []);

  const filteredApplications = useMemo(() => {
    if (!currentUser) return []; // Don't filter if user profile isn't loaded

    return grantApplications.filter(app => {
        if (!app) return false;
        
        if (!canManageAllApps && app.applicant_id !== currentUser.id) {
            return false;
        }
        
        const term = searchTerm.toLowerCase();

        const matchesStatus = () => {
            if (statusFilter === 'All') return true;
            if (statusFilter === 'In Progress') {
                return IN_PROGRESS_STATUSES.includes(app.status);
            }
            return app.status === statusFilter;
        };

        const matchesSearch = (app.project_name || '').toLowerCase().includes(term) || 
                              (app.id || '').toLowerCase().includes(term) ||
                              (app.organization_name || '').toLowerCase().includes(term);

        return matchesStatus() && matchesSearch;
    });
  }, [grantApplications, canManageAllApps, currentUser, searchTerm, statusFilter]);

  const openApplicationForm = (categoryId?: string, reapplyData?: GrantApplication) => {
    setSelectedCategoryIdForForm(categoryId || null);
    setApplicationToReapply(reapplyData || null);
    setIsApplicationModalOpen(true);
  };
  
  const handleReapply = (application: GrantApplication) => {
    setApplicationToReapply(application);
    setIsApplicationModalOpen(true);
  };
  
  const handleViewDetails = (application: GrantApplication) => {
    if (canManageAllApps && application.status === 'Pending') {
      setApplicationToReview(application);
    } else {
      setSelectedApplicationForDetails(application);
    }
  };
  
  const handleDownloadFile = async (file: ReportFile) => {
    setDownloadingFile(file.path);
    const bucket = file.path.includes('early-report') ? 'grant-early-report-files' : 'grant-final-report-files';
    const signedUrl = await createSignedUrl(bucket, file.path);
    if (signedUrl) {
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('download', file.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setDownloadingFile(null);
  };

  const renderFileLinks = (files: ReportFile[]) => (
    <ul className="list-disc list-inside space-y-1">
      {files.map(file => (
        <li key={file.path}>
          <button 
            onClick={() => handleDownloadFile(file)} 
            className="text-brand-green dark:text-brand-dark-green-text hover:underline inline-flex items-center gap-1"
            disabled={downloadingFile === file.path}
          >
            {downloadingFile === file.path ? <Spinner className="w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />}
            {file.file_name} ({new Date(file.submitted_at).toLocaleDateString()})
          </button>
        </li>
      ))}
    </ul>
  );

  if (isLoadingUsers) {
      return <div className="text-center py-10"><Spinner className="w-8 h-8 mx-auto" /><p className="mt-2">Loading user profile...</p></div>;
  }

  // This is a critical check. If the user is logged in but their profile data couldn't be found in the users table,
  // we cannot determine their permissions. We must stop and show an error.
  if (!currentUser) {
      return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Grant Applications</h2>
            <Card>
                <div className="text-center py-12">
                    <XCircleIcon className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" />
                    <h3 className="mt-2 text-lg font-semibold text-red-600 dark:text-red-500">User Profile Error</h3>
                    <p className="mt-1 text-brand-text-secondary-light dark:text-brand-text-secondary">
                        Your user profile could not be loaded, which is required to view applications. This can happen if your profile is not correctly configured in the system.
                    </p>
                     <p className="mt-2 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                        Please try logging out and back in. If the problem persists, contact system support.
                    </p>
                </div>
            </Card>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Grant Applications</h2>
          <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">
            {canManageAllApps ? 'Review and manage all grant applications.' : 'Track your grant application submissions.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsGuidelinesModalOpen(true)} leftIcon={<InfoIcon className="w-5 h-5"/>}>
            View Guidelines
          </Button>
          <Button variant="primary" onClick={() => openApplicationForm()} leftIcon={<PlusIcon className="w-5 h-5"/>}>
            New Application
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by project, organization or ID..."
            icon={<SearchIcon className="w-5 h-5"/>}
            className="flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select 
            options={FILTER_STATUSES.map(s => ({ value: s, label: s }))}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="min-w-[200px]"
          />
        </div>
      </Card>

      {isLoadingGrantApplications ? (
        <div className="text-center py-10"><Spinner className="w-8 h-8 mx-auto" /><p className="mt-2">Loading applications...</p></div>
      ) : filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map(app => (
            <GrantApplicationCard
              key={app.id}
              application={app}
              isAdmin={canManageAllApps}
              isApplicant={app.applicant_id === currentUser?.id}
              onAcceptOffer={acceptConditionalOffer}
              onDeclineOffer={declineConditionalOffer}
              onSubmitEarlyReport={submitEarlyReport}
              onSubmitFinalReport={submitFinalReport}
              onApproveEarlyReport={approveEarlyReportAndDisburse}
              onRejectEarlyReport={rejectEarlyReportSubmission}
              onRejectFinalReport={rejectFinalReportSubmission}
              onCompleteApplication={completeGrantApplication}
              onViewDetails={handleViewDetails}
              onReapply={handleReapply}
            />
          ))}
        </div>
      ) : (
        <Card>
            <div className="text-center py-12">
                <GrantApplicationsIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
                <h3 className="mt-2 text-sm font-semibold text-brand-text-light dark:text-brand-text">No Applications Found</h3>
                <p className="mt-1 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                    {grantApplications.length === 0 ? "There are no applications yet." : "No applications match your current filters."}
                </p>
            </div>
        </Card>
      )}

      <Modal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        title={applicationToReapply ? 'Re-apply for Grant' : 'New Grant Application'}
        size="2xl"
      >
        <GrantApplicationForm 
            onClose={() => setIsApplicationModalOpen(false)} 
            initialGrantCategoryId={selectedCategoryIdForForm}
            initialData={applicationToReapply || undefined}
        />
      </Modal>

      <Modal
        isOpen={isGuidelinesModalOpen}
        onClose={() => setIsGuidelinesModalOpen(false)}
        title="Grant Program Guidelines"
        size="lg"
      >
        <div className="space-y-4">
          {GUIDELINE_LINKS.map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <h4 className="font-semibold text-brand-green dark:text-brand-dark-green-text">{link.title}</h4>
              <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">{link.description}</p>
            </a>
          ))}
        </div>
      </Modal>
      
      {selectedApplicationForDetails && (
          <Modal 
              isOpen={!!selectedApplicationForDetails} 
              onClose={() => setSelectedApplicationForDetails(null)} 
              title={`Details for: ${selectedApplicationForDetails.project_name}`}
              size="xl"
          >
              <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-brand-green-text dark:text-brand-dark-green-text">Status History</h4>
                    <StatusTimeline history={selectedApplicationForDetails.status_history} />
                  </div>
                  {selectedApplicationForDetails.early_report_files.length > 0 && (
                      <div>
                          <h4 className="font-semibold mb-2 text-brand-green-text dark:text-brand-dark-green-text">Early Report Submissions</h4>
                          {renderFileLinks(selectedApplicationForDetails.early_report_files)}
                      </div>
                  )}
                  {selectedApplicationForDetails.final_report_files.length > 0 && (
                      <div>
                          <h4 className="font-semibold mb-2 text-brand-green-text dark:text-brand-dark-green-text">Final Report Submissions</h4>
                          {renderFileLinks(selectedApplicationForDetails.final_report_files)}
                      </div>
                  )}
              </div>
          </Modal>
      )}

      {applicationToReview && (
          <AdminReviewModal
              isOpen={!!applicationToReview}
              onClose={() => setApplicationToReview(null)}
              application={applicationToReview}
              onReject={rejectPendingApplication}
              onMakeOffer={makeConditionalOffer}
          />
      )}
    </div>
  );
};

export default React.memo(GrantApplicationsView);
