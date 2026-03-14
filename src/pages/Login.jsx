import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await auth.register(username, password, displayName);
      } else {
        data = await auth.login(username, password);
      }
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How your name appears to others"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isRegister ? '6+ characters' : 'Enter password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div className="mt-16">
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center mt-16">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{
              background: 'none', border: 'none', color: 'var(--color-accent)',
              cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
