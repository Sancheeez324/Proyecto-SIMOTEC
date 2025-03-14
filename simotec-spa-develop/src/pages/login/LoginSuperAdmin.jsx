import React, { useState } from "react";
import { Container, Form, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { sendRequest } from "../../utils/axios";
import { useAuth } from "../../context/Sessions";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await sendRequest(
      import.meta.env.VITE_API_URL + "/auth/login",
      "POST",
      { email, password, role: "super_admin" }
    );

    console.log("Respuesta del backend:", response.data);

    if (response.status === 200) {
      login(response.data.token, response.data.user, response.data.role);
      navigate("/superadmin/SuperAdminHome"); // Redirige a la página de superadmin
    } else if (response.status === 401) {
      alert("Usuario o contraseña incorrectos.");
    } else {
      alert("Error interno del servidor.");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Card style={{ width: "20rem" }}>
        <Card.Body>
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <h3 style={{ color: "#007bff" }}>SuperAdmin Panel</h3>
            <h4>Inicio de sesión</h4>
          </div>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="email">
              <Form.Control type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3" />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Control type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-3" />
            </Form.Group>
            <Button variant="success" type="submit" className="w-100">Ingresar</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SuperAdminLogin;