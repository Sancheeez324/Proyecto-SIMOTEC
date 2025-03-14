import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { useAuth, AuthProvider } from "./context/Sessions.jsx";
import Navigation from "./components/Navigation.jsx";

const Landing = lazy(() => import("./pages/landing/Landing.jsx"));
const Login = lazy(() => import("./pages/login/Login.jsx"));
const LoginSuperAdmin = lazy(() => import ("./pages/login/LoginSuperAdmin.jsx"));
const TestComponent = lazy(() => import("./pages/test/TestComponent.jsx"));

// Importaciones para el flujo de Cadmin
const AdminDashboard = lazy(() => import("./pages/cadmin/AdminDashboard.jsx"));
const UserList = lazy(() => import("./pages/cadmin/UserList.jsx"));
const AssignTest = lazy(() => import("./pages/cadmin/AssignTest.jsx"));

// Ruta para superadmin
const SuperAdminHome = lazy(() => import("./pages/super_admin/SuperAdminHome.jsx"));

// Ruta de usuario
const UserHome = lazy(() => import("./pages/user/UserHome.jsx"));

const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/" />;
};


const SuperAdminProtectedRoute = ({ element, ...rest }) => {
  const { hasRole } = useAuth();
  return hasRole("super_admin") ? element : <Navigate to="/" />;
};

// Ruta para el login de superadmin (solo accesible manualmente)
const SuperAdminLoginRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();
  // Si el usuario ya está autenticado, redirige a la página de superadmin
  return isAuthenticated && role === "super_admin"  ? <Navigate to="/superadmin" /> : element;
};

function App() {
  return (
    <Container fluid>
      <AuthProvider>
        <Navigation />
        <Suspense fallback={<Spinner animation="border" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/contact" element={<h1>Contact</h1>} />
            <Route path="/login" element={<Login />} />
            {/* Ruta de login de superadmin (solo accesible manualmente) */}
            <Route
              path="/superadmin"
              element={<SuperAdminLoginRoute element={<LoginSuperAdmin />} />}
            />


            {/* Test Component */}
            <Route path="/test" element={<TestComponent />} />

            {/* Protected Routes */}
            {/* RUTA PARA USUARIOS */}
            <Route
              path="/userhome"
              element={<ProtectedRoute element={<UserHome />} />}
            />

            {/* RUTAS PARA ADMINISTRADORES */}
            <Route
              path="/cadmin"
              element={<ProtectedRoute element={<AdminDashboard />} />}
            />
            <Route
              path="/cadmin/users"
              element={<ProtectedRoute element={<UserList />} />}
            />
            <Route
              path="/cadmin/assign-tests"
              element={<ProtectedRoute element={<AssignTest />} />}
            />
            {/* RUTAS PARA SUPERADMINS */}
            <Route
              path="/superadmin/SuperAdminHome"
              element={<SuperAdminProtectedRoute element={<SuperAdminHome />} />}
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Container>
  );
}

export default App;

ProtectedRoute.propTypes = Route.propTypes;
