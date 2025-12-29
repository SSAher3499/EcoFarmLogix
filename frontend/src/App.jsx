import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FarmDetail from './pages/FarmDetail';
import FarmHistory from './pages/FarmHistory';
import AddFarm from './pages/AddFarm';
import AutomationRules from './pages/AutomationRules';
import DeviceManagement from './pages/DeviceManagement';
import TeamManagement from './pages/TeamManagement';
import Schedules from './pages/Schedules';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Permission-based route wrapper
function PermissionRoute({ children, permission, fallback = "/dashboard" }) {
  const { hasPermission, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (!hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }
  
  return children;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/farms" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Add Farm - Super Admin only */}
        <Route path="/farms/new" element={
          <ProtectedRoute>
            <PermissionRoute permission="createFarm">
              <AddFarm />
            </PermissionRoute>
          </ProtectedRoute>
        } />
        
        <Route path="/farms/:farmId" element={
          <ProtectedRoute>
            <FarmDetail />
          </ProtectedRoute>
        } />

        {/* Automation - requires viewAutomation permission */}
        <Route path="/farms/:farmId/automation" element={
          <ProtectedRoute>
            <PermissionRoute permission="viewAutomation" fallback="/dashboard">
              <AutomationRules />
            </PermissionRoute>
          </ProtectedRoute>
        } />

        {/* Schedules - requires viewAutomation permission */}
        <Route path="/farms/:farmId/schedules" element={
          <ProtectedRoute>
            <PermissionRoute permission="viewAutomation" fallback="/dashboard">
              <Schedules />
            </PermissionRoute>
          </ProtectedRoute>
        } />

        {/* Devices - Super Admin only */}
        <Route path="/farms/:farmId/devices" element={
          <ProtectedRoute>
            <PermissionRoute permission="viewDeviceManagement" fallback="/dashboard">
              <DeviceManagement />
            </PermissionRoute>
          </ProtectedRoute>
        } />

        {/* Team - requires viewTeam permission */}
        <Route path="/farms/:farmId/team" element={
          <ProtectedRoute>
            <PermissionRoute permission="viewTeam" fallback="/dashboard">
              <TeamManagement />
            </PermissionRoute>
          </ProtectedRoute>
        } />

        <Route path="/farms/:farmId/history" element={
          <ProtectedRoute>
            <FarmHistory />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-700">Settings</h2>
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </ProtectedRoute>
        } />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-700 mb-4">404</h1>
              <p className="text-gray-500">Page not found</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;