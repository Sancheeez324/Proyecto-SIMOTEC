import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

export default function psicologoDashboard() {
  const [users, setUsers] = useState([]);
  const [assignedTests, setAssignedTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Función para obtener todos los usuarios (sin filtrar por cadmin)
  const fetchUsers = async (token) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/users/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Error al cargar usuarios");
    }
    const data = await response.json();
    return data.users || [];
  };

  // Función para obtener las asignaciones del test ECE
  const fetchAssignedTests = async (token) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ece/asignaciones`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Error al cargar tests asignados");
    }
    const data = await response.json();
    // El handler devuelve { assignments: [...] }
    return data.assignments || [];
  };

  // Cargar usuarios y asignaciones de forma paralela
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      const [allUsers, allAssignments] = await Promise.all([
        fetchUsers(token),
        fetchAssignedTests(token)
      ]);
      setUsers(allUsers);
      setAssignedTests(allAssignments);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setErrorMessage(error.message || "Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Verifica si un usuario tiene asignado el test ECE (asumiendo que test_id = 5)
  const hasECEAssigned = (userId) => {
    return assignedTests.some((t) => t.user_id === userId && t.test_id === 5);
  };

  // Navegar a la ruta de revisión del test ECE
  const handleReviewECE = (userId) => {
    navigate(`/psicologo/respuestas?test_id=5&user_id=${userId}`);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      {/* Contenido principal */}
      <Container className="mt-5 flex-grow-1">
        <h1 className="mb-4 text-center">Dashboard Psicólogo</h1>
        <h4 className="mb-4">Usuarios Registrados</h4>
        {isLoading ? (
          <div className="d-flex justify-content-center">
            <Spinner animation="border" />
          </div>
        ) : errorMessage ? (
          <Alert variant="danger">{errorMessage}</Alert>
        ) : (
          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Sector</th>
                <th>Cargo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const canReviewECE = hasECEAssigned(user.id);
                return (
                  <tr key={user.id}>
                    <td>{user.rut}</td>
                    <td>{user.nombre}</td>
                    <td>{user.email || "No disponible"}</td>
                    <td>{user.sector}</td>
                    <td>{user.cargo}</td>
                    <td>
                      {canReviewECE ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReviewECE(user.id)}
                        >
                          Revisar ECE
                        </Button>
                      ) : (
                        <span style={{ color: "#999" }}>Sin ECE asignado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Container>

      {/* Footer */}
      <div className="footer">
        <div className="ecos-logo">
          <img src={logoEcos} alt="Ecos Logo" className="footer-logo" />
        </div>
        <div className="green-bar"></div>
      </div>

      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          padding: 10px 20px;
        }
        .logo-container {
          display: flex;
          align-items: flex-start;
        }
        .logo-simotec {
          width: 70px;
          height: auto;
        }
        .footer {
          width: 100%;
          position: relative;
          bottom: 0;
          text-align: center;
          margin-top: auto;
        }
        .ecos-logo {
          margin-bottom: 5px;
        }
        .footer-logo {
          height: 30px;
          width: auto;
        }
        .green-bar {
          background-color: #7ed957;
          height: 40px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
