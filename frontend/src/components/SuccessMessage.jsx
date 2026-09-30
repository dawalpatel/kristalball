import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export const SuccessMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between bg-emerald-950/70 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg shadow-md mb-4 animate-fade-in">
      <div className="flex items-center space-x-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-emerald-400 hover:text-emerald-200 p-1">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;
