import React, { useState } from 'react';
import Modal from '../ui/Modal.tsx';
import Input from '../ui/Input.tsx';
import Select from '../ui/Select.tsx'; // Import Select
import Button from '../ui/Button.tsx';
import { useAppContext } from '../AppContext.tsx';
import { UserPlusIcon, USER_ROLES } from '../../constants.tsx';
import { UserRole } from '../../types.ts';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminMode?: boolean; // Add prop for admin context
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, adminMode = false }) => {
  const { registerUserWithEmailPassword } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('User'); // Add state for role
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccessEmail, setRegistrationSuccessEmail] = useState<string | null>(null);

  // Filter out admin roles unless in admin mode
  const roleOptions = (adminMode ? USER_ROLES : USER_ROLES.filter(r => r !== 'Admin' && r !== 'Editor'))
    .map(r => ({ value: r, label: r }));

  const handleClose = () => {
    // Reset form state on close
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('User');
    setError(null);
    setIsLoading(false);
    setRegistrationSuccessEmail(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await registerUserWithEmailPassword(name, email, password, role);
      setRegistrationSuccessEmail(email); // Show success message
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={registrationSuccessEmail ? "Registration Successful" : "Create a New Account"} size="md">
      {registrationSuccessEmail ? (
        <div className="text-center space-y-4">
          <p className="text-brand-text-light dark:text-brand-text">
            A verification link has been sent to <span className="font-semibold">{registrationSuccessEmail}</span>.
          </p>
          <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
            Please check your inbox and click the link to complete your registration before logging in.
          </p>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
            disabled={isLoading}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Select
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isLoading}
          />

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" leftIcon={<UserPlusIcon className="w-5 h-5" />} isLoading={isLoading}>
              Register
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default RegistrationModal;