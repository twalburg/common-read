import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getStoredUser, setToken, setStoredUser, clearToken } from './lib/api.js';
import Login from './pages/Login.jsx';
import Groups from './pages/Groups.jsx';
import GroupDetail from './pages/GroupDetail.jsx';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Common Read
        </h1>
        <div className="subtitle">A chapter a day, together</div>
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
