import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import api from '../api';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/users/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  if (currentUser.role !== 'ADMIN') {
    return <div className="text-center py-20 text-muted">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-slate-800">
        <h1 className="text-xl font-bold text-text flex items-center gap-2">
          <Users size={24} className="text-primary" />
          User Management
        </h1>
      </div>

      <div className="card flex-1 overflow-hidden flex flex-col pt-0 px-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/50 backdrop-blur sticky top-0">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-muted tracking-wider uppercase">User</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted tracking-wider uppercase">Joined</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted tracking-wider uppercase">Role</th>
                <th className="py-4 px-6 text-sm font-semibold text-muted tracking-wider uppercase">Status</th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-muted tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted">Loading...</td></tr>
              ) : users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-6 text-sm text-text font-medium">{u.email}</td>
                  <td className="py-3 px-6 text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6">
                    <select
                      className={`bg-surface border border-slate-700 px-2 py-1 rounded text-xs outline-none ${u.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      value={u.role}
                      disabled={u.id === currentUser.id}
                      onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="ANALYST">Analyst</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.status === 'ACTIVE' ? 'bg-secondary/10 text-secondary' : 'bg-slate-700/50 text-muted'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-secondary' : 'bg-muted'}`}></span>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      disabled={u.id === currentUser.id}
                      onClick={() => updateStatusMutation.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                        u.id === currentUser.id 
                          ? 'opacity-30 cursor-not-allowed border-slate-700 text-slate-500' 
                          : u.status === 'ACTIVE'
                            ? 'border-danger/30 text-danger hover:bg-danger/10'
                            : 'border-secondary/30 text-secondary hover:bg-secondary/10'
                      }`}
                    >
                      {u.id === currentUser.id ? 'Current User' : u.status === 'ACTIVE' ? 'Disable Access' : 'Enable Access'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
