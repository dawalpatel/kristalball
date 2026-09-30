import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { FileText, ShieldAlert, Filter, RotateCcw } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, entityFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', className: 'font-mono text-xs w-12', render: (r) => `#${r.id}` },
    { header: 'Timestamp', accessor: 'created_at', className: 'font-mono text-xs text-slate-300', render: (r) => new Date(r.created_at).toLocaleString() },
    { header: 'User', accessor: 'user', render: (r) => (
      r.user ? (
        <div>
          <p className="font-semibold text-slate-200 text-xs">{r.user.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{r.user.email}</p>
        </div>
      ) : (
        <span className="text-slate-500 italic text-xs">System / Unauthenticated</span>
      )
    )},
    { header: 'Action', accessor: 'action', render: (r) => (
      <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${
        r.action.includes('FAILED') ? 'bg-red-950/60 text-red-300 border-red-800' :
        r.action.includes('CREATED') ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' :
        r.action.includes('SUCCESS') ? 'bg-blue-950/60 text-blue-300 border-blue-800' :
        'bg-slate-800 text-slate-300 border-slate-700'
      }`}>
        {r.action}
      </span>
    )},
    { header: 'Entity', accessor: 'entity_type', className: 'font-mono text-xs text-amber-400', render: (r) => r.entity_type },
    { header: 'Entity ID', accessor: 'entity_id', className: 'font-mono text-xs text-slate-400', render: (r) => r.entity_id ? `#${r.entity_id}` : '-' },
    { header: 'IP Address', accessor: 'ip_address', className: 'font-mono text-xs text-slate-400', render: (r) => r.ip_address || '127.0.0.1' },
    { header: 'Details', accessor: 'details', render: (r) => (
      <span className="text-xs font-mono text-slate-400 max-w-sm block truncate" title={r.details}>
        {r.details || '-'}
      </span>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            System Audit & Security Logs
          </h1>
          <p className="text-xs text-slate-400">
            Immutable log trail of all user authentication events, asset movements, and administrative changes
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span>ADMIN AUDIT TRAIL</span>
        </div>
      </div>

      <ErrorMessage message={error} onClose={() => setError('')} />

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-500" />
          <span>Audit Log Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Filter by Action</label>
            <input
              type="text"
              placeholder="e.g. LOGIN_SUCCESS, PURCHASE_CREATED"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Filter by Entity Type</label>
            <input
              type="text"
              placeholder="e.g. USER, TRANSFER, PURCHASE"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setActionFilter(''); setEntityFilter(''); }}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Audit Filters</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Reading audit logs from secure ledger..." />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          emptyMessage="No audit logs recorded for selected filters."
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
