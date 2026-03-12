// App.jsx (or your main routing component)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddCategoryModal from './pages/AddCategoryModal';
import OrdersPage from './pages/OrdersPage';
import CategoriesPage from './pages/CategoriesPage';
// import ShipRocketDashboard from './pages/ShipRocketDashboard';
import CustomerPage from './pages/CustomerPage';
import Settings from './pages/Settings'; // Add this import

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
     <Route 
              path="/categories"  // Changed from /addcategorymodal
              element={
                <ProtectedRoute adminOnly={true}>
                  <CategoriesPage />  {/* Use the page component */}
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Products />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <OrdersPage />
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="/shiprocket" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <ShipRocketDashboard />
                </ProtectedRoute>
              } 
            /> */}
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <CustomerPage />
                </ProtectedRoute>
              } 
            />
            {/* Add Settings route */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;