import React, { useState } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import Select from '../ui/Select.tsx';
import Modal from '../ui/Modal.tsx';
import RegistrationModal from '../auth/RegistrationModal.tsx'; // For adding new users securely
import { SearchIcon, FilterIcon, PlusIcon, PencilIcon, TrashIcon, USER_ROLES } from '../../constants.tsx';
import { User, UserRole, UserTier } from '../../types.ts';
import { useAppContext } from '../AppContext.tsx';

const USER_TIERS: UserTier[] = ['Normal', 'Premium'];

const UserManagementView: React.FC = () => {
  const { users, isLoadingUsers, editUser, deleteUser, currentUser } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  
  // State for the ADD user flow (using registration modal)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // State for the EDIT user flow
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<{ name: string; role: UserRole; tier: UserTier }>({
    name: '',
    role: 'User',
    tier: 'Normal',
  });

  // State for the DELETE user flow
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const roleOptions = [{ value: 'all', label: 'All Roles' }, ...USER_ROLES.map(role => ({ value: role, label: role }))];
  const tierOptions = USER_TIERS.map(tier => ({ value: tier, label: tier }));

  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserFormData({ name: user.name, role: user.role, tier: user.tier });
    setIsEditUserModalOpen(true);
  };

  const handleCloseEditUserModal = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };

  const handleEditUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value as UserRole | UserTier }));
  };

  const handleEditUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name) {
      alert('Name is required.');
      return;
    }
    if (editingUser) {
      await editUser(editingUser.id, { name: userFormData.name, role: userFormData.role, tier: userFormData.tier });
    }
    handleCloseEditUserModal();
  };

  const handleOpenDeleteConfirmModal = (user: User) => {
    if (currentUser?.id === user.id) {
        alert("You cannot delete your own account.");
        return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setUserToDelete(null);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
    }
    handleCloseDeleteConfirmModal();
  };

  const filteredUsers = users.filter(user => {
    // Defensively check if user object and its properties are valid before filtering.
    if (!user || typeof user.name !== 'string' || typeof user.email !== 'string') {
      return false;
    }
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }).sort((a,b) => a.name.localeCompare(b.name));

  if (isLoadingUsers) {
    return (
        <div className="flex justify-center items-center h-full">
            <p className="text-xl text-brand-text-secondary-light dark:text-brand-text-secondary">Loading users...</p>
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">User Management</h2>
          <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Manage users, roles, and permissions.</p>
        </div>
        <Button variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} onClick={() => setIsRegistrationModalOpen(true)}>
          Add New User
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Search by name or email"
            icon={<SearchIcon className="w-5 h-5"/>}
            className="flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-4 items-center">
            <Select 
                options={roleOptions} 
                className="min-w-[150px] md:min-w-[200px]" 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
                aria-label="Filter by role"
            />
            <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilterRole('all');}} leftIcon={<FilterIcon className="w-5 h-5"/>} >
                Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`User List (${filteredUsers.length})`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[600px] text-sm text-left text-brand-text-secondary-light dark:text-brand-text-secondary">
            <thead className="text-xs text-brand-green-text dark:text-brand-dark-green-text uppercase bg-neutral-100-light dark:bg-neutral-700-dark">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Tier</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="bg-card-bg-light dark:bg-card-bg border-b border-neutral-200-light dark:border-neutral-700-dark hover:bg-neutral-100-light dark:hover:bg-neutral-700-dark">
                  <td className="px-6 py-4 font-medium text-brand-text-light dark:text-brand-text whitespace-nowrap flex items-center">
                    {user.avatar && (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs mr-3 ${ currentUser?.id === user.id ? 'bg-green-500 text-white' : 'bg-neutral-300-light dark:bg-neutral-600-dark'}`}>
                            {user.avatar}
                        </span>
                    )}
                    {user.name}
                    {currentUser?.id === user.id && <span className="ml-2 text-xs text-green-500">(You)</span>}
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.tier === 'Premium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-200'}`}>
                        {user.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditUserModal(user)} leftIcon={<PencilIcon className="w-4 h-4"/>} aria-label={`Edit user ${user.name}`}>Edit</Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400" 
                        onClick={() => handleOpenDeleteConfirmModal(user)}
                        leftIcon={<TrashIcon className="w-4 h-4"/>}
                        disabled={currentUser?.id === user.id} // Disable deleting self
                        aria-label={`Delete user ${user.name}`}
                    >
                        Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {filteredUsers.length === 0 && !isLoadingUsers && (
            <p className="text-center py-8 text-brand-text-secondary-light dark:text-brand-text-secondary">
              No users found matching your criteria.
            </p>
          )}
        </div>
      </Card>

      {/* Add User Modal (uses Registration flow) */}
      <RegistrationModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} adminMode={true} />

      {/* Edit User Modal */}
      {editingUser && (
        <Modal 
            isOpen={isEditUserModalOpen} 
            onClose={handleCloseEditUserModal} 
            title={'Edit User'}
            size="md"
        >
            <form onSubmit={handleEditUserFormSubmit} className="space-y-4">
            <Input
                label="Full Name *"
                name="name"
                value={userFormData.name}
                onChange={handleEditUserFormChange}
                required
            />
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Email Address</label>
                <p className="p-2.5 rounded-lg bg-neutral-100-light dark:bg-neutral-700-dark text-brand-text-secondary-light dark:text-brand-text-secondary">{editingUser.email}</p>
                <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">Email cannot be changed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Role *"
                    name="role"
                    options={USER_ROLES.map(role => ({ value: role, label: role }))}
                    value={userFormData.role}
                    onChange={handleEditUserFormChange}
                    required
                />
                <Select
                    label="Tier *"
                    name="tier"
                    options={tierOptions}
                    value={userFormData.tier}
                    onChange={handleEditUserFormChange}
                    required
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseEditUserModal}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
            </div>
            </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <Modal 
            isOpen={isDeleteConfirmModalOpen} 
            onClose={handleCloseDeleteConfirmModal} 
            title="Confirm Deletion"
            size="sm"
        >
          <p className="text-brand-text-light dark:text-brand-text">
            Are you sure you want to delete the user <span className="font-semibold">{userToDelete.name}</span> ({userToDelete.email})?
          </p>
          <p className="text-sm text-red-500 dark:text-red-400 mt-2">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="secondary" onClick={handleCloseDeleteConfirmModal}>Cancel</Button>
            <Button type="button" variant="primary" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500" onClick={confirmDeleteUser}>Delete User</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default React.memo(UserManagementView);