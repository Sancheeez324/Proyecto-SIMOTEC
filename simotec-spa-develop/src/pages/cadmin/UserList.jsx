import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Estado para manejar el cargador
  const [errorMessage, setErrorMessage] = useState(""); // Estado para manejar errores
  const [showCreateModal, setShowCreateModal] = useState(false); // Modal para crear usuarios
  const [showEditModal, setShowEditModal] = useState(false); // Modal para editar usuarios
  const [selectedUser, setSelectedUser] = useState({
    rut: "",
    nombre: "",
    email: "",
    password: "",
    sector: "mineria", // Valor por defecto para el sector
    cargo: "operador"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para formatear la fecha (eliminar la parte de la hora)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const fetchUsers = async () => {
    setIsLoading(true); // Mostrar spinner al iniciar la solicitud
    setErrorMessage(""); // Limpiar cualquier error previo

    try {
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/users`, // Endpoint para listar usuarios
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

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedUser({
      rut: "",
      nombre: "",
      email: "",
      password: "",
      sector: "mineria",
      cargo: "operador"
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser({
      rut: "",
      nombre: "",
      email: "",
      password: "",
      sector: "mineria",
      cargo: "operador"
    });
  };

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleShowEditModal = (user) => {
    // Asegurarse de que no haya problemas si user.fecha_nac es null o undefined
    const userToEdit = {
      ...user,
      fecha_nac: user.fecha_nac ? formatDate(user.fecha_nac) : ""
    };
    setSelectedUser(userToEdit);
    setShowEditModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
  
    // Obtener el auth_user_id del usuario loggeado
    const cadmin_id = JSON.parse(localStorage.getItem("user")).id;
  
    const userData = {
      rut: selectedUser.rut,
      nombre: selectedUser.nombre,
      email: selectedUser.email,
      password: selectedUser.password,
      sector: selectedUser.sector,
      cargo: selectedUser.cargo,
      cadmin_id: cadmin_id, // Usar el auth_user_id como cadmin_id
    };
  
    console.log("Datos enviados al backend:", userData);
  
    const response = await sendRequest(
      `${import.meta.env.VITE_API_URL}/users`,
      "POST",
      userData
    );
  
    if (response.status === 201) {
      alert("Usuario registrado exitosamente");
      fetchUsers();
      handleCloseCreateModal();
    } else if (response.status === 400) {
      alert("Faltan datos");
    } else if (response.status === 500) {
      alert("Error interno del servidor");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    // Aquí se haría la lógica para actualizar el usuario en la API
    console.log("Actualizando usuario", selectedUser);
    alert("Por implementar...");
    handleCloseEditModal();
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Gestión de Usuarios</h1>

      <Button
        variant="primary"
        className="mb-4"
        onClick={handleShowCreateModal}
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
                <th>RUT</th>
                <th>Nombre</th>
                <th>Fecha de Nacimiento</th>
                <th>Sector</th>
                <th>Cargo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.rut}</td>
                  <td>{user.nombre}</td>
                  <td>{formatDate(user.fecha_nac)}</td>
                  <td>{user.sector}</td>
                  <td>{user.cargo}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2"
                      onClick={() => handleShowEditModal(user)}
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

      {/* Modal para Crear Usuario */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateUser}>
            <Form.Group className="mb-3" controlId="rut">
              <Form.Label>RUT</Form.Label>
              <Form.Control
                type="text"
                name="rut"
                value={selectedUser.rut}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={selectedUser.nombre}
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
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={selectedUser.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="sector">
              <Form.Label>Sector</Form.Label>
              <Form.Select
                name="sector"
                value={selectedUser.sector}
                onChange={handleChange}
                required
              >
                <option value="mineria">minería</option>
                <option value="portuaria">portuario</option>
                <option value="construccion">construcción</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="cargo">
              <Form.Label>Cargo</Form.Label>
              <Form.Select
                name="cargo"
                value={selectedUser.cargo}
                onChange={handleChange}
                required
              >
                <option value="operador">operario</option>
                <option value="supervisor">supervisor</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              Registrar
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal para Editar Usuario */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditUser}>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={selectedUser.nombre}
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
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserList;