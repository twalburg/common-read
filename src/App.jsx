import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getStoredUser, setToken, setStoredUser, clearToken } from './lib/api.js';
import Login from './pages/Login.jsx';
import Groups from './pages/Groups.jsx';
import GroupDetail from './pages/GroupDetail.jsx';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('cr_theme');
    if (saved) return saved === 'dark';
    // Respect system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('cr_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="theme-toggle"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-top">
          <div style={{ width: 32 }} />
          <div>
            <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              Common Read
            </h1>
            <div className="subtitle">A chapter a day, together</div>
          </div>
          <ThemeToggle />
        </div>
        {user && (
          <div style={{ marginTop: 12 }}>
            <span className="text-small text-muted">{user.displayName}</span>
            {' · '}
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-muted)',
                cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Groups /> : <Navigate to="/login" />} />
        <Route path="/group/:groupId" element={user ? <GroupDetail /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());

  function login(token, userData) {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
  }

  function logout() {
    clearToken();
    localStorage.removeItem('cr_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
