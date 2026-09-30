import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { ArrowLeftRight, Plus, Calendar, Building2, Package, AlertCircle } from 'lucide-react';

export const TransfersPage = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
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
    from_base_id: user?.role === 'BASE_COMMANDER' ? user.base_id : '',
    to_base_id: '',
    equipment_type_id: '',
    quantity: 1,
    transfer_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [selectedBase, selectedEquipment, startDate, endDate]);

  useEffect(() => {
    if (isModalOpen && formData.from_base_id && formData.equipment_type_id) {
      checkSourceStock(formData.from_base_id, formData.equipment_type_id);
    }
  }, [formData.from_base_id, formData.equipment_type_id, isModalOpen]);

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

      const defaultFrom = user?.role === 'BASE_COMMANDER' ? user.base_id : (baseList[0]?.id || '');
      const defaultTo = baseList.find(b => b.id !== parseInt(defaultFrom, 10))?.id || '';

      setFormData(prev => ({
        ...prev,
        from_base_id: defaultFrom,
        to_base_id: defaultTo,
        equipment_type_id: equipList[0]?.id || ''
      }));
    } catch (err) {
      console.error('Failed to load bases/equipment:', err);
    }
  };

  const checkSourceStock = async (fromBaseId, equipTypeId) => {
    setCheckingStock(true);
    try {
      const res = await api.get('/inventory', {
        params: { base: fromBaseId, equipmentType: equipTypeId }
      });
      const item = res.data.data.items?.find(
        i => i.baseId === parseInt(fromBaseId, 10) && i.equipmentTypeId === parseInt(equipTypeId, 10)
      );
      setAvailableStock(item ? item.closingBalance : 0);
    } catch (err) {
      console.error('Stock check error:', err);
      setAvailableStock(0);
    } finally {
      setCheckingStock(false);
    }
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBase) params.base = selectedBase;
      if (selectedEquipment) params.equipmentType = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/transfers', { params });
      if (res.data.success) {
        setTransfers(res.data.data.transfers || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (parseInt(formData.from_base_id, 10) === parseInt(formData.to_base_id, 10)) {
      setError('Source base and destination base cannot be the same!');
      return;
    }

    if (availableStock !== null && formData.quantity > availableStock) {
      setError(`Insufficient inventory! Available stock at source base is ${availableStock}, but requested ${formData.quantity}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/transfers', formData);
      if (res.data.success) {
        setSuccess('Inter-base asset transfer completed successfully!');
        setIsModalOpen(false);
        fetchTransfers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete transfer');
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
    { header: 'Transfer Date', accessor: 'transfer_date', className: 'font-mono text-xs', render: (r) => r.transfer_date },
    { header: 'From Base', accessor: 'fromBase', render: (r) => <span className="font-semibold text-rose-300">{r.fromBase ? r.fromBase.name : '-'}</span> },
    { header: 'To Base', accessor: 'toBase', render: (r) => <span className="font-semibold text-blue-300">{r.toBase ? r.toBase.name : '-'}</span> },
    { header: 'Equipment Item', accessor: 'equipmentType', render: (r) => <span className="text-slate-200 font-medium">{r.equipmentType ? r.equipmentType.name : '-'}</span> },
    { header: 'Quantity', accessor: 'quantity', className: 'text-right font-mono font-bold text-amber-400', render: (r) => r.quantity.toLocaleString() },
    { header: 'Created By', accessor: 'creator', render: (r) => <span className="text-xs text-slate-400">{r.creator ? r.creator.name : '-'}</span> },
    { header: 'Remarks', accessor: 'remarks', render: (r) => <span className="text-xs text-slate-400 max-w-xs truncate block">{r.remarks || '-'}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-500" />
            Inter-Base Asset Transfers
          </h1>
          <p className="text-xs text-slate-400">
            Relocate military equipment between command bases with inventory verification
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Asset Transfer</span>
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
        <LoadingSpinner text="Loading transfer logs..." />
      ) : (
        <DataTable
          columns={columns}
          data={transfers}
          emptyMessage="No transfer history records match current criteria."
        />
      )}

      {/* New Transfer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initiate Inter-Base Transfer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-rose-400" /> Source Base (From)
              </label>
              <select
                required
                disabled={user?.role === 'BASE_COMMANDER'}
                value={formData.from_base_id}
                onChange={(e) => setFormData({ ...formData, from_base_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-75"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Destination Base (To)
              </label>
              <select
                required
                value={formData.to_base_id}
                onChange={(e) => setFormData({ ...formData, to_base_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id} disabled={parseInt(b.id, 10) === parseInt(formData.from_base_id, 10)}>
                    {b.name} ({b.location})
                  </option>
                ))}
              </select>
            </div>
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

          {/* Available Stock Indicator */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              <span>Available Inventory at Source Base:</span>
            </div>
            <span className="font-mono font-bold text-sm text-slate-100">
              {checkingStock ? 'Checking...' : (availableStock !== null ? availableStock.toLocaleString() : '0')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Transfer Quantity</label>
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
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Transfer Date
              </label>
              <input
                type="date"
                required
                value={formData.transfer_date}
                onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Remarks</label>
            <textarea
              rows="2"
              placeholder="Reason or dispatch note..."
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition"
            >
              {submitting ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransfersPage;
