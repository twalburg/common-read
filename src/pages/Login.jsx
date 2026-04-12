import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import Onboarding from '../components/Onboarding.jsx';

export default function Login() {
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('cr_onboarded'));
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleOnboardingComplete() {
    localStorage.setItem('cr_onboarded', 'true');
    setShowOnboarding(false);
    setMode('register');
  }

  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);

    try {
      if (mode === 'forgot') {
        await auth.requestReset(username, newPassword);
        setSuccessMsg('Reset request submitted! Ask your group leader to approve it, then try signing in with your new password.');
        setNewPassword('');
      } else {
        let data;
        if (mode === 'register') {
          data = await auth.register(username, password, displayName);
        } else {
          data = await auth.login(username, password);
        }
        login(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  }

  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
          {mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={mode === 'forgot' ? 'Enter your username' : 'Choose a username'} autoComplete="username" required />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How your name appears to others" required />
            </div>
          )}

          {mode === 'forgot' ? (
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Choose a new password (6+ chars)" autoComplete="new-password" required />
            </div>
          ) : (
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? '6+ characters' : 'Enter password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}
          {successMsg && <div className="success-msg">{successMsg}</div>}

          <div className="mt-16">
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Submit Reset Request' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center mt-16" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                Don't have an account? Create one
              </button>
              <button onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                Forgot password?
              </button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
