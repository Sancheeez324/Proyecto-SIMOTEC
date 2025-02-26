import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Estado para manejar el cargador
  const [errorMessage, setErrorMessage] = useState(""); // Estado para manejar errores
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true); // Mostrar spinner al iniciar la solicitud
    setErrorMessage(""); // Limpiar cualquier error previo

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const id = user.id;
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/users/${id}`,
        "GET"
      );

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
      setIsLoading(false); // Ocultar spinner cuando la solicitud termine
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedUser({ name: "", email: "", password: "" });
  };

  const handleShowModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setEditMode(true);
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = JSON.parse(localStorage.getItem("user")).id;
    selectedUser.cadminId = id;
    if (editMode) {
      // Aquí se haría la lógica para actualizar el usuario en la API
      console.log("Actualizando usuario", selectedUser);
      alert("Por implementar...");
    } else {
      // Aquí se haría la lógica para crear un nuevo usuario en la API
      console.log("Creando usuario", selectedUser);
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/users`,
        "POST",
        selectedUser
      );

      if (response.status === 201) {
        alert("Usuario registrado exitosamente");
        fetchUsers();
      } else if (response.status === 400) {
        alert("Faltan datos");
      } else if (response.status === 500) {
        alert("Error interno del servidor");
      }
      // alert("Por implementar...");
    }
    handleCloseModal();
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Gestión de Usuarios</h1>

      <Button
        variant="primary"
        className="mb-4"
        onClick={() => handleShowModal()}
      >
        Registrar Nuevo Usuario
      </Button>

      {/* Mostrar spinner mientras se cargan los datos */}
      {isLoading ? (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {/* Mostrar mensaje de error si ocurre algún problema */}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => handleShowModal(user)}
                    >
                      Editar
                    </Button>
                    <Button variant="danger">Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {/* Modal para Crear/Editar Usuario */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? "Editar Usuario" : "Registrar Usuario"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={selectedUser.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={selectedUser.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            {!editMode && (
              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={selectedUser.password}
                  onChange={handleChange}
                  required={!editMode}
                />
              </Form.Group>
            )}
            <Button variant="primary" type="submit">
              {editMode ? "Guardar Cambios" : "Registrar"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserList;
