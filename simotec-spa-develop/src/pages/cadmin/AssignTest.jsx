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
      const user = JSON.parse(localStorage.getItem("user"));
      const id = user.id;
      const response = await sendRequest(`${import.meta.env.VITE_API_URL}/users/${id}`, "GET");

      if (response.status === 200) {
        setUsers(response.data.users);
      } else if (response.status === 404) {
        setErrorMessage("No users found");
      } else if (response.status === 401) {
        setErrorMessage("Unauthorized access");
      }
    } catch (error) {
      setErrorMessage("An error occurred while fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTests = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Endpoint para obtener los tests desde la base de datos
      const response = await sendRequest(`${import.meta.env.VITE_API_URL}/tests`, "GET");

      if (response.status === 200) {
        setTests(response.data);
      } else if (response.status === 404) {
        setErrorMessage("No tests found");
      } else if (response.status === 401) {
        setErrorMessage("Unauthorized access");
      }
    } catch (error) {
      setErrorMessage("An error occurred while fetching tests");
      console.error("Error fetching tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestChange = (e) => {
    setSelectedTest(e.target.value);
  };

  const handleUserChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedUsers(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Enviar la asignación a la API
      const assignmentData = {
        testId: selectedTest,
        userIds: selectedUsers
      };

      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/tests/assign`, 
        "POST",
        assignmentData
      );

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage("Test asignado exitosamente a los usuarios seleccionados");
        
        // Limpiar selecciones después de éxito
        setSelectedUsers([]);
        setSelectedTest("");
      } else {
        setErrorMessage("Error al asignar el test");
      }
    } catch (error) {
      setErrorMessage("An error occurred while assigning the test");
      console.error("Error assigning test:", error);
    } finally {
      setIsLoading(false);
      
      // Limpiar mensaje de éxito después de 3 segundos
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
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
              <Form.Control as="select" value={selectedTest} onChange={handleTestChange} required>
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
              <Form.Control as="select" multiple value={selectedUsers} onChange={handleUserChange} required>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </Form.Control>
              <Form.Text className="text-muted">
                Mantén presionada la tecla CTRL (o CMD en Mac) para seleccionar múltiples usuarios.
              </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={!selectedTest || selectedUsers.length === 0 || isLoading}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Asignando...</span>
                </>
              ) : (
                "Asignar Test"
              )}
            </Button>
          </Form>
        </>
      )}
    </Container>
  );
};

export default AssignTest;