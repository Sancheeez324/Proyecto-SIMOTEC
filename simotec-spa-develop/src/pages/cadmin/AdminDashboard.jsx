import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch("https://zv58zspkli.execute-api.us-east-2.amazonaws.com/dashboard/regular-users/count", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

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
    <div className="container mt-5">
      <h1 className="mb-4">Dashboard Empresa</h1>
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
              <Card.Text>
                Tests asignados recientemente: <strong>{loading ? "Cargando..." : recentTestsCount}</strong>
              </Card.Text>
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
    </div>
  );
};

export default AdminDashboard;