import React from 'react';
import { X, History, LogIn, UploadCloud, Trash2, KeyRound, FolderPlus } from 'lucide-react';
import { ActivityItem, VaultInfo } from '../types/vault';

interface ActivityModalProps {
  vault: VaultInfo;
  activity: ActivityItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  vault,
  activity,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'LOGIN':
        return <LogIn className="w-4 h-4 text-emerald-400" />;
      case 'UPLOAD':
        return <UploadCloud className="w-4 h-4 text-cyan-400" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'PASSWORD_CHANGE':
        return <KeyRound className="w-4 h-4 text-purple-400" />;
      case 'ALBUM_CREATE':
        return <FolderPlus className="w-4 h-4 text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#0c1020] border border-gray-800 p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">Vault Activity Log</h2>
              <p className="text-xs text-gray-400">Audit trail of actions inside your vault</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
          {activity.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No activity recorded yet.</p>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-gray-800/80"
              >
                <div className="p-2 rounded-lg bg-black/50 border border-gray-800 shrink-0 mt-0.5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.description}</div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
