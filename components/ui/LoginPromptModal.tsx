
import React from 'react';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import { LoginIcon, UserPlusIcon } from '../../constants.tsx';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  message?: string;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose, onLogin, onRegister, message }) => {
  const defaultMessage = "You need to be logged in to access this feature. Please log in or create an account to continue.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Authentication Required">
      <div className="text-center">
        <p className="text-brand-text-light dark:text-brand-text mb-6">
          {message || defaultMessage}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="secondary" onClick={onLogin} leftIcon={<LoginIcon className="w-5 h-5"/>}>
            Login
          </Button>
          <Button variant="primary" onClick={onRegister} leftIcon={<UserPlusIcon className="w-5 h-5"/>}>
            Register
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LoginPromptModal;
