import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { Users, UserPlus, Mail, Lock, Shield, Building2, Edit } from 'lucide-react';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'LOGISTICS_OFFICER',
    base_id: ''
  });

  useEffect(() => {
    fetchUsersAndBases();
  }, []);

  const fetchUsersAndBases = async () => {
    setLoading(true);
    try {
      const [usersRes, basesRes] = await Promise.all([
        api.get('/users'),
        api.get('/bases')
      ]);
      setUsers(usersRes.data.data.users || []);
      setBases(basesRes.data.data.bases || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user accounts');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'LOGISTICS_OFFICER',
      base_id: bases[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (userObj) => {
    setEditingUser(userObj);
    setFormData({
      name: userObj.name,
      email: userObj.email,
      password: '', // Blank unless updating password
      role: userObj.role,
      base_id: userObj.base_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        const res = await api.put(`/users/${editingUser.id}`, payload);
        if (res.data.success) {
          setSuccess(`User account ${res.data.data.user.email} updated successfully!`);
          setIsModalOpen(false);
          fetchUsersAndBases();
        }
      } else {
        const res = await api.post('/users', formData);
        if (res.data.success) {
          setSuccess(`User account ${res.data.data.user.email} created successfully!`);
          setIsModalOpen(false);
          fetchUsersAndBases();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user account');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', className: 'font-mono text-xs w-12', render: (r) => `#${r.id}` },
    { header: 'Full Name', accessor: 'name', render: (r) => <span className="font-semibold text-slate-200">{r.name}</span> },
    { header: 'Email Address', accessor: 'email', className: 'font-mono text-xs text-slate-300', render: (r) => r.email },
    { header: 'Assigned Role', accessor: 'role', render: (r) => (
      <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded border ${
        r.role === 'ADMIN' ? 'bg-purple-950/60 text-purple-300 border-purple-800' :
        r.role === 'BASE_COMMANDER' ? 'bg-blue-950/60 text-blue-300 border-blue-800' :
        'bg-emerald-950/60 text-emerald-300 border-emerald-800'
      }`}>
        {r.role.replace('_', ' ')}
      </span>
    )},
    { header: 'Assigned Base', accessor: 'base', render: (r) => <span className="text-slate-300 font-medium">{r.base ? r.base.name : <span className="text-slate-500 italic">All Bases (Global)</span>}</span> },
    { header: 'Created Date', accessor: 'created_at', className: 'font-mono text-xs text-slate-400', render: (r) => new Date(r.created_at).toLocaleDateString() },
    { header: 'Actions', accessor: 'actions', className: 'text-right', render: (r) => (
      <button
        onClick={() => openEditModal(r)}
        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
        title="Edit User"
      >
        <Edit className="w-4 h-4" />
      </button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            User Administration & RBAC Controls
          </h1>
          <p className="text-xs text-slate-400">
            Manage personnel access accounts, command roles, and base assignments
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />
      <SuccessMessage message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner text="Fetching system user accounts..." />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          emptyMessage="No system users found."
        />
      )}

      {/* Create / Edit User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? `Edit User: ${editingUser.email}` : 'Create System User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Col. Alex Vance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-500" /> Official Email
            </label>
            <input
              type="email"
              required
              placeholder="user@military.gov"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              required={!editingUser}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> System Role
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="BASE_COMMANDER">BASE_COMMANDER</option>
                <option value="LOGISTICS_OFFICER">LOGISTICS_OFFICER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Assigned Base
              </label>
              <select
                value={formData.base_id || ''}
                onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">None (Global Access for Admin)</option>
                {bases.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition"
            >
              {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
