import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterBar = ({
  bases = [],
  equipmentTypes = [],
  selectedBase,
  setSelectedBase,
  selectedEquipment,
  setSelectedEquipment,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onReset,
  hideBaseFilter = false
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md mb-6">
      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Filter className="w-4 h-4 text-emerald-500" />
        <span>Inventory & Transaction Filters</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {!hideBaseFilter && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Base Location</label>
            <select
              value={selectedBase || ''}
              onChange={(e) => setSelectedBase(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Bases</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.location})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">Equipment Type</label>
          <select
            value={selectedEquipment || ''}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
