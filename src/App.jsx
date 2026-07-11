import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Dashboard from './pages/Dashboard/Dashboard';
import AssetRegistry from './pages/Assets/AssetRegistry';
import AssetDetails from './pages/Assets/AssetDetails';
import PublicAssetPage from './pages/Public/PublicAssetPage';
import IssueTracker from './pages/Issues/IssueTracker';
import ServiceHistory from './pages/History/ServiceHistory';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No Login Required */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/asset/:id/public" element={<PublicAssetPage />} />

        {/* Protected + Admin Routes - Login + Admin Role Required */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AdminRoute>
              <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto p-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/assets" element={<AssetRegistry />} />
                      <Route path="/assets/:id" element={<AssetDetails />} />
                      <Route path="/issues" element={<IssueTracker />} />
                      <Route path="/history" element={<ServiceHistory />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </AdminRoute>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;