import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Filter, Share2 } from 'lucide-react';
import api from '../api';

export default function RecordsManagement() {
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // New Record Stats
  const [newRecord, setNewRecord] = useState({
    amount: '', type: 'EXPENSE', category: '', date: '', notes: ''
  });

  // Share Form State
  const [shareUsername, setShareUsername] = useState('');
  const [shareRole, setShareRole] = useState('VIEWER');
  const [shareError, setShareError] = useState('');

  const { data: records, isLoading } = useQuery({
    queryKey: ['records'],
    queryFn: async () => {
      const { data } = await api.get('/records');
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/records', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsModalOpen(false);
      setNewRecord({ amount: '', type: 'EXPENSE', category: '', date: '', notes: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, username, role }: any) => api.post(`/records/${id}/share`, { username, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setIsShareModalOpen(false);
      setShareUsername('');
      setShareRole('VIEWER');
      setShareError('');
    },
    onError: (err: any) => {
      setShareError(err.response?.data?.error || 'Failed to share');
    }
  });

  const filteredRecords = filterType === 'ALL' 
    ? records 
    : records?.filter((r: any) => r.type === filterType);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newRecord,
      amount: parseFloat(newRecord.amount),
      date: newRecord.date ? new Date(newRecord.date).toISOString() : undefined
    });
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    shareMutation.mutate({ id: selectedRecordId, username: shareUsername, role: shareRole });
  };

  const getRecordAccess = (record: any) => {
    if (record.userId === currentUser.id) return 'OWNER';
    const shared = record.accessRecords?.find((a: any) => a.user?.username === currentUser.username);
    return shared ? shared.role : 'UNKNOWN';
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-slate-800">
        <h1 className="text-xl font-bold text-text">Records Management</h1>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          New Record
        </button>
      </div>

      <div className="card flex-1 overflow-hidden flex flex-col pt-0 px-0">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2 text-muted">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter by Type:</span>
          </div>
          <select 
            className="bg-surface border border-slate-700 px-3 py-1.5 rounded-md text-sm outline-none cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Records</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-slate-800/50 backdrop-blur sticky top-0 shadow-sm border-b border-slate-800">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-muted uppercase">Date</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted uppercase">Type</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted uppercase">Category</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted uppercase">Amount</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted uppercase">Creator</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted uppercase">Access</th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted">Loading records...</td></tr>
              ) : filteredRecords?.map((record: any) => {
                const access = getRecordAccess(record);
                const canEdit = access === 'OWNER' || access === 'EDITOR';
                return (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-6 text-sm text-text whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        record.type === 'INCOME' ? 'bg-secondary/10 text-secondary' : 'bg-danger/10 text-danger'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-text font-medium">{record.category}</td>
                    <td className="py-3 px-6 text-sm text-text font-bold">
                      ${record.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-3 px-6 text-sm text-muted whitespace-nowrap">{record.user?.username || record.user?.email}</td>
                    <td className="py-3 px-6 text-sm text-muted whitespace-nowrap">
                      {access === 'OWNER' ? <span className="text-primary font-bold">Owner</span> : access}
                    </td>
                    <td className="py-3 px-6 text-center space-x-2 whitespace-nowrap">
                      {access === 'OWNER' && (
                        <button
                          onClick={() => {
                            setSelectedRecordId(record.id);
                            setIsShareModalOpen(true);
                          }}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Share Record"
                        >
                          <Share2 size={16} />
                        </button>
                      )}
                      
                      {canEdit ? (
                        <button 
                          onClick={() => deleteMutation.mutate(record.id)}
                          className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-muted">Viewer Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRecords?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="card w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Share Record</h2>
            {shareError && <div className="text-danger mb-3 text-sm">{shareError}</div>}
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Username</label>
                <input 
                  type="text" required className="input" 
                  value={shareUsername} onChange={e => setShareUsername(e.target.value)} 
                  placeholder="exact_username"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Access Level</label>
                <select className="input cursor-pointer" value={shareRole} onChange={e => setShareRole(e.target.value)}>
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setIsShareModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={shareMutation.isPending}>
                  {shareMutation.isPending ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Record</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Type</label>
                  <select className="input cursor-pointer" value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value})}>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Amount ($)</label>
                  <input type="number" step="0.01" required className="input" min="0"
                         value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Date</label>
                  <input type="date" className="input" required
                         value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Category</label>
                  <input type="text" required className="input" placeholder="e.g. Salary, Rent"
                         value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Notes (Optional)</label>
                <input type="text" className="input" 
                       value={newRecord.notes} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
