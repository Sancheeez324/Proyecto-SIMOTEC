import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

export default function PsicologoUserList() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ece/asignaciones`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar asignaciones");
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error al obtener asignaciones:", error);
      setErrorMessage(error.message || "Error desconocido al obtener asignaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewECE = (userId) => {
    navigate(`/psicologo/respuestas?test_id=5&user_id=${userId}`);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      <Container className="mt-5 flex-grow-1">
        <h1 className="mb-4">Usuarios con ECE Asignado</h1>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.assigned_id}>
                  <td>{assignment.user_rut}</td>
                  <td>{assignment.user_name}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReviewECE(assignment.user_id)}
                    >
                      Revisar ECE
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>

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
