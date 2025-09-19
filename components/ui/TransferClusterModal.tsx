import React, { useState, useMemo } from 'react';
import { Cluster, User } from '../../types.ts';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import Select from './Select.tsx';
import { useAppContext } from '../AppContext.tsx';

interface TransferClusterModalProps {
    isOpen: boolean;
    onClose: () => void;
    cluster: Cluster;
    onTransferSuccess: () => void;
}

const TransferClusterModal: React.FC<TransferClusterModalProps> = ({ isOpen, onClose, cluster, onTransferSuccess }) => {
    const { users, transferClusterOwnership } = useAppContext();
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [isTransferring, setIsTransferring] = useState(false);

    const userOptions = useMemo(() => {
        return users
            .filter(user => user.id !== cluster.owner_id) // Exclude current owner
            .map(user => ({
                value: user.id,
                label: `${user.name} (${user.email})`
            }));
    }, [users, cluster.owner_id]);

    const handleTransfer = async () => {
        if (!selectedUserId) return;
        setIsTransferring(true);
        const success = await transferClusterOwnership(cluster.id, selectedUserId);
        if (success) {
            onTransferSuccess();
        }
        setIsTransferring(false);
    };
    
    const selectedUserName = useMemo(() => {
        return users.find(u => u.id === selectedUserId)?.name || '';
    }, [selectedUserId, users]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Transfer Ownership of ${cluster.name}`} size="md">
            <div className="space-y-4">
                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                    Please select a new user to transfer ownership of this cluster to. This action will also transfer ownership of all associated products and cannot be undone.
                </p>

                <Select
                    label="Select New Owner"
                    options={[{ value: '', label: 'Select a user...' }, ...userOptions]}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={isTransferring}
                />

                {selectedUserId && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                        You are about to transfer this cluster to <span className="font-semibold">{selectedUserName}</span>. Are you sure you wish to proceed?
                    </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                    <Button variant="secondary" onClick={onClose} disabled={isTransferring}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleTransfer}
                        isLoading={isTransferring}
                        disabled={!selectedUserId || isTransferring}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500"
                    >
                        Confirm Transfer
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TransferClusterModal;