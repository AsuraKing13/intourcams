

import React, { useState, useEffect } from 'react';
import { GrantApplication, GrantApplicationStatus, ReportFile, StatusHistoryEntry } from '../../types.ts';
import Card from './Card.tsx';
import Button from './Button.tsx';
import Input from './Input.tsx';
import FileUpload from './FileUpload.tsx';
import { EyeIcon } from '../../constants.tsx';
import { useToast } from '../ToastContext.tsx';

const MAX_SUBMISSIONS = 3;

interface GrantApplicationCardProps {
  application: GrantApplication;
  onAcceptOffer: (appId: string) => Promise<boolean>;
  onDeclineOffer: (appId: string) => Promise<boolean>;
  onSubmitEarlyReport: (appId: string, file: File) => Promise<void>;
  onSubmitFinalReport: (appId: string, file: File) => Promise<void>;
  onApproveEarlyReport: (appId: string, amount: number, notes: string) => Promise<void>;
  onRejectEarlyReport: (appId: string, notes: string) => Promise<void>;
  onRejectFinalReport: (appId: string, notes: string) => Promise<void>;
  onCompleteApplication: (appId: string, amount: number, notes: string) => void;
  isAdmin: boolean;
  isApplicant: boolean;
  onViewDetails: (application: GrantApplication) => void;
  onReapply: (application: GrantApplication) => void; 
}

