import { AuthProvider, useAuth } from './lib/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  // Simple routing based on auth state
  if (isAuthenticated) {
    return <Dashboard />;
  }
  
  return <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
