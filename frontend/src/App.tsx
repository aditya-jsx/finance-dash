import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardSummary from './pages/DashboardSummary';
import RecordsManagement from './pages/RecordsManagement';
import UserManagement from './pages/UserManagement';

const queryClient = new QueryClient();

function App() {
  const token = localStorage.getItem('token');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={token ? <DashboardLayout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardSummary />} />
            <Route path="records" element={<RecordsManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
