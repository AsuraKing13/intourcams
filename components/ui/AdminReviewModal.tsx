import React, { useState, useEffect } from 'react';
import { GrantApplication } from '../../types.ts';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import Input from './Input.tsx';
import { useToast } from '../ToastContext.tsx';
import { useAppContext } from '../AppContext.tsx';

interface AdminReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: GrantApplication;
  onReject: (appId: string, notes: string) => Promise<void>;
  onMakeOffer: (appId: string, notes:string, amount: number) => Promise<void>;
}

const AdminReviewModal: React.FC<AdminReviewModalProps> = ({ isOpen, onClose, application, onReject, onMakeOffer }) => {
  const { showToast } = useToast();
  const { grantCategories, creativeCategories } = useAppContext();
  
  const [decision, setDecision] = useState<'reject' | 'offer'>('offer');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset state when a new application is passed in
    if (application) {
      setDecision('offer');
      setNotes('');
      setAmount(application.amount_requested.toString()); // Pre-fill with requested amount as a suggestion
      setIsProcessing(false);
    }
  }, [application]);

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      if (decision === 'reject') {
        if (!notes.trim()) {
          showToast('Rejection notes are mandatory.', 'error');
          setIsProcessing(false);
          return;
        }
        await onReject(application.id, notes);
        showToast('Application rejected successfully.', 'success');
      } else { // decision === 'offer'
        const offerAmount = parseFloat(amount);
        if (isNaN(offerAmount) || offerAmount <= 0) {
          showToast('Please enter a valid, positive offer amount.', 'error');
          setIsProcessing(false);
          return;
        }
        await onMakeOffer(application.id, notes || 'Please review your conditional offer.', offerAmount);
        showToast('Conditional offer sent successfully.', 'success');
      }
      onClose();
    } catch (e) {
      // Error toast is likely shown in the context function, but we can log here too.
      console.error("Failed to process decision:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const getGrantCategoryName = (id: string | null) => grantCategories.find(cat => cat.id === id)?.name || 'N/A';
  const getPrimaryCreativeCategoryName = (id: string | null) => creativeCategories.find(cat => cat.id === id)?.name || 'N/A';
  const getCreativeSubCategoryName = (primaryId: string | null, subId: string | null) => {
    if (!primaryId || !subId) return 'N/A';
    const primaryCat = creativeCategories.find(cat => cat.id === primaryId);
    return primaryCat?.subcategories.find(sub => sub.id === subId)?.name || 'N/A';
  };
  const formatDate = (timestamp: string | number) => new Date(timestamp).toLocaleString();

  const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    value ? <div><strong className="font-medium text-brand-text-secondary-light dark:text-brand-text-secondary">{label}:</strong> {value}</div> : null
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review Application: ${application.project_name}`} size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Application Details */}
        <div className="space-y-3 text-sm pr-4 border-r-0 lg:border-r border-neutral-200-light dark:border-neutral-700-dark">
          <h4 className="text-lg font-semibold text-brand-green-text dark:text-brand-dark-green-text">Application Details</h4>
          
          <div className="space-y-1">
            <DetailItem label="Applicant" value={application.organization_name} />
            <DetailItem label="Contact Email" value={application.email} />
            <DetailItem label="Contact Number" value={application.contact_number} />
            <DetailItem label="Status" value={application.status} />
            {application.resubmission_count > 0 && <DetailItem label="Resubmission Count" value={application.resubmission_count} />}
            {application.resubmitted_from_id && <DetailItem label="Resubmission of" value={application.resubmitted_from_id} />}
          </div>
          
          <div className="space-y-1 pt-2 border-t border-neutral-200-light dark:border-neutral-700-dark">
            <DetailItem label="Grant Category" value={getGrantCategoryName(application.grant_category_id)} />
            <DetailItem label="Creative Category" value={getPrimaryCreativeCategoryName(application.primary_creative_category_id)} />
            <DetailItem label="Subcategory" value={getCreativeSubCategoryName(application.primary_creative_category_id, application.creative_sub_category_id)} />
          </div>

          <div className="space-y-1 pt-2 border-t border-neutral-200-light dark:border-neutral-700-dark">
             <DetailItem label="Start Date" value={formatDate(application.program_start_date)} />
             <DetailItem label="End Date" value={formatDate(application.end_date)} />
             <DetailItem label="Amount Requested" value={`RM ${application.amount_requested.toLocaleString()}`} />
          </div>
          
           <div className="pt-2 border-t border-neutral-200-light dark:border-neutral-700-dark">
            <strong className="font-medium text-brand-text-secondary-light dark:text-brand-text-secondary">Project Description:</strong>
            <p className="mt-1 text-brand-text-light dark:text-brand-text">{application.project_description}</p>
          </div>
        </div>

        {/* Right Column: Decision Panel */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-brand-green-text dark:text-brand-dark-green-text">Admin Decision</h4>
          
          {/* Decision Type Radio */}
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="decision" value="offer" checked={decision === 'offer'} onChange={() => setDecision('offer')} className="form-radio text-brand-green dark:text-brand-dark-green-text focus:ring-brand-green dark:focus:ring-brand-dark-green-text" />
              <span>Make Conditional Offer</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="decision" value="reject" checked={decision === 'reject'} onChange={() => setDecision('reject')} className="form-radio text-red-500 focus:ring-red-500" />
              <span>Reject Application</span>
            </label>
          </div>
          
          {/* Conditional Inputs */}
          <div className="animate-modalShow">
            {decision === 'offer' && (
              <Input 
                label="Approved Amount (RM) *" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter offer amount"
                disabled={isProcessing}
                required
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">
              {decision === 'reject' ? 'Notes for Rejection (Required) *' : 'Notes for Offer (Optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green"
              placeholder={decision === 'reject' ? 'Please provide a clear reason for rejection...' : 'You can add conditions for the offer here...'}
              disabled={isProcessing}
              required={decision === 'reject'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
            <Button variant="secondary" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isProcessing}>
              Submit Decision
            </Button>
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default AdminReviewModal;
