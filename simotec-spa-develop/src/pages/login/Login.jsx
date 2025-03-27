import React, { useState } from "react";
import { Container, Form, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { sendRequest } from "../../utils/axios";
import { useAuth } from "../../context/Sessions";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cadmin"); // Valor inicial: cadmin
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("API URL:", import.meta.env.VITE_API_URL);
    
    console.log("Rol a enviar:", role);
    // Envía la solicitud con el rol actual
    const response = await sendRequest(
      import.meta.env.VITE_API_URL + "/auth/login",
      "POST",
      { email, password, role }
    );

    console.log("Respuesta del backend:", response.data);

    if (response.status === 200) {
      // Guardar el token en el contexto (Sessions)
      login(response.data.token, response.data.user, response.data.role);
      console.log("Rol recibido:", response.data.role);

      // Redirige según el rol
      if (role === "cadmin") {
        navigate("/cadmin"); // Vista para cadmin
      } else if (role === "psicologo") {
        navigate("/psicologo"); // Vista para psicólogo
      } else {
        // asumiendo "user"
        navigate("/userhome"); // Vista para trabajador
      }
    } else if (response.status === 401) {
      alert("Usuario o contraseña incorrectos.");
    } else {
      alert("Error interno del servidor.");
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <div
        style={{
          textAlign: "left",
          marginBottom: "20px",
          position: "absolute",
          top: "90px",
          left: "20px",
          width: "900px",
        }}
      >
        <img src="src/fotos/IconSinFondo.png" alt="Simotec Logo" className="w-25" />
      </div>

      <Card style={{ width: "20rem", marginTop: "70px" }}>
        <Card.Body>
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <h3 style={{ color: "#007bff" }}>
              {role === "cadmin"
                ? "Empresa (Cadmin)"
                : role === "psicologo"
                ? "Psicólogo"
                : "Dashboard Trabajador"}
            </h3>
            <h4>Inicio de sesión</h4>
          </div>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="email">
              <Form.Control
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-3"
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Control
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-3"
              />
            </Form.Group>

            {/* Selector de rol */}
            <Form.Group controlId="role" className="mb-3">
              <Form.Label>Seleccione su rol</Form.Label>
              <Form.Control
                as="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="cadmin">Empresa (Cadmin)</option>
                <option value="psicologo">Psicólogo</option>
                <option value="user">Trabajador</option>
              </Form.Control>
            </Form.Group>

            <Button variant="success" type="submit" className="w-100 mb-2">
              Ingresar
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div
        style={{
          position: "fixed",
          bottom: "0",
          width: "100%",
          height: "30px",
          background: "lightgreen",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img
            src="src/fotos/Icon2SinFondo.png"
            alt="Simotec Logo"
            style={{ width: "60px", height: "auto" }}
          />
        </div>
      </div>
    </Container>
  );
};

export default Login;
