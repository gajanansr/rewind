import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Solve from './pages/Solve';
import Revisions from './pages/Revisions';
import Learn from './pages/Learn';
import Profile from './pages/Profile';
import Login from './pages/Login';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // Wait for auth state to hydrate from localStorage
  if (!isHydrated) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Navigation() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, []);

  // Don't render navbar until hydration is complete AND user is authenticated
  if (!isHydrated || !isAuthenticated) return null;

  const handleSignOut = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="nav-logo">
          Rewind
        </NavLink>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/learn" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Learn
          </NavLink>
          <NavLink to="/questions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Questions
          </NavLink>
          <NavLink to="/revisions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Revisions
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Profile
          </NavLink>
        </div>

        {/* Right side controls */}
        <div className="nav-actions">
          {/* Theme Toggle - Desktop only (also in menu for mobile) */}
          <button
            className="theme-toggle desktop-only"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Hamburger Menu Button */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <div className={`menu-panel ${menuOpen ? 'open' : ''}`}>
        <div className="menu-panel-content">
          <div className="menu-links">
            <NavLink to="/" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/learn" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              📚 Learn
            </NavLink>
            <NavLink to="/questions" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              ❓ Questions
            </NavLink>
            <NavLink to="/revisions" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              🔄 Revisions
            </NavLink>
            <NavLink to="/profile" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              👤 Profile
            </NavLink>
          </div>

          {/* Bottom section */}
          <div className="menu-bottom">
            <div className="menu-theme-toggle" onClick={toggleTheme}>
              <span>{theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            </div>
            <button className="menu-signout" onClick={handleSignOut}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-container">
          <Navigation />

          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/questions" element={
              <ProtectedRoute>
                <Questions />
              </ProtectedRoute>
            } />

            <Route path="/solve/:questionId" element={
              <ProtectedRoute>
                <Solve />
              </ProtectedRoute>
            } />

            <Route path="/revisions" element={
              <ProtectedRoute>
                <Revisions />
              </ProtectedRoute>
            } />

            <Route path="/learn" element={
              <ProtectedRoute>
                <Learn />
              </ProtectedRoute>
            } />



            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
