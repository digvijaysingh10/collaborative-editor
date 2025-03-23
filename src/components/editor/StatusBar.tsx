'use client';

type StatusBarProps = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  users: string[];
};

export default function StatusBar({ status, users }: StatusBarProps) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            status === 'saving'
              ? 'bg-blue-100 text-blue-700 animate-pulse'
              : status === 'saved'
              ? 'bg-green-100 text-green-700'
              : status === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {status === 'saving' && 'Saving...'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && 'Error'}
          {status === 'idle' && 'Ready'}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-700">Collaborators:</span>
        <span className="text-gray-800 font-semibold">
          {users.length} {users.length > 0 && `(${users.join(', ')})`}
        </span>
      </div>
    </div>
  );
}