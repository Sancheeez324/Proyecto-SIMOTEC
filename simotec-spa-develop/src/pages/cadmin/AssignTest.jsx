import React, { useState, useEffect } from "react";
import { Form, Button, Container, Spinner, Alert } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";

const AssignTest = () => {
  const [users, setUsers] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  useEffect(() => {
    fetchUsers();
    fetchTests();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("No se encontró el token de autenticación");
        return;
      }

      const userData = JSON.parse(localStorage.getItem("user"));
      const cadminId = userData?.id; // ID del cadmin

      // Llamamos al endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users?cadminId=${cadminId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setErrorMessage("Error al cargar usuarios");
        return;
      }

      const data = await response.json();
      console.log("Usuarios obtenidos desde el backend:", data.users);

      setUsers(data.users || []);
    } catch (error) {
      setErrorMessage("Error al obtener usuarios");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTests = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await sendRequest(`${import.meta.env.VITE_API_URL}/tests`, "GET");
      if (response.status === 200) {
        setTests(response.data);
      } else {
        setErrorMessage("No se encontraron tests");
      }
    } catch (error) {
      setErrorMessage("Error al obtener tests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const assignmentData = {
        testId: selectedTest,
        userIds: selectedUsers,
      };

      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/tests/assign`,
        "POST",
        assignmentData
      );

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Test asignado exitosamente a los usuarios seleccionados");
        setSelectedUsers([]);
        setSelectedTest("");
      } else {
        setErrorMessage("Error al asignar el test");
      }
    } catch (error) {
      setErrorMessage("Error al asignar el test");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h1>Asignar Test</h1>
      {isLoading ? (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="testSelect" className="mb-3">
              <Form.Label>Seleccionar Test</Form.Label>
              <Form.Control as="select" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)} required>
                <option value="">Seleccione un test</option>
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.test_name} ({test.sector} - {test.tipo})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="userSelect" className="mb-3">
              <Form.Label>Seleccionar Usuarios</Form.Label>
              <Form.Control as="select" multiple value={selectedUsers} onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions).map(option => option.value))} required>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre}
                  </option>
                ))}
              </Form.Control>
              <Form.Text className="text-muted">
                Mantén presionada la tecla CTRL (o CMD en Mac) para seleccionar múltiples usuarios.
              </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={!selectedTest || selectedUsers.length === 0 || isLoading}>
              {isLoading ? "Asignando..." : "Asignar Test"}
            </Button>
          </Form>
        </>
      )}
    </Container>
  );
};

export default AssignTest;
