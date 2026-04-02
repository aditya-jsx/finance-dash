import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { username, email, password } : { email, password };
      const { data } = await api.post(endpoint, payload);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-text mb-6">
          {isRegister ? 'Create an Account' : 'Welcome Back'}
        </h2>
        {error && (
          <div className="bg-danger/20 text-danger border border-danger/50 p-3 rounded mb-4 text-sm">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Username</label>
              <input 
                type="text" 
                className="input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required={isRegister} 
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Email</label>
            <input 
              type="email" 
              className="input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Password</label>
            <input 
              type="password" 
              className="input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-6">
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button 
            type="button" 
            className="text-primary text-sm hover:underline"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
