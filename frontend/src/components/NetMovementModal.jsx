import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import api from '../services/api';
import { ArrowUpRight, ArrowDownLeft, ShoppingBag } from 'lucide-react';

export const NetMovementModal = ({ isOpen, onClose, filters }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL, PURCHASE, TRANSFER_IN, TRANSFER_OUT

  useEffect(() => {
    if (isOpen) {
      fetchMovements();
    }
  }, [isOpen, filters]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.base) params.base = filters.base;
      if (filters.equipmentType) params.equipmentType = filters.equipmentType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [purchasesRes, transfersRes] = await Promise.all([
        api.get('/purchases', { params }),
        api.get('/transfers', { params })
      ]);

      const purchasesList = (purchasesRes.data.data.purchases || []).map(p => ({
        id: `p-${p.id}`,
        type: 'PURCHASE',
        label: 'Purchase (+)',
        movementSign: '+',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-950/40 border-emerald-800/60',
        date: p.purchase_date,
        baseName: p.base ? p.base.name : 'Unknown Base',
        equipmentName: p.equipmentType ? p.equipmentType.name : 'Unknown',
        quantity: p.quantity,
        reference: p.reference_number || 'N/A',
        remarks: p.remarks || '-'
      }));

      // For Transfers:
      // If user selected a specific base, show Transfer In as (+) if to_base_id == base, and Transfer Out as (-) if from_base_id == base.
      // If all bases, show both Transfer In and Transfer Out.
      const rawTransfers = transfersRes.data.data.transfers || [];
      const transferList = [];

      rawTransfers.forEach(t => {
        const fromBaseId = t.from_base_id;
        const toBaseId = t.to_base_id;
        const selectedBaseId = filters.base ? parseInt(filters.base, 10) : null;

        // If no base filter or selected base matches to_base_id
        if (!selectedBaseId || selectedBaseId === toBaseId) {
          transferList.push({
            id: `ti-${t.id}`,
            type: 'TRANSFER_IN',
            label: 'Transfer In (+)',
            movementSign: '+',
            color: 'text-blue-400',
            bgColor: 'bg-blue-950/40 border-blue-800/60',
            date: t.transfer_date,
            baseName: t.toBase ? t.toBase.name : 'Unknown Base',
            equipmentName: t.equipmentType ? t.equipmentType.name : 'Unknown',
            quantity: t.quantity,
            reference: `From: ${t.fromBase ? t.fromBase.name : 'Base ' + t.from_base_id}`,
            remarks: t.remarks || '-'
          });
        }

        // If no base filter or selected base matches from_base_id
        if (!selectedBaseId || selectedBaseId === fromBaseId) {
          transferList.push({
            id: `to-${t.id}`,
            type: 'TRANSFER_OUT',
            label: 'Transfer Out (-)',
            movementSign: '-',
            color: 'text-rose-400',
            bgColor: 'bg-rose-950/40 border-rose-800/60',
            date: t.transfer_date,
            baseName: t.fromBase ? t.fromBase.name : 'Unknown Base',
            equipmentName: t.equipmentType ? t.equipmentType.name : 'Unknown',
            quantity: t.quantity,
            reference: `To: ${t.toBase ? t.toBase.name : 'Base ' + t.to_base_id}`,
            remarks: t.remarks || '-'
          });
        }
      });

      const combined = [...purchasesList, ...transferList].sort((a, b) => new Date(b.date) - new Date(a.date));
      setMovements(combined);
    } catch (err) {
      console.error('Failed to fetch net movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = filterType === 'ALL'
    ? movements
    : movements.filter(m => m.type === filterType);

  const totalPurchases = movements.filter(m => m.type === 'PURCHASE').reduce((a, c) => a + c.quantity, 0);
  const totalTransferIn = movements.filter(m => m.type === 'TRANSFER_IN').reduce((a, c) => a + c.quantity, 0);
  const totalTransferOut = movements.filter(m => m.type === 'TRANSFER_OUT').reduce((a, c) => a + c.quantity, 0);
  const netMovementTotal = totalPurchases + totalTransferIn - totalTransferOut;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Net Movement Breakdown" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Key Movement Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg text-center">
            <p className="text-xs text-emerald-400 font-semibold uppercase">Purchases (+)</p>
            <p className="text-xl font-bold font-mono text-emerald-300">+{totalPurchases}</p>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/60 p-3 rounded-lg text-center">
            <p className="text-xs text-blue-400 font-semibold uppercase">Transfer In (+)</p>
            <p className="text-xl font-bold font-mono text-blue-300">+{totalTransferIn}</p>
          </div>
          <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-lg text-center">
            <p className="text-xs text-rose-400 font-semibold uppercase">Transfer Out (-)</p>
            <p className="text-xl font-bold font-mono text-rose-300">-{totalTransferOut}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-center">
            <p className="text-xs text-slate-300 font-semibold uppercase">Net Movement</p>
            <p className={`text-xl font-bold font-mono ${netMovementTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netMovementTotal >= 0 ? `+${netMovementTotal}` : netMovementTotal}
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 border-b border-slate-800 pb-3">
          {['ALL', 'PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Transactions' : type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        {loading ? (
          <LoadingSpinner text="Fetching movement logs..." />
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">Ref / Detail</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMovements.length > 0 ? (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${m.bgColor} ${m.color}`}>
                          {m.type === 'PURCHASE' && <ShoppingBag className="w-3.5 h-3.5" />}
                          {m.type === 'TRANSFER_IN' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {m.type === 'TRANSFER_OUT' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {m.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{m.date}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{m.baseName}</td>
                      <td className="px-4 py-3 text-slate-200">{m.equipmentName}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${m.color}`}>
                        {m.movementSign}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{m.reference}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{m.remarks}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No net movement transactions recorded for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NetMovementModal;
