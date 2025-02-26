import React, { useState } from "react";
import { Container, Form, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { sendRequest } from "../../utils/axios";
import { useAuth } from "../../context/Sessions";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("user");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const response = await axios.post("/api/login", { email, password, type });
    const response = await sendRequest(
      import.meta.env.VITE_API_URL + "/login",
      "POST",
      { email, password, type }
    );

    console.log("DEBUG: response", response);

    if (response.status === 200) {
      login(response.data.token, response.data.user, response.data.type);
      if (response.data.type === "admin") {
        navigate("/cadmin");
      } else {
        navigate("/userhome");
      }
    } else if (response.status === 401) {
      alert("Usuario o contraseña incorrectos.");
    } else {
      alert("Error interno del servidor.");
    }
  };

  // center form card
  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <Card style={{ width: "20rem" }}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="type">
              <Form.Label>Rol</Form.Label>
              <Form.Control
                as="select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingrese su email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Iniciar sesión
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
