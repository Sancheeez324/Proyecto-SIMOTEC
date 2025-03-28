import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { useAuth, AuthProvider } from "./context/Sessions.jsx";
import Navigation from "./components/Navigation.jsx";

// Carga diferida de componentes
const Landing = lazy(() => import("./pages/landing/Landing.jsx"));
const Login = lazy(() => import("./pages/login/Login.jsx"));
const LoginSuperAdmin = lazy(() => import("./pages/login/LoginSuperAdmin.jsx"));

// Importaciones para el flujo de Cadmin
const AdminDashboard = lazy(() => import("./pages/cadmin/AdminDashboard.jsx"));
const UserList = lazy(() => import("./pages/cadmin/UserList.jsx"));
const AssignTest = lazy(() => import("./pages/cadmin/AssignTest.jsx"));

// Importaciones para el flujo de Tests
const TestDashboard = lazy(() => import("./pages/tests/TestDashboard.jsx"));
const TakeTest = lazy(() => import("./pages/tests/TakeTest.jsx"));
const TestResult = lazy(() => import("./pages/tests/TestResult.jsx"));

// Ruta para superadmin
const SuperAdminHome = lazy(() => import("./pages/super_admin/SuperAdminHome.jsx"));

// Ruta de usuario
const UserHome = lazy(() => import("./pages/user/UserHome.jsx"));

// Importaciones para el flujo de Psicólogo
const PsicologoDashboard = lazy(() => import("./pages/psicologo/psicologoDashboard.jsx"));
const PsicologoUserList = lazy(() => import("./pages/psicologo/psicologoUserList.jsx"));

const ProtectedRoute = ({ element, requiredRole }) => {
  const { isAuthenticated, hasRole } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/" />;
  if (requiredRole && !hasRole(requiredRole)) return <Navigate to="/userhome" />;
  
  return element;
};

function App() {
  return (
    <AuthProvider>
      <Navigation />
      <Container fluid style={{ padding: 0, marginTop: '70px' }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}>
            <Spinner animation="border" />
          </div>
        }>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/superadmin-login" element={<LoginSuperAdmin />} />

            {/* Rutas de usuario */}
            <Route path="/userhome" element={
              <ProtectedRoute element={<UserHome />} requiredRole="user" />
            } />
            <Route path="/tests" element={
              <ProtectedRoute element={<TestDashboard />} requiredRole="user" />
            } />
            <Route path="/take-test/:assigned_test_id" element={
              <ProtectedRoute element={<TakeTest />} requiredRole="user" />
            } />
            <Route path="/test-result/:assigned_test_id" element={
              <ProtectedRoute element={<TestResult />} requiredRole="user" />
            } />

            {/* Rutas de administrador */}
            <Route path="/cadmin" element={
              <ProtectedRoute element={<AdminDashboard />} requiredRole="cadmin" />
            } />
            <Route path="/cadmin/users" element={
              <ProtectedRoute element={<UserList />} requiredRole="cadmin" />
            } />
            <Route path="/cadmin/assign-tests" element={
              <ProtectedRoute element={<AssignTest />} requiredRole="cadmin" />
            } />

            {/* Rutas de superadmin */}
            <Route path="/superadmin" element={
              <ProtectedRoute element={<SuperAdminHome />} requiredRole="super_admin" />
            } />

            {/* Rutas de psicólogo */}
            <Route path="/psicologo/dashboard" element={
              <ProtectedRoute element={<PsicologoDashboard />} requiredRole="psicologo" />
            } />
            <Route path="/psicologo/users" element={
              <ProtectedRoute element={<PsicologoUserList />} requiredRole="psicologo" />
            } />
          </Routes>
        </Suspense>
      </Container>
    </AuthProvider>
  );
}

export default App;
