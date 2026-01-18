import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { LayoutDashboard, BookOpen, HelpCircle, RefreshCw, User, Sun, Moon, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Solve from './pages/Solve';
import Revisions from './pages/Revisions';
import Learn from './pages/Learn';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Landing from './pages/Landing';
import './styles/index.css';
import './styles/landing.css';

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

// Home route shows Landing for unauthenticated, Dashboard for authenticated
function HomeRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // Wait for auth state to hydrate
  if (!isHydrated) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Landing />;
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
            {theme === 'dark' ? <Sun color='white' size={20} /> : <Moon size={20} />}
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
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/learn" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <BookOpen size={18} /> Learn
            </NavLink>
            <NavLink to="/questions" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <HelpCircle size={18} /> Questions
            </NavLink>
            <NavLink to="/revisions" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <RefreshCw size={18} /> Revisions
            </NavLink>
            <NavLink to="/profile" onClick={handleNavClick} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
              <User size={18} /> Profile
            </NavLink>
          </div>

          {/* Bottom section */}
          <div className="menu-bottom">
            <div className="menu-theme-toggle" onClick={toggleTheme}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
            <button className="menu-signout" onClick={handleSignOut}>
              <LogOut size={18} /> Sign Out
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
            <Route path="/landing" element={<Landing />} />

            <Route path="/" element={
              <HomeRoute />
            } />

            <Route path="/dashboard" element={
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
