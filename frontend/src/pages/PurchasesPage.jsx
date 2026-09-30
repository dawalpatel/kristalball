import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { ShoppingBag, Plus, Calendar, Building2, Package, Hash, FileText } from 'lucide-react';

export const PurchasesPage = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    base_id: '',
    equipment_type_id: '',
    quantity: 1,
    purchase_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [selectedBase, selectedEquipment, startDate, endDate]);

  const fetchDropdowns = async () => {
    try {
      const [basesRes, equipRes] = await Promise.all([
        api.get('/bases'),
        api.get('/equipment-types')
      ]);
      setBases(basesRes.data.data.bases || []);
      setEquipmentTypes(equipRes.data.data.equipmentTypes || []);
      if (basesRes.data.data.bases?.length > 0) {
        setFormData(prev => ({ ...prev, base_id: basesRes.data.data.bases[0].id }));
      }
      if (equipRes.data.data.equipmentTypes?.length > 0) {
        setFormData(prev => ({ ...prev, equipment_type_id: equipRes.data.data.equipmentTypes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load bases/equipment dropdowns:', err);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBase) params.base = selectedBase;
      if (selectedEquipment) params.equipmentType = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/purchases', { params });
      if (res.data.success) {
        setPurchases(res.data.data.purchases || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch purchase logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post('/purchases', formData);
      if (res.data.success) {
        setSuccess('New equipment purchase recorded successfully!');
        setIsModalOpen(false);
        fetchPurchases();
        setFormData(prev => ({
          ...prev,
          quantity: 1,
          reference_number: '',
          remarks: ''
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedBase('');
    setSelectedEquipment('');
    setStartDate('');
    setEndDate('');
  };

  const canCreate = ['ADMIN', 'LOGISTICS_OFFICER'].includes(user?.role);

  const columns = [
    { header: 'Ref Number', accessor: 'reference_number', render: (r) => <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">{r.reference_number || 'N/A'}</span> },
    { header: 'Date', accessor: 'purchase_date', className: 'font-mono text-xs', render: (r) => r.purchase_date },
    { header: 'Receiving Base', accessor: 'base', render: (r) => <span className="font-semibold text-slate-200">{r.base ? r.base.name : '-'}</span> },
    { header: 'Equipment Item', accessor: 'equipmentType', render: (r) => <span className="text-slate-300 font-medium">{r.equipmentType ? r.equipmentType.name : '-'}</span> },
    { header: 'Quantity', accessor: 'quantity', className: 'text-right font-mono font-bold text-emerald-400', render: (r) => `+${r.quantity.toLocaleString()}` },
    { header: 'Logged By', accessor: 'creator', render: (r) => <span className="text-xs text-slate-400">{r.creator ? r.creator.name : '-'}</span> },
    { header: 'Remarks', accessor: 'remarks', render: (r) => <span className="text-xs text-slate-400 max-w-xs truncate block">{r.remarks || '-'}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-500" />
            Equipment Procurement & Purchases
          </h1>
          <p className="text-xs text-slate-400">
            Record incoming asset purchases and track procurement reference history
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Purchase</span>
          </button>
        )}
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />
      <SuccessMessage message={success} onClose={() => setSuccess('')} />

      <FilterBar
        bases={bases}
        equipmentTypes={equipmentTypes}
        selectedBase={selectedBase}
        setSelectedBase={setSelectedBase}
        selectedEquipment={selectedEquipment}
        setSelectedEquipment={setSelectedEquipment}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onReset={handleResetFilters}
      />

      {loading ? (
        <LoadingSpinner text="Loading purchase history..." />
      ) : (
        <DataTable
          columns={columns}
          data={purchases}
          emptyMessage="No purchase records match current filter criteria."
        />
      )}

      {/* Record Purchase Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Equipment Purchase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Destination Base
            </label>
            <select
              required
              value={formData.base_id}
              onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {bases.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" /> Equipment Type
            </label>
            <select
              required
              value={formData.equipment_type_id}
              onChange={(e) => setFormData({ ...formData, equipment_type_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {equipmentTypes.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Purchase Date
              </label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-500" /> Reference Number / Purchase Order
            </label>
            <input
              type="text"
              placeholder="e.g. PO-2026-089"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" /> Remarks / Notes
            </label>
            <textarea
              rows="2"
              placeholder="Procurement notes..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
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
              {submitting ? 'Recording...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchasesPage;
