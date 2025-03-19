import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

// Importar los logos
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch(
          "https://zv58zspkli.execute-api.us-east-2.amazonaws.com/dashboard/regular-users/count",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener el conteo de usuarios");
        }

        const data = await response.json();
        setUserCount(data.count);
      } catch (error) {
        console.error("Error obteniendo el conteo de usuarios:", error);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Encabezado con Logo */}
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      {/* Contenido Principal */}
      <Container className="mt-5 flex-grow-1">
        <h1 className="mb-4 text-center">Dashboard Empresa</h1>
        <Row className="mb-4">
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Usuarios Registrados</Card.Title>
                <Card.Text>
                  Total de usuarios: <strong>{userCount}</strong>
                </Card.Text>
                <Button as={Link} to="/cadmin/users" variant="primary">
                  Gestionar Usuarios
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Tests Asignados</Card.Title>
                <Card.Text>Tests asignados recientemente: <strong>0</strong></Card.Text>
                <Button as={Link} to="/cadmin/assign-tests" variant="primary">
                  Asignar Tests
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Estadísticas de Evaluaciones</Card.Title>
                <Card.Text>Revisa el desempeño de los usuarios.</Card.Text>
                <Button as={Link} to="/cadmin/stats" variant="primary">
                  Ver Estadísticas
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Pie de Página con Logo ECOS encima de la línea verde */}
      <div className="footer">
        <div className="ecos-logo">
          <img src={logoEcos} alt="Ecos Logo" className="footer-logo" />
        </div>
        <div className="green-bar"></div>
      </div>

      {/* Estilos CSS en línea */}
      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          position: relative;
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

export default AdminDashboard;
