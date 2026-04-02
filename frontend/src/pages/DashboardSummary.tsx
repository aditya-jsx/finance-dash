import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity } from 'lucide-react';
import api from '../api';

export default function DashboardSummary() {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary');
      return data;
    }
  });

  if (isLoading) return <div className="text-muted flex justify-center py-20">Loading...</div>;
  if (error) return <div className="text-danger flex justify-center py-20">Failed to load dashboard</div>;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text mb-6">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
            <h3 className="text-muted font-medium">Total Income</h3>
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-text">$ {(summary?.totalIncome || 0).toLocaleString()}</p>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
            <h3 className="text-muted font-medium">Total Expenses</h3>
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-text">$ {(summary?.totalExpenses || 0).toLocaleString()}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
            <h3 className="text-muted font-medium">Net Balance</h3>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-text">$ {(summary?.netBalance || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Monthly Activity Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary?.monthlyTrends?.slice().reverse()}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickFormatter={(str: string) => new Date(str).toLocaleDateString('en-US', {month: 'short'})} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC' }} />
                <Area type="monotone" dataKey={(d: any) => d.type === 'INCOME' ? d.total : 0} name="Income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey={(d: any) => d.type === 'EXPENSE' ? d.total : 0} name="Expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-text mb-6">Category Breakdown</h3>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            {summary?.categoryWise?.length > 0 ? (
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={summary?.categoryWise}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                  >
                    {summary?.categoryWise.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#F8FAFC' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted text-sm pb-10">No category data</div>
            )}
            
            {/* Custom Legend */}
            <div className="w-full flex justify-center gap-4 flex-wrap text-xs text-muted mt-2">
               {summary?.categoryWise?.slice(0, 4).map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.category}
                </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
