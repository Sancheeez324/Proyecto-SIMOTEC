import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import { sendRequest } from "../../utils/axios";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      const cadminId = userData?.id;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users?cadminId=${cadminId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage("No autorizado: token inválido o expirado");
        } else if (response.status === 404) {
          setErrorMessage("No se encontraron usuarios");
        } else {
          setErrorMessage("Error desconocido en el servidor");
        }
        return;
      }

      const data = await response.json();
      console.log("Usuarios obtenidos:", data.users); // Depuración
      setUsers(data.users || []);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prevData) => ({ ...prevData, [name]: value }));
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Gestión de Usuarios</h1>
      <Button variant="primary" className="mb-4" onClick={handleShowCreateModal}>
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
                  <td>{user.email || "No disponible"}</td>
                  <td>{user.sector}</td>
                  <td>{user.cargo}</td>
                  <td>
                    <Button variant="warning" className="me-2 btn-sm">
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
    </div>
  );
};

export default UserList;
