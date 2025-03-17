import React, { useState } from "react";
import { Container, Form, Card, Button } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";
import { useAuth } from "../../context/Sessions";

const CreateCadmin = () => {
  const { user } = useAuth(); // Obtener el ID del superadmin logueado
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nombreSupervisor, setNombreSupervisor] = useState("");
  const [sector, setSector] = useState("mineria");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      email,
      password,
      nombre_empresa: nombreEmpresa,
      nombre_supervisor: nombreSupervisor,
      sector,
      superadmin_id: user?.id, // Evita errores si `user` es undefined
  };
  /*
  console.log("📩 Email:", email);
  console.log("🔑 Password:", password);
  console.log("🏢 Nombre Empresa:", nombreEmpresa);
  console.log("🧑‍💼 Nombre Supervisor:", nombreSupervisor);
  console.log("🏗️ Sector:", sector);
  console.log("👑 Superadmin ID:", user?.id);

  console.log("📤 Datos enviados:", payload);
  */
   
  if (!user || !user.id) {
    console.error("❌ Error: No hay usuario autenticado.");
    alert("Error: Debes estar autenticado como Superadmin.");
    return;
}
    const response = await sendRequest(
      import.meta.env.VITE_API_URL + "/cadmins",
      "POST",
      {
        email,
        password,
        nombre_empresa: nombreEmpresa,
        nombre_supervisor: nombreSupervisor,
        sector,
        superadmin_id: user.id, // ID del superadmin logueado
      }
    );
   

    if (response.status === 201) {
      alert("Cadmin creado exitosamente.");
      setEmail("");
      setPassword("");
      setNombreEmpresa("");
      setNombreSupervisor("");
      setSector("mineria");
    } else {
      alert("Error al crear cadmin.");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Card style={{ width: "25rem" }}>
        <Card.Body>
          <h3 className="text-center">Crear Cadmin</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="nombreEmpresa">
              <Form.Label>Nombre de la Empresa</Form.Label>
              <Form.Control
                type="text"
                value={nombreEmpresa}
                onChange={(e) => setNombreEmpresa(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="nombreSupervisor">
              <Form.Label>Nombre del Supervisor</Form.Label>
              <Form.Control
                type="text"
                value={nombreSupervisor}
                onChange={(e) => setNombreSupervisor(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="sector">
              <Form.Label>Sector</Form.Label>
              <Form.Select value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="mineria">Minería</option>
                <option value="portuaria">Portuaria</option>
                <option value="construccion">Construcción</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mt-3">
              Crear Cadmin
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateCadmin;
