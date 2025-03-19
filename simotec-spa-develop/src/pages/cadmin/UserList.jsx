import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    rut: "",
    nombre: "",
    email: "",
    password: "",
    sector: "mineria",
    cargo: "operador"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("No se encontró el token de autenticación");
        return;
      }
  
      console.log("Token enviado:", token); // Depuración
  
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/users`,
        "GET",
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
  
      console.log("Respuesta del backend:", response);
  
      if (response.status === 200) {
        setUsers(response.data.users);
      } else if (response.status === 404) {
        setErrorMessage("No se encontraron usuarios");
      } else if (response.status === 401) {
        setErrorMessage("No autorizado: token inválido o expirado");
      } else if (response.status === 500) {
        setErrorMessage("Error interno del servidor");
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      setErrorMessage("Error al obtener usuarios");
    } finally {
      setIsLoading(false);
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

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleShowEditModal = (user) => {
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
  
    const cadmin_id = JSON.parse(localStorage.getItem("user")).id;
    const token = localStorage.getItem("token");

    const userData = {
      rut: selectedUser.rut,
      nombre: selectedUser.nombre,
      email: selectedUser.email,
      password: selectedUser.password,
      sector: selectedUser.sector,
      cargo: selectedUser.cargo,
      cadmin_id: cadmin_id,
    };
  
    console.log("Datos enviados al backend:", userData);
  
    try {
      const response = await sendRequest(
        `${import.meta.env.VITE_API_URL}/users`,
        "POST",
        userData,
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (response.status === 201) {
        alert("Usuario registrado exitosamente");
        fetchUsers();
        handleCloseCreateModal();
      } else if (response.status === 400) {
        alert("Faltan datos");
      } else if (response.status === 401) {
        alert("No autorizado");
      } else if (response.status === 500) {
        alert("Error interno del servidor");
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("Error al registrar usuario");
    }
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

      {isLoading ? (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Fecha Nac.</th>
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
                  <td>{user.email || (user.auth_user ? user.auth_user.email : '')}</td>
                  <td>{formatDate(user.fecha_nac)}</td>
                  <td>{user.sector}</td>
                  <td>{user.cargo}</td>
                  <td>
                    <Button
                      variant="warning"
                      className="me-2 btn-sm"
                      onClick={() => handleShowEditModal(user)}
                    >
                      Editar
                    </Button>
                    <Button variant="danger" className="btn-sm">Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateUser}>
            <Form.Group className="mb-3" controlId="rut">
              <Form.Label>RUT</Form.Label>
              <Form.Control type="text" name="rut" value={selectedUser.rut} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control type="text" name="nombre" value={selectedUser.nombre} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={selectedUser.email} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control type="password" name="password" value={selectedUser.password} onChange={handleChange} required />
            </Form.Group>
            <Button variant="primary" type="submit">
              Registrar
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserList;
