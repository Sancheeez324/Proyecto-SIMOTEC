import React, { useState } from "react";
import { Container, Form, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { sendRequest } from "../../utils/axios";
import { useAuth } from "../../context/Sessions";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cadmin"); // Estado para manejar el rol
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("API URL:", import.meta.env.VITE_API_URL);

    // Envía la solicitud con el rol actual
    const response = await sendRequest(
      import.meta.env.VITE_API_URL + "/auth/login",
      "POST",
      { email, password, role } // Usa el estado `role`
    );

    console.log("Respuesta del backend:", response.data);

    if (response.status === 200) {
      login(response.data.token, response.data.user, response.data.role);
      console.log("Rol recibido:", response.data.role);

      // Redirige según el rol
      if (role === "cadmin") {
        navigate("/cadmin"); // Redirige a /cadmin para el rol "cadmin"
      } else if (role === "user") {
        navigate("/userhome"); // Redirige a /userhome para el rol "user"
      }
    } else if (response.status === 401) {
      alert("Usuario o contraseña incorrectos.");
    } else {
      alert("Error interno del servidor.");
    }
  };

  // Cambia el rol entre "cadmin" y "user" cuando se hace clic en el botón
  const toggleRole = () => {
    setRole((prevRole) => (prevRole === "cadmin" ? "user" : "cadmin"));
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
        <img src="src\fotos\IconSinFondo.png" alt="Simotec Logo" className="w-25" />
      </div>

      <Card style={{ width: "20rem", marginTop: "70px" }}>
        <Card.Body>
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            {/* Texto condicional */}
            <h3 style={{ color: "#007bff" }}>
              {role === "cadmin" ? "Empresa" : "Dashboard Trabajador"}
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
            <Button variant="success" type="submit" className="w-100 mb-2">
              Ingresar
            </Button>
            {/*<Button
              variant="success"
              className="w-100"
              style={{ backgroundColor: "#4caf50" }}
            >
              Registrarse
            </Button> */}
            
            {/* Botón para cambiar entre roles */}
            <Button
              variant={role === "user" ? "primary" : "outline-primary"} // Cambia el estilo si el rol es "user"
              className="w-100 mt-2"
              onClick={toggleRole}
            >
              {role === "cadmin" ? "Login trabajador" : "Login empresa"}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div
        style={{
          position: "fixed", // Fija la barra en la parte inferior
          bottom: "0", // Pegada al fondo
          width: "100%", // Ocupa todo el ancho
          height: "30px", // Altura de la barra
          background: "lightgreen", // Color de fondo
        }}
      >
        {/* Imagen por encima de la barra */}
        <div
          style={{
            position: "absolute", // Permite superponer la imagen
            bottom: "50px", // Coloca la imagen justo encima de la barra
            left: "50%", // Centra horizontalmente
            transform: "translateX(-50%)", // Ajusta el centrado
          }}
        >
          <img
            src="src/fotos/Icon2SinFondo.png"
            alt="Simotec Logo"
            style={{ width: "60px", height: "auto" }} // Ajusta el tamaño de la imagen
          />
        </div>
      </div>
    </Container>
  );
};

export default Login;