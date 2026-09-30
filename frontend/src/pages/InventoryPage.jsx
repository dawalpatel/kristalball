import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Package, ShieldCheck } from 'lucide-react';

export const InventoryPage = () => {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedBase, setSelectedBase] = useState(user?.role === 'BASE_COMMANDER' ? user.base_id : '');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchFilterDropdowns();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedBase, selectedEquipment, startDate, endDate]);

  const fetchFilterDropdowns = async () => {
    try {
      const [basesRes, equipRes] = await Promise.all([
        api.get('/bases'),
        api.get('/equipment-types')
      ]);
      setBases(basesRes.data.data.bases || []);
      setEquipmentTypes(equipRes.data.data.equipmentTypes || []);
    } catch (err) {
      console.error('Failed to load filter dropdowns:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedBase) params.base = selectedBase;
      if (selectedEquipment) params.equipmentType = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/inventory', { params });
      if (res.data.success) {
        setInventoryItems(res.data.data.items || []);
        setSummary(res.data.data.summary || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate inventory data');
    } finally {
      setLoading(false);
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
    { header: 'Base', accessor: 'baseName', render: (r) => <span className="font-semibold text-slate-200">{r.baseName}</span> },
    { header: 'Equipment', accessor: 'equipmentName', render: (r) => <span className="text-slate-300 font-medium">{r.equipmentName}</span> },
    { header: 'Opening', accessor: 'openingBalance', className: 'text-right font-mono text-slate-400', render: (r) => r.openingBalance.toLocaleString() },
    { header: 'Purchases', accessor: 'purchases', className: 'text-right font-mono text-emerald-400', render: (r) => `+${r.purchases.toLocaleString()}` },
    { header: 'Transfer In', accessor: 'transferIn', className: 'text-right font-mono text-blue-400', render: (r) => `+${r.transferIn.toLocaleString()}` },
    { header: 'Transfer Out', accessor: 'transferOut', className: 'text-right font-mono text-rose-400', render: (r) => `-${r.transferOut.toLocaleString()}` },
    { header: 'Assigned', accessor: 'assigned', className: 'text-right font-mono text-amber-400', render: (r) => `-${r.assigned.toLocaleString()}` },
    { header: 'Expended', accessor: 'expended', className: 'text-right font-mono text-rose-500', render: (r) => `-${r.expended.toLocaleString()}` },
    { header: 'Closing Balance', accessor: 'closingBalance', className: 'text-right font-mono font-extrabold text-emerald-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800', render: (r) => r.closingBalance.toLocaleString() }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Equipment Inventory Matrix
          </h1>
          <p className="text-xs text-slate-400">
            Calculated stock ledger across opening balance, purchases, transfers, assignments, and expenditures
          </p>
        </div>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

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
        <LoadingSpinner text="Computing inventory balances from database transaction ledger..." />
      ) : (
        <div className="space-y-6">
          {/* Total Summary Ribbon */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center shadow-lg">
              <div className="p-2 bg-slate-950/60 rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Opening</p>
                <p className="text-sm font-bold font-mono text-slate-300">{summary.openingBalance}</p>
              </div>
              <div className="p-2 bg-emerald-950/40 rounded border border-emerald-900/40">
                <p className="text-[10px] text-emerald-400 uppercase font-semibold">Purchases</p>
                <p className="text-sm font-bold font-mono text-emerald-300">+{summary.purchases}</p>
              </div>
              <div className="p-2 bg-blue-950/40 rounded border border-blue-900/40">
                <p className="text-[10px] text-blue-400 uppercase font-semibold">Transfer In</p>
                <p className="text-sm font-bold font-mono text-blue-300">+{summary.transferIn}</p>
              </div>
              <div className="p-2 bg-rose-950/40 rounded border border-rose-900/40">
                <p className="text-[10px] text-rose-400 uppercase font-semibold">Transfer Out</p>
                <p className="text-sm font-bold font-mono text-rose-300">-{summary.transferOut}</p>
              </div>
              <div className="p-2 bg-slate-950/80 rounded border border-slate-700">
                <p className="text-[10px] text-slate-300 uppercase font-semibold">Net Movement</p>
                <p className={`text-sm font-bold font-mono ${summary.netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summary.netMovement >= 0 ? `+${summary.netMovement}` : summary.netMovement}
                </p>
              </div>
              <div className="p-2 bg-amber-950/40 rounded border border-amber-900/40">
                <p className="text-[10px] text-amber-400 uppercase font-semibold">Assigned</p>
                <p className="text-sm font-bold font-mono text-amber-300">-{summary.assigned}</p>
              </div>
              <div className="p-2 bg-rose-950/60 rounded border border-rose-900/60">
                <p className="text-[10px] text-rose-400 uppercase font-semibold">Expended</p>
                <p className="text-sm font-bold font-mono text-rose-300">-{summary.expended}</p>
              </div>
              <div className="p-2 bg-indigo-950/60 rounded border border-indigo-800">
                <p className="text-[10px] text-indigo-300 uppercase font-bold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Closing
                </p>
                <p className="text-sm font-extrabold font-mono text-emerald-400">{summary.closingBalance}</p>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            data={inventoryItems}
            emptyMessage="No equipment inventory balances calculated for selected base and date filters."
          />
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
