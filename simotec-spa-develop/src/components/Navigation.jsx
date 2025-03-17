import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom"; // Usamos Link en lugar de <a>
import { useAuth } from "../context/Sessions.jsx"; // El hook de autenticación


const Navigation = () => {
  const { isAuthenticated, userType, logout } = useAuth();

  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Brand as={Link} to="/">
        SEGURIDAD SIMOTEC
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/">
            Inicio
          </Nav.Link>
          <Nav.Link as={Link} to="/contact">
            Contacto
          </Nav.Link>
          {isAuthenticated && userType === "cadmin" && (
            <Nav.Link as={Link} to="/cadmin">
              Admin Dashboard
            </Nav.Link>
          )}
          {isAuthenticated && userType === "super_admin" && (
            <Nav.Link as={Link} to="/superadmin/SuperAdminHome">
              Admin Dashboard
            </Nav.Link>
          )}
          {isAuthenticated && userType === "user" && (
            <Nav.Link as={Link} to="/userhome">
              User Dashboard
            </Nav.Link>
          )}
        </Nav>
        <Nav>
          {isAuthenticated ? (
            <Nav.Link as={Link} onClick={logout}>
              Cerrar sesión
            </Nav.Link>
          ) : (
            <Nav.Link as={Link} to="/login">
              Iniciar sesión
            </Nav.Link>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation;
