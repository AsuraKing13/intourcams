import React, { useState } from 'react';
import Card from './Card.tsx';
import Input from './Input.tsx';
import Button from './Button.tsx';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { UserCircleIcon, ShieldCheckIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Modal from './Modal.tsx';

const ProfileSettings: React.FC = () => {
  const { currentUser, updateCurrentUserName, updateCurrentUserPassword, deleteCurrentUserAccount, isPremiumUser } = useAppContext();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [isNameSubmitting, setIsNameSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);


  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentUser?.name) {
      return; // No changes to submit
    }
    setIsNameSubmitting(true);
    try {
      await updateCurrentUserName(name.trim());
      // Success toast is handled in the context
    } catch (error: any) {
      // Error toast is handled in the context
      setName(currentUser?.name || ''); // Reset to original name on failure
    } finally {
      setIsNameSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setIsPasswordSubmitting(true);
    try {
      await updateCurrentUserPassword(newPassword);
      // Success toast handled in context
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error toast handled in context
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== currentUser?.email) {
      showToast("Email confirmation does not match.", "error");
      return;
    }
    setIsDeleting(true);
    const success = await deleteCurrentUserAccount();
    setIsDeleting(false);
    if (success) {
      setIsDeleteModalOpen(false);
      // The context handles logout and redirect.
    }
  };


  if (!currentUser) {
    return (
      <Card title="Profile Settings">
        <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8">
          Please log in to manage your profile settings.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Personal Information" titleIcon={<UserCircleIcon className="w-6 h-6" />}>
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Email Address</label>
            <p className="p-2.5 rounded-lg bg-neutral-100-light dark:bg-neutral-700-dark text-brand-text-secondary-light dark:text-brand-text-secondary">{currentUser.email}</p>
          </div>
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isNameSubmitting}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isNameSubmitting} disabled={name === currentUser.name}>
              Save Name
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Account Tier" titleIcon={<SparklesIcon className="w-6 h-6" />}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">Your current tier is</p>
                <p className={`text-2xl font-bold ${isPremiumUser ? 'text-yellow-500' : 'text-brand-text-light dark:text-brand-text'}`}>
                    {currentUser.tier}
                </p>
            </div>
            {!isPremiumUser && (
                <Button variant="primary" onClick={() => setIsUpgradeModalOpen(true)}>
                    Upgrade to Premium
                </Button>
            )}
        </div>
      </Card>

      <Card title="Security" titleIcon={<ShieldCheckIcon className="w-6 h-6" />}>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password (min. 6 characters)"
            disabled={isPasswordSubmitting}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter new password"
            disabled={isPasswordSubmitting}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isPasswordSubmitting} disabled={!newPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>
      
      <Card title="Danger Zone" titleIcon={<TrashIcon className="w-6 h-6 text-red-500" />}>
        <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-lg space-y-3">
            <h4 className="font-semibold text-red-600 dark:text-red-400">Delete Your Account</h4>
            <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                Once you delete your account, there is no going back. All of your data, including grant applications and cluster ownership, will be permanently removed. Please be certain.
            </p>
            <div className="text-right">
                <Button 
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => setIsDeleteModalOpen(true)}
                >
                    Delete My Account
                </Button>
            </div>
        </div>
      </Card>

      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Premium Features"
      >
        <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-brand-green-text dark:text-brand-dark-green-text">Coming Soon!</h3>
            <p className="text-brand-text-light dark:text-brand-text">
                Online payments and automatic upgrades are currently under development.
            </p>
            <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                Premium access unlocks advanced analytics and other exclusive features. If you require a manual upgrade, please contact a system administrator.
            </p>
            <Button variant="primary" onClick={() => setIsUpgradeModalOpen(false)}>
                Got it
            </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        size="md"
      >
        <div className="space-y-4">
            <p className="text-brand-text-light dark:text-brand-text">
                This action is <strong className="text-red-500">irreversible</strong>. To confirm, please type your email address below.
            </p>
            <p className="p-2.5 rounded-lg bg-neutral-100-light dark:bg-neutral-700-dark text-center font-semibold text-brand-text-light dark:text-brand-text">
                {currentUser.email}
            </p>
            <Input
                label="Confirm Email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                required
                disabled={isDeleting}
                placeholder="Type your email here..."
            />
            <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500"
                    isLoading={isDeleting}
                    disabled={isDeleting || confirmEmail !== currentUser.email}
                    onClick={handleDeleteAccount}
                >
                    Delete My Account
                </Button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default ProfileSettings;