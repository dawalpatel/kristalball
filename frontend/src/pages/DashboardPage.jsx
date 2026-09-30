import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import NetMovementModal from '../components/NetMovementModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { 
  PackageCheck, 
  ArrowLeftRight, 
  UserCheck, 
  Flame, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedBase, setSelectedBase] = useState(user?.role === 'BASE_COMMANDER' ? user.base_id : '');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Net Movement Modal State
  const [isNetMovementModalOpen, setIsNetMovementModalOpen] = useState(false);

  useEffect(() => {
    fetchFilterDropdowns();
  }, []);

  useEffect(() => {
    fetchDashboardData();
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
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedBase) params.base = selectedBase;
      if (selectedEquipment) params.equipmentType = selectedEquipment;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/dashboard', { params });
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics');
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

  const summary = metrics?.summary || {
    openingBalance: 0,
    purchases: 0,
    transferIn: 0,
    transferOut: 0,
    netMovement: 0,
    assigned: 0,
    expended: 0,
    closingBalance: 0
  };

  const columns = [
    { header: 'Base Location', accessor: 'baseName', render: (r) => <span className="font-semibold text-slate-200">{r.baseName}</span> },
    { header: 'Equipment Name', accessor: 'equipmentName', render: (r) => <span className="text-slate-300">{r.equipmentName}</span> },
    { header: 'Category', accessor: 'category', render: (r) => <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">{r.category}</span> },
    { header: 'Opening', accessor: 'openingBalance', className: 'text-right font-mono', render: (r) => r.openingBalance.toLocaleString() },
    { header: 'Net Movement', accessor: 'netMovement', className: 'text-right font-mono font-semibold', render: (r) => <span className={r.netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{r.netMovement >= 0 ? `+${r.netMovement}` : r.netMovement}</span> },
    { header: 'Assigned', accessor: 'assigned', className: 'text-right font-mono text-amber-400', render: (r) => r.assigned.toLocaleString() },
    { header: 'Expended', accessor: 'expended', className: 'text-right font-mono text-rose-400', render: (r) => r.expended.toLocaleString() },
    { header: 'Closing Balance', accessor: 'closingBalance', className: 'text-right font-mono font-bold text-slate-100', render: (r) => <span className="text-emerald-400 font-extrabold">{r.closingBalance.toLocaleString()}</span> }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            Command Inventory Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-base asset distribution & historical audit calculation
          </p>
        </div>
        {user?.base && (
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            Assigned Base: <span className="text-emerald-400 font-bold">{user.base.name}</span>
          </div>
        )}
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      {/* Filter Bar */}
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
        <LoadingSpinner text="Computing inventory metrics from transaction history..." />
      ) : (
        <>
          {/* Dashboard Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Opening Balance"
              value={summary.openingBalance}
              icon={PackageCheck}
              color="slate"
              subtitle="Stock prior to start date"
            />
            <MetricCard
              title="Net Movement"
              value={summary.netMovement}
              icon={ArrowLeftRight}
              color={summary.netMovement >= 0 ? "emerald" : "rose"}
              clickable={true}
              onClick={() => setIsNetMovementModalOpen(true)}
              subtitle={`Purchases (+${summary.purchases}) | In (+${summary.transferIn}) | Out (-${summary.transferOut})`}
            />
            <MetricCard
              title="Assigned Stock"
              value={summary.assigned}
              icon={UserCheck}
              color="amber"
              subtitle="Issued to personnel"
            />
            <MetricCard
              title="Expended Stock"
              value={summary.expended}
              icon={Flame}
              color="rose"
              subtitle="Consumed / Depleted"
            />
            <MetricCard
              title="Closing Balance"
              value={summary.closingBalance}
              icon={ShieldCheck}
              color="indigo"
              subtitle="Current available reserve"
            />
          </div>

          {/* Detailed Base & Equipment Inventory Breakdown Table */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Asset Allocation Breakdown ({metrics?.items?.length || 0} Records)
              </h2>
            </div>

            <DataTable
              columns={columns}
              data={metrics?.items || []}
              emptyMessage="No equipment inventory records match selected date & base filters."
            />
          </div>
        </>
      )}

      {/* Net Movement Detail Popup */}
      <NetMovementModal
        isOpen={isNetMovementModalOpen}
        onClose={() => setIsNetMovementModalOpen(false)}
        filters={{
          base: selectedBase,
          equipmentType: selectedEquipment,
          startDate,
          endDate
        }}
      />
    </div>
  );
};

export default DashboardPage;
