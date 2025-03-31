import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";
import { Link } from "react-router-dom";
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

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
    <div className="d-flex flex-column min-vh-100">
      {/* Header con logo Simotec */}
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      {/* Contenido principal */}
      <Container className="mt-4 flex-grow-1">
        <h1 className="text-center mb-5">Users Dashboard Home (empleados)</h1>
        <Row className="text-center">
          <Col>
            <h3>Mis Evaluaciones</h3>
            <p>Revisar mis evaluaciones y resultados</p>
            <Button variant="primary">Ver Evaluaciones</Button>
          </Col>
          <Col>
            <h3>PENDIENTES</h3>
            <p>Evaluaciones por realizar</p>
            <Button as={Link} to="/tests" variant="primary">
              Realizar Evaluaciones{" "}
              {pendingTests.length > 0 ? `(${pendingTests.length})` : ""}
            </Button>
          </Col>
          <Col>
            <h3>Configuración</h3>
            <p>Administrar mi cuenta</p>
            <Button variant="primary">Configuración</Button>
          </Col>
        </Row>
      </Container>

      {/* Footer con logo ECOS */}
      <footer className="footer">
        <div className="ecos-logo">
          <img src={logoEcos} alt="Ecos Logo" className="footer-logo" />
        </div>
        <div className="green-bar"></div>
      </footer>

      {/* Estilos */}
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
          width: 60px;
          height: auto;
        }

        .footer {
          width: 100%;
          text-align: center;
          margin-top: auto;
        }

        .ecos-logo {
          display: flex;
          justify-content: center;
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

export default UserHome;
