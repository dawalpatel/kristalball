import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

export const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between bg-red-950/70 border border-red-800 text-red-200 px-4 py-3 rounded-lg shadow-md mb-4 animate-fade-in">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-200 p-1">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
