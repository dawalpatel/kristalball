import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { Flame, Plus, Calendar, Building2, Package, AlertCircle, FileText } from 'lucide-react';

export const ExpendituresPage = () => {
  const { user } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [selectedBase, setSelectedBase] = useState(user?.role === 'BASE_COMMANDER' ? user.base_id : '');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableStock, setAvailableStock] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);

  const [formData, setFormData] = useState({
    base_id: user?.role === 'BASE_COMMANDER' ? user.base_id : '',
    equipment_type_id: '',
    quantity: 1,
    expenditure_date: new Date().toISOString().split('T')[0],
    reason: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchExpenditures();
  }, [selectedBase, selectedEquipment, startDate, endDate]);

  useEffect(() => {
    if (isModalOpen && formData.base_id && formData.equipment_type_id) {
      checkAvailableStock(formData.base_id, formData.equipment_type_id);
    }
  }, [formData.base_id, formData.equipment_type_id, isModalOpen]);

  const fetchDropdowns = async () => {
    try {
      const [basesRes, equipRes] = await Promise.all([
        api.get('/bases'),
        api.get('/equipment-types')
      ]);
      const baseList = basesRes.data.data.bases || [];
      const equipList = equipRes.data.data.equipmentTypes || [];

      setBases(baseList);
      setEquipmentTypes(equipList);

      const defaultBase = user?.role === 'BASE_COMMANDER' ? user.base_id : (baseList[0]?.id || '');
      setFormData(prev => ({
        ...prev,
        base_id: defaultBase,
        equipment_type_id: equipList[0]?.id || ''
      }));
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  };

  const checkAvailableStock = async (baseId, equipTypeId) => {
    setCheckingStock(true);
    try {
      const res = await api.get('/inventory', {
        params: { base: baseId, equipmentType: equipTypeId }
      });
      const item = res.data.data.items?.find(
        i => i.baseId === parseInt(baseId, 10) && i.equipmentTypeId === parseInt(equipTypeId, 10)
      );
      setAvailableStock(item ? item.closingBalance : 0);
    } catch (err) {
      console.error('Stock check error:', err);
      setAvailableStock(0);
    } finally {
      setCheckingStock(false);
    }
  };

  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBase) params.base = selectedBase;
      if (selectedEquipment) params.equipmentType = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/expenditures', { params });
      if (res.data.success) {
        setExpenditures(res.data.data.expenditures || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenditure logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (availableStock !== null && formData.quantity > availableStock) {
      setError(`Insufficient available stock! Available balance is ${availableStock}, cannot expend ${formData.quantity}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/expenditures', formData);
      if (res.data.success) {
        setSuccess('Asset expenditure recorded successfully!');
        setIsModalOpen(false);
        fetchExpenditures();
        setFormData(prev => ({ ...prev, reason: '', quantity: 1, remarks: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expenditure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    if (user?.role !== 'BASE_COMMANDER') {
      setSelectedBase('');
    }
    setSelectedEquipment('');
    setStartDate('');
    setEndDate('');
  };

  const columns = [
    { header: 'Expenditure Date', accessor: 'expenditure_date', className: 'font-mono text-xs', render: (r) => r.expenditure_date },
    { header: 'Base Location', accessor: 'base', render: (r) => <span className="font-semibold text-slate-200">{r.base ? r.base.name : '-'}</span> },
    { header: 'Equipment Item', accessor: 'equipmentType', render: (r) => <span className="text-slate-300 font-medium">{r.equipmentType ? r.equipmentType.name : '-'}</span> },
    { header: 'Quantity Expended', accessor: 'quantity', className: 'text-right font-mono font-bold text-rose-400', render: (r) => `-${r.quantity.toLocaleString()}` },
    { header: 'Expenditure Reason', accessor: 'reason', render: (r) => <span className="px-2 py-0.5 text-xs font-medium rounded bg-rose-950/60 text-rose-300 border border-rose-800">{r.reason}</span> },
    { header: 'Logged By', accessor: 'creator', render: (r) => <span className="text-xs text-slate-400">{r.creator ? r.creator.name : '-'}</span> },
    { header: 'Remarks', accessor: 'remarks', render: (r) => <span className="text-xs text-slate-400 max-w-xs truncate block">{r.remarks || '-'}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-rose-500" />
            Asset Expenditures & Depletion Log
          </h1>
          <p className="text-xs text-slate-400">
            Log consumed ammunition, damaged assets, training usage, and decommissioned inventory
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Asset Expenditure</span>
        </button>
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
        hideBaseFilter={user?.role === 'BASE_COMMANDER'}
      />

      {loading ? (
        <LoadingSpinner text="Loading expenditure logs..." />
      ) : (
        <DataTable
          columns={columns}
          data={expenditures}
          emptyMessage="No expenditure history records match current criteria."
        />
      )}

      {/* Record Expenditure Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Asset Expenditure / Depletion">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Base Station
            </label>
            <select
              required
              disabled={user?.role === 'BASE_COMMANDER'}
              value={formData.base_id}
              onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-75"
            >
              {bases.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" /> Equipment Item
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

          {/* Stock Indicator */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              <span>Available Reserve at Selected Base:</span>
            </div>
            <span className="font-mono font-bold text-sm text-slate-100">
              {checkingStock ? 'Checking...' : (availableStock !== null ? availableStock.toLocaleString() : '0')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" /> Reason for Expenditure
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Training Exercise / Decommissioned / Damaged in Action"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Quantity Expended</label>
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
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Expenditure Date
              </label>
              <input
                type="date"
                required
                value={formData.expenditure_date}
                onChange={(e) => setFormData({ ...formData, expenditure_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Remarks</label>
            <textarea
              rows="2"
              placeholder="Incident details or drill report..."
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
              disabled={submitting || (availableStock !== null && formData.quantity > availableStock)}
              className="px-5 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition"
            >
              {submitting ? 'Recording...' : 'Record Expenditure'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpendituresPage;