const GrantApplicationCard: React.FC<GrantApplicationCardProps> = ({ 
    application, 
    onAcceptOffer,
    onDeclineOffer,
    onSubmitEarlyReport,
    onSubmitFinalReport,
    onApproveEarlyReport,
    onRejectEarlyReport,
    onRejectFinalReport,
    onCompleteApplication,
    isAdmin, 
    isApplicant,
    onViewDetails,
    onReapply
}) => {
  const { showToast } = useToast();
  const [adminNotes, setAdminNotes] = useState('');
  const [disbursementAmount, setDisbursementAmount] = useState('');
  const [finalDisbursementAmount, setFinalDisbursementAmount] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset local state when the application data changes to avoid carrying over old data
    setSelectedFile(null);
    setIsProcessing(false);
    setAdminNotes('');
    
    // Pre-fill disbursement amounts if applicable
    if (application.status === 'Early Report Submitted' && application.amount_approved) {
        setDisbursementAmount((application.amount_approved * 0.8).toFixed(2));
    } else {
        setDisbursementAmount('');
    }

    if (application.status === 'Final Report Submitted' && application.amount_approved && application.initial_disbursement_amount) {
        const remainingAmount = application.amount_approved - application.initial_disbursement_amount;
        setFinalDisbursementAmount(remainingAmount > 0 ? remainingAmount.toFixed(2) : '0.00');
    } else {
        setFinalDisbursementAmount('');
    }

  }, [application]);

  const getStatusColor = (status: GrantApplication['status']) => {
    switch (status) {
      case 'Approved':
      case 'Complete':
      case 'Early Report Submitted':
      case 'Final Report Submitted':
        return 'text-green-500 dark:text-green-400';
      case 'Rejected': 
        return 'text-red-500 dark:text-red-400';
      case 'Pending':
      case 'Conditional Offer':
      case 'Early Report Required':
      case 'Final Report Required':
        return 'text-yellow-500 dark:text-yellow-400';
      default: 
        return 'text-brand-text-secondary-light dark:text-brand-text-secondary';
    }
  };
  
  const formatDate = (timestamp: string | number) => new Date(timestamp).toLocaleString();

  const handleUploadAndSubmit = async (submitAction: (appId: string, file: File) => Promise<void>) => {
    if (!selectedFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await submitAction(application.id, selectedFile);
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAcceptOffer = async () => {
    setIsProcessing(true);
    try {
        await onAcceptOffer(application.id);
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDeclineOffer = async () => {
    setIsProcessing(true);
    try {
        await onDeclineOffer(application.id);
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
        setIsProcessing(false);
    }
  };

  const handleApproveEarlyReport = async () => {
    const amount = parseFloat(disbursementAmount);
    if (isNaN(amount) || amount <= 0) {
        showToast("Please enter a valid disbursement amount.", 'error');
        return;
    }
    if (application.amount_approved && amount > application.amount_approved) {
        showToast("Disbursement amount cannot be greater than the total approved amount.", 'error');
        return;
    }
    setIsProcessing(true);
    try {
        await onApproveEarlyReport(application.id, amount, adminNotes || "Early report approved.");
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRejectEarlyReport = async () => {
    if (!adminNotes) {
        showToast("Please provide rejection notes for the applicant.", 'error');
        return;
    }
    setIsProcessing(true);
    try {
        await onRejectEarlyReport(application.id, adminNotes);
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleRejectFinalReport = async () => {
    if (!adminNotes) {
        showToast("Please provide rejection notes for the applicant.", 'error');
        return;
    }
    setIsProcessing(true);
    try {
        await onRejectFinalReport(application.id, adminNotes);
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCompleteApplication = async () => {
    const amount = parseFloat(finalDisbursementAmount);
    if (isNaN(amount) || amount < 0) {
        showToast("Please enter a valid final disbursement amount.", 'error');
        return;
    }

    if (application.amount_approved && application.initial_disbursement_amount) {
        const totalDisbursed = application.initial_disbursement_amount + amount;
        if (totalDisbursed > application.amount_approved + 0.01) { // Add a small epsilon for float issues
             showToast(`Total disbursement (RM ${totalDisbursed.toLocaleString()}) cannot exceed the total approved amount (RM ${application.amount_approved.toLocaleString()}).`, 'error');
             return;
        }
    }

    setIsProcessing(true);
    try {
      await onCompleteApplication(application.id, amount, adminNotes || 'Grant completed successfully.');
    } catch (e) {
      // The error is already shown via toast in the context.
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFileUpload = () => {
    if (!isApplicant) return null;

    const isEarlyReportStage = application.status === 'Early Report Required';
    const isFinalReportStage = application.status === 'Final Report Required';

    if (!isEarlyReportStage && !isFinalReportStage) return null;

    if (isEarlyReportStage) {
      const rejectionCount = application.early_report_rejection_count || 0;
      const isUploadDisabled = isProcessing || rejectionCount >= MAX_SUBMISSIONS;
      return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary">Please upload your Early Report *</label>
            <FileUpload onFileSelect={setSelectedFile} disabled={isUploadDisabled} />
            {rejectionCount >= MAX_SUBMISSIONS ? (
                <p className="text-xs text-red-500 mt-1">You have reached the maximum of {MAX_SUBMISSIONS} report rejections. This application is now closed.</p>
            ) : (
                rejectionCount > 0 && <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">You have {MAX_SUBMISSIONS - rejectionCount} submission attempt(s) remaining.</p>
            )}
        </div>
      );
    }

    if (isFinalReportStage) {
        const rejectionCount = application.final_report_rejection_count || 0;
        const isUploadDisabled = isProcessing || rejectionCount >= MAX_SUBMISSIONS;
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary">Please upload your Final Report *</label>
                <FileUpload onFileSelect={setSelectedFile} disabled={isUploadDisabled} />
                {rejectionCount >= MAX_SUBMISSIONS ? (
                    <p className="text-xs text-red-500 mt-1">You have reached the maximum of {MAX_SUBMISSIONS} final report rejections for this application.</p>
                ) : (
                    rejectionCount > 0 && <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">You have {MAX_SUBMISSIONS - rejectionCount} submission attempt(s) remaining.</p>
                )}
            </div>
        );
    }
    
    return null;
  };

  const reportSubmissionAction = () => {
    const isEarlyReportStage = application.status === 'Early Report Required';
    const isFinalReportStage = application.status === 'Final Report Required';
    
    if (!isApplicant || (!isEarlyReportStage && !isFinalReportStage)) return null;

    if (isEarlyReportStage && (application.early_report_rejection_count || 0) >= MAX_SUBMISSIONS) return null;
    if (isFinalReportStage && (application.final_report_rejection_count || 0) >= MAX_SUBMISSIONS) return null;
    
    return (
        <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleUploadAndSubmit(isEarlyReportStage ? onSubmitEarlyReport : onSubmitFinalReport)} 
            disabled={!selectedFile || isProcessing} 
            isLoading={isProcessing}
        >
            {isEarlyReportStage ? 'Submit Early Report' : 'Upload Final Report'}
        </Button>
    );
  };

  const isReviewable = isAdmin && application.status === 'Pending';

  return (
    <Card className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="md:col-span-2">
          <span className="font-semibold text-brand-text-light dark:text-brand-text">{application.project_name}</span>
        </div>
        <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">ID:</span> {application.id}</div>
        <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Organization:</span> {application.organization_name}</div>
        <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Amount Requested:</span> RM {application.amount_requested.toLocaleString()}</div>
        {application.amount_approved != null && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Amount Approved:</span> RM {application.amount_approved.toLocaleString()}</div>}
        {application.initial_disbursement_amount != null && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Initial Disbursement:</span> RM {application.initial_disbursement_amount.toLocaleString()}</div>}
        {application.final_disbursement_amount != null && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Final Disbursement:</span> RM {application.final_disbursement_amount.toLocaleString()}</div>}
        {application.resubmission_count > 0 && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Resubmissions:</span> {application.resubmission_count}</div>}
        {application.early_report_rejection_count != null && application.early_report_rejection_count > 0 && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Early Report Rejections:</span> {application.early_report_rejection_count}</div>}
        {application.final_report_rejection_count != null && application.final_report_rejection_count > 0 && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Final Report Rejections:</span> {application.final_report_rejection_count}</div>}
        {application.resubmitted_from_id && <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Re-submission for:</span> {application.resubmitted_from_id}</div>}
        <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Submitted:</span> {formatDate(application.submission_timestamp)}</div>
        <div><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Last Update:</span> {formatDate(application.last_update_timestamp)}</div>
        <div className="md:col-span-2"><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Status:</span> <span className={`font-bold ${getStatusColor(application.status)}`}>{application.status}</span></div>
        {application.notes && <div className="md:col-span-2"><span className="text-brand-text-secondary-light dark:text-brand-text-secondary">Notes:</span> {application.notes}</div>}
      </div>
      
      {/* --- ACTION FOOTER --- */}
      <div className="mt-3 pt-3 border-t border-neutral-200-light dark:border-neutral-700-dark space-y-3">
        
        {/* ---- CONDITIONAL COMPLEX UI (Inputs/Uploads) ---- */}
        {/* Admin UI for Early Report Review */}
        {isAdmin && application.status === 'Early Report Submitted' && (
            <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input type="number" label="Disbursement Amount (RM)" placeholder="Default: 80%" value={disbursementAmount} onChange={(e) => setDisbursementAmount(e.target.value)} className="text-sm p-1.5" wrapperClassName="flex-grow" disabled={isProcessing}/>
                    <Input 
                        type="text" 
                        label="Notes for applicant" 
                        placeholder="Reason for rejection or approval..." 
                        value={adminNotes} 
                        onChange={(e) => setAdminNotes(e.target.value)} 
                        className="text-sm p-1.5" 
                        wrapperClassName='flex-grow'
                        disabled={isProcessing}
                    />
                </div>
            </div>
        )}

        {/* Admin UI for Final Report Review */}
        {isAdmin && application.status === 'Final Report Submitted' && (
            <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input 
                        type="number" 
                        label="Final Disbursement (RM)" 
                        placeholder="Default: Remainder" 
                        value={finalDisbursementAmount} 
                        onChange={(e) => setFinalDisbursementAmount(e.target.value)} 
                        className="text-sm p-1.5" 
                        wrapperClassName="flex-grow" 
                        disabled={isProcessing}
                    />
                    <Input 
                        type="text" 
                        label="Notes for applicant" 
                        placeholder="Reason for rejection or completion..." 
                        value={adminNotes} 
                        onChange={(e) => setAdminNotes(e.target.value)} 
                        className="text-sm p-1.5" 
                        wrapperClassName='flex-grow'
                        disabled={isProcessing}
                    />
                </div>
            </div>
        )}

        {/* Applicant file upload UI */}
        {renderFileUpload()}
        
        {/* ---- MAIN ACTION BUTTONS BAR ---- */}
        <div className="flex justify-end items-center gap-2 flex-wrap">

            {/* Admin Actions */}
            {isAdmin && application.status === 'Early Report Submitted' && (
                <>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" isLoading={isProcessing} onClick={handleRejectEarlyReport}>Reject Report</Button>
                    <Button variant="primary" size="sm" onClick={handleApproveEarlyReport} isLoading={isProcessing}>Approve & Disburse</Button>
                </>
            )}
            {isAdmin && application.status === 'Final Report Submitted' && (
                <>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" isLoading={isProcessing} onClick={handleRejectFinalReport}>Reject Report</Button>
                    <Button variant="primary" size="sm" isLoading={isProcessing} onClick={handleCompleteApplication}>Approve & Complete</Button>
                </>
            )}

            {/* Applicant Actions */}
            {isApplicant && application.status === 'Conditional Offer' && (
                 <>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" isLoading={isProcessing} onClick={handleDeclineOffer}>Decline Offer</Button>
                    <Button variant="primary" size="sm" onClick={handleAcceptOffer} isLoading={isProcessing}>
                        Accept Offer
                    </Button>
                 </>
            )}
            
            {reportSubmissionAction()}

            {isApplicant && application.status === 'Rejected' && (
                <Button variant="primary" size="sm" isLoading={isProcessing} onClick={() => onReapply(application)}>Reapply</Button>
            )}

            {/* Always visible View Details button */}
            <Button variant="secondary" size="sm" onClick={() => onViewDetails(application)} leftIcon={<EyeIcon className="w-4 h-4"/>}>
                {isReviewable ? 'Review Application' : 'View Details'}
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default GrantApplicationCard;