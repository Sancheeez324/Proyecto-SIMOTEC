import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Container, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

const PsicologoDashboard = () => {
  const [assignedTestsCount, setAssignedTestsCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se carga el conteo de usuarios con test ECE asignado
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No se encontró token de autenticación");
        }

        // Se asume que el endpoint /assigned-tests/count retorna el número
        // de usuarios únicos con el test ECE asignado.
        const testsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/assigned-tests/count`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!testsRes.ok) {
          throw new Error("Error al cargar conteo de tests asignados");
        }
        const testsData = await testsRes.json();
        setAssignedTestsCount(testsData.count);
      } catch (err) {
        console.error("Error detallado:", err);
        setError(err.message || "Error desconocido al obtener datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      {/* Contenido Principal */}
      <Container className="mt-5 flex-grow-1">
        <h1 className="mb-4 text-center">Dashboard Psicólogo</h1>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}. Por favor, verifica tu conexión e intenta nuevamente.
          </Alert>
        )}

        <Row className="mb-4 justify-content-center">
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>Usuarios con test ECE asignado</Card.Title>
                <Card.Text>
                  {loading
                    ? "Cargando..."
                    : `Total de usuarios: ${assignedTestsCount}`}
                </Card.Text>
                <Button as={Link} to="/psicologo/users" variant="primary">
                  Ver Usuarios
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
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
};

export default PsicologoDashboard;
