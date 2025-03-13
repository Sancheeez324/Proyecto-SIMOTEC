import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { useAuth, AuthProvider } from "./context/Sessions.jsx";
import Navigation from "./components/Navigation.jsx";

const Landing = lazy(() => import("./pages/landing/Landing.jsx"));
const Login = lazy(() => import("./pages/login/Login.jsx"));
const TestComponent = lazy(() => import("./pages/test/TestComponent.jsx"));

// Importaciones para el flujo de Cadmin
const AdminDashboard = lazy(() => import("./pages/cadmin/AdminDashboard.jsx"));
const UserList = lazy(() => import("./pages/cadmin/UserList.jsx"));
const AssignTest = lazy(() => import("./pages/cadmin/AssignTest.jsx"));

// Ruta de usuario
const UserHome = lazy(() => import("./pages/user/UserHome.jsx"));

const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/" />;
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

          </Routes>
        </Suspense>
      </AuthProvider>
    </Container>
  );
}

export default App;

ProtectedRoute.propTypes = Route.propTypes;
