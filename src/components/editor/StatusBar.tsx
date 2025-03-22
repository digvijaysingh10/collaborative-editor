'use client';

type StatusBarProps = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  users: string[];
};

export default function StatusBar({ status, users }: StatusBarProps) {
  return (
    <div className="flex justify-between items-center p-2 bg-gray-100 text-sm text-gray-600">
      <div>
        {status === 'saving' && 'Saving...'}
        {status === 'saved' && 'Saved'}
        {status === 'error' && 'Error saving'}
        {status === 'idle' && 'Ready'}
      </div>
      <div>
        Connected Users: {users.length} ({users.join(', ')})
      </div>
    </div>
  );
}