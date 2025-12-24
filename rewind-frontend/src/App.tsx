import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Solve from './pages/Solve';
import Revisions from './pages/Revisions';
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Navigation() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  if (!isAuthenticated) return null;

  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo">
        🔄 <span>Rewind</span>
      </NavLink>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/questions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Questions
        </NavLink>
        <NavLink to="/revisions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Revisions
        </NavLink>
        <button onClick={logout} className="btn btn-ghost">
          Logout
        </button>
      </div>
    </nav>
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
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
