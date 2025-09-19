import React, { useState, useCallback } from 'react';
import Modal from '../ui/Modal.tsx';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { useAppContext } from '../AppContext.tsx';
import { LoginIcon } from '../../constants.tsx';
import { useToast } from '../ToastContext.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginUserWithPassword } = useAppContext();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setEmail('');
    setPassword('');
    setError(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginUserWithPassword(email, password);
      showToast('Logged in successfully!', 'success');
      handleClose();
    } catch (err: any) {
        if (err.message.includes("Email not confirmed")) {
           setError("Login failed: Please check your inbox for a verification email.");
        } else if (err.message.includes("Invalid login credentials")) {
           setError("Invalid email or password. If you just registered, please check your inbox for a verification link.");
        } else {
           setError(err.message || "An unknown error occurred during login.");
        }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Login to your Account" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          disabled={isLoading}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          disabled={isLoading}
        />

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<LoginIcon className="w-5 h-5" />} isLoading={isLoading}>
            Login
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LoginModal;
