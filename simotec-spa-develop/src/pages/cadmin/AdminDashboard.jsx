import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="container mt-5">
      <h1 className="mb-4">Dashboard empresa</h1>
      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Usuarios Registrados</Card.Title>
              <Card.Text>
                Total de usuarios: <strong>120</strong>
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
                Tests asignados recientemente: <strong>30</strong>
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
