

import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input.tsx';
import Select from '../ui/Select.tsx';
import Button from '../ui/Button.tsx';
import { useAppContext } from '../AppContext.tsx'; 
import { GrantApplication } from '../../types.ts';
import { useToast } from '../ToastContext.tsx';


interface GrantApplicationFormProps {
  onClose: () => void;
  initialGrantCategoryId?: string | null;
  initialData?: GrantApplication; // For re-applying
}

const GrantApplicationForm: React.FC<GrantApplicationFormProps> = ({ onClose, initialGrantCategoryId, initialData }) => {
  const { 
    addGrantApplication, 
    reapplyForGrant, 
    currentUser, 
    grantCategories, 
    creativeCategories, 
    isLoadingGrantCategories, 
    isLoadingCreativeCategories 
  } = useAppContext(); 
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    organization_name: '',
    email: '',
    contact_number: '',
    grant_category_id: '', // Original grant category
    primary_creative_category_id: '', // New creative primary category
    creative_sub_category_id: '',   // New creative sub category
    project_name: '',
    project_description: '',
    program_start_date: '',
    end_date: '',
    amount_requested: '',
  });

  const [endDateError, setEndDateError] = useState('');

  const minStartDate = useMemo(() => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3);
    return today.toISOString().split('T')[0];
  }, []);
  
  // This derived state determines if the creative category fields should be shown
  const isHeritageFund = useMemo(() => formData.grant_category_id === 'heritage-fund', [formData.grant_category_id]);


  useEffect(() => {
    const defaultGrantId = grantCategories.length > 0 ? grantCategories[0].id : '';
    setFormData({
        organization_name: initialData?.organization_name || currentUser?.name || '',
        email: initialData?.email || currentUser?.email || '',
        contact_number: initialData?.contact_number || '',
        grant_category_id: initialData?.grant_category_id || initialGrantCategoryId || defaultGrantId,
        primary_creative_category_id: initialData?.primary_creative_category_id || '',
        creative_sub_category_id: initialData?.creative_sub_category_id || '',
        project_name: initialData?.project_name || '',
        project_description: initialData?.project_description || '',
        program_start_date: initialData?.program_start_date || '',
        end_date: initialData?.end_date || '',
        amount_requested: initialData?.amount_requested?.toString() || '',
    });
  }, [initialData, currentUser, initialGrantCategoryId, grantCategories]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        // When grant category changes, reset creative fields if it's not the heritage fund
        if (name === 'grant_category_id' && value !== 'heritage-fund') {
            newState.primary_creative_category_id = '';
            newState.creative_sub_category_id = '';
        }
        if (name === 'primary_creative_category_id') {
            newState.creative_sub_category_id = ''; // Reset subcategory if primary changes
        }
        return newState;
    });

    if (name === 'end_date' || name === 'program_start_date') {
      setEndDateError(''); 
    }
  };
  
  const availableSubcategories = useMemo(() => {
    if (!isHeritageFund || !formData.primary_creative_category_id) return [];
    const primaryCat = creativeCategories.find(cat => cat.id === formData.primary_creative_category_id);
    return primaryCat?.subcategories || [];
  }, [isHeritageFund, formData.primary_creative_category_id, creativeCategories]);

  // Effect to ensure subcategory is valid if primary changes and initialData had a subcategory
  useEffect(() => {
    if (initialData && initialData.primary_creative_category_id === formData.primary_creative_category_id) {
      if (initialData.creative_sub_category_id && availableSubcategories.some(sub => sub.id === initialData.creative_sub_category_id)) {
        setFormData(prev => ({ ...prev, creative_sub_category_id: initialData.creative_sub_category_id! }));
      }
    } else {
      if (formData.creative_sub_category_id && !availableSubcategories.some(sub => sub.id === formData.creative_sub_category_id)) {
        setFormData(prev => ({...prev, creative_sub_category_id: ''}));
      }
    }
  }, [formData.primary_creative_category_id, initialData, availableSubcategories]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEndDateError('');

    if (isSubmitting) return;
    if (isLoadingGrantCategories || isLoadingCreativeCategories) {
        showToast("Categories are still loading, please wait.", "info");
        return;
    }
    if (!currentUser) {
      showToast("User not identified. Please log in.", "error");
      return;
    }
    if (!formData.organization_name || !formData.email || !formData.project_name || !formData.grant_category_id || !formData.program_start_date || !formData.end_date) {
        showToast("Please fill in all required fields marked with *.", "error");
        return;
    }
    
    // Conditional validation for creative categories
    if (isHeritageFund) {
        if (!formData.primary_creative_category_id) {
            showToast("Please select a Primary Creative Industry Category for the Heritage Fund.", "error");
            return;
        }
        const selectedPrimaryCat = creativeCategories.find(cat => cat.id === formData.primary_creative_category_id);
        if (selectedPrimaryCat && selectedPrimaryCat.subcategories.length > 0 && !formData.creative_sub_category_id) {
            showToast("Please select a Creative Subcategory for the chosen Primary Category.", "error");
            return;
        }
    }
    
    const programStartDateObj = new Date(formData.program_start_date);
    const endDateObj = new Date(formData.end_date);

    if (isNaN(programStartDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        showToast("Invalid Program Start or End Date.", "error");
        return;
    }
    
    if (endDateObj < programStartDateObj) { 
        setEndDateError("The end date cannot be before the program's start date.");
        return;
    }

    setIsSubmitting(true);
    try {
      // Set a default non-null value for primary_creative_category_id if not applicable to prevent DB error
      const primaryCreativeId = isHeritageFund ? formData.primary_creative_category_id : 'crafts'; 
      const creativeSubId = isHeritageFund ? (formData.creative_sub_category_id || null) : null;

      const applicationDataForContext = {
          organization_name: formData.organization_name,
          email: formData.email,
          contact_number: formData.contact_number || null,
          grant_category_id: formData.grant_category_id,
          primary_creative_category_id: primaryCreativeId,
          creative_sub_category_id: creativeSubId,
          project_name: formData.project_name,
          project_description: formData.project_description,
          program_start_date: formData.program_start_date,
          end_date: formData.end_date,
          amount_requested: parseFloat(formData.amount_requested) || 0,
      };
      
      if (initialData) { // This is a re-apply
        await reapplyForGrant(initialData, applicationDataForContext);
      } else { // This is a new application
        await addGrantApplication(applicationDataForContext); 
      }
      onClose();

    } catch (error) {
        console.error("Application submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const grantCategoryOptions = grantCategories.map(cat => ({ value: cat.id, label: cat.name }));
  
  const primaryCreativeCategoryOptions = [
    { value: '', label: isLoadingCreativeCategories ? 'Loading...' : 'Select Primary Category...' },
    ...creativeCategories.map(cat => ({ value: cat.id, label: cat.name }))
  ];
  
  const subCategoryOptions = (isHeritageFund && formData.primary_creative_category_id && availableSubcategories.length > 0)
    ? [{ value: '', label: 'Select Subcategory...' }, ...availableSubcategories.map(sub => ({ value: sub.id, label: sub.name }))]
    : [{ value: '', label: 'N/A' }];


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Applicant/Organization Name *"
        name="organization_name"
        value={formData.organization_name}
        onChange={handleChange}
        required
        disabled={isSubmitting}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email Address *"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
        <Input
          label="Contact Number"
          name="contact_number"
          type="tel"
          value={formData.contact_number}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>
      <Select
        label="Grant Program Category *"
        name="grant_category_id"
        options={grantCategoryOptions}
        value={formData.grant_category_id}
        onChange={handleChange}
        required
        disabled={isSubmitting || isLoadingGrantCategories}
      />

      {isHeritageFund && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-modalShow">
              <Select
              label="Primary Creative Industry Category *"
              name="primary_creative_category_id"
              options={primaryCreativeCategoryOptions}
              value={formData.primary_creative_category_id}
              onChange={handleChange}
              required={isHeritageFund}
              disabled={isSubmitting || isLoadingCreativeCategories}
              />
              <Select
              label="Creative Industry Subcategory *"
              name="creative_sub_category_id"
              options={subCategoryOptions}
              value={formData.creative_sub_category_id}
              onChange={handleChange}
              disabled={!formData.primary_creative_category_id || availableSubcategories.length === 0 || isSubmitting}
              required={isHeritageFund && formData.primary_creative_category_id && availableSubcategories.length > 0}
              />
          </div>
      )}
      
      <Input
        label="Project Name/Title *"
        name="project_name"
        value={formData.project_name}
        onChange={handleChange}
        required
        disabled={isSubmitting}
      />
      <div>
        <label htmlFor="project_description" className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Project Description & Objectives *</label>
        <textarea
          id="project_description"
          name="project_description"
          rows={3}
          className={`w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green`}
          value={formData.project_description}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Input
              label="Program Start Date *"
              name="program_start_date"
              type="date"
              value={formData.program_start_date}
              onChange={handleChange}
              required
              wrapperClassName="mb-0"
              min={minStartDate}
              disabled={isSubmitting}
            />
            <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">
                The start date must be at least 3 months from today.
            </p>
        </div>
        <div>
          <Input
              label="Program End Date *"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              required
              wrapperClassName="mb-0"
              min={formData.program_start_date || minStartDate}
              disabled={isSubmitting}
          />
          {endDateError && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{endDateError}</p>}
        </div>
      </div>
      <Input
        label="Amount Requested (RM) *"
        name="amount_requested"
        type="number"
        placeholder="e.g., 50000"
        value={formData.amount_requested}
        onChange={handleChange}
        required
        disabled={isSubmitting}
      />
      <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">Fields marked with * are mandatory.</p>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isLoadingGrantCategories || isLoadingCreativeCategories}>
          {initialData ? 'Re-submit Application' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
};

export default GrantApplicationForm;