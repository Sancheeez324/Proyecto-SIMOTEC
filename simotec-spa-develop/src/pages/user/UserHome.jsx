import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";

// TODO:
// 1. Crear una request para saber si el usuario tiene evaluaciones pendientes
// 2. Crear rutas (FRONTEND) para cada uno de los 'modulos' de usuario
const UserHome = () => {
  const [pendingTests, setPendingTests] = useState([]);

  useEffect(() => {
    fetchPendingTests();
  }, []);

  const fetchPendingTests = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const id = user.id;
    const response = await sendRequest(
      `${import.meta.env.VITE_API_URL}/users/${id}/pending-test`,
      "GET"
    );

    if (response.status === 200) {
      setPendingTests(response.data.pendingTests);
    } else if (response.status === 404) {
      console.log("no tests pending");
    } else {
      alert("Error al obtener evaluaciones pendientes");
    }
  };

  return (
    <Container fluid>
      <h1
        style={{
          textAlign: "center",
          margin: "2rem 0",
        }}
      >
        Users Dashboard Home (empleados)
      </h1>
      <Row>
        <Col>
          <h3>Mis Evaluaciones</h3>
          <p>Revisar mis evaluaciones y resultados</p>
          <Button variant="primary">Ver Evaluaciones</Button>
        </Col>
        <Col>
          <h3>PENDIENTES</h3>
          <p>Evaluaciones por realizar</p>
          <Button variant="primary">
            Realizar Evaluaciones{" "}
            {pendingTests.length > 0 ? `(${pendingTests.length})` : ""}{" 0 "}
          </Button>
        </Col>
        <Col>
          <h3>Confiuracion</h3>
          <p>Administrar mi cuenta</p>
          <Button variant="primary">Configuracion</Button>
        </Col>
      </Row>
    </Container>
  );
};

export default UserHome;
