import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [recentTestsCount, setRecentTestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener el token del localStorage
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.error("No se encontró token de autenticación");
          return;
        }
        
        // Configuración para incluir el token en las peticiones
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        
        // Petición para obtener el conteo solo de usuarios regulares (no cadmins ni superadmins)
        const usersResponse = await axios.get("/api/cadmin/regular-users/count", config);
        
        // Petición para obtener el conteo de tests asignados recientes
        const testsResponse = await axios.get("/api/cadmin/assigned-tests/count", config);
        
        setUserCount(usersResponse.data.count);
        setRecentTestsCount(testsResponse.data.count);
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Dashboard empresa</h1>
      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Usuarios Registrados</Card.Title>
              <Card.Text>
                Total de usuarios: <strong>{loading ? "Cargando..." : userCount}</strong>
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
              <Card.Text>
                Revisa el desempeño de los usuarios.
              </Card.Text>
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