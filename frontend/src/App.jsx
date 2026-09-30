import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import TransfersPage from './pages/TransfersPage';
import AssignmentsPage from './pages/AssignmentsPage';
import ExpendituresPage from './pages/ExpendituresPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Main Layout Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="purchases"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER']}>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="transfers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']}>
                  <TransfersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="assignments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="expenditures"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <ExpendituresPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
