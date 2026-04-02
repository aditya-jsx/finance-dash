import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, LogOut, Users } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.post('/auth/logout').catch(() => {}); // Optional implementation
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Records', path: '/records', icon: Receipt },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'Users', path: '/users', icon: Users });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-primary">FinanceDash</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-slate-800 hover:text-text'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="px-4 py-2 mb-2 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-text font-medium truncate">{user?.username || user?.email}</p>
            <p className="text-xs text-primary font-bold">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-muted hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-surface border-b border-slate-800 flex items-center px-4 md:hidden justify-between">
          <h1 className="text-xl font-bold text-primary">FinanceDash</h1>
          <button onClick={handleLogout} className="text-muted">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import api from '../api';
