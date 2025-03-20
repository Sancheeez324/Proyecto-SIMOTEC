import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Modal, Form } from "react-bootstrap";
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [newUser, setNewUser] = useState({
    nombre: "",
    rut: "",
    fecha_nac: "",
    email: "",
    sector: "mineria",
    cargo: "operador",
  });

  const empresa = JSON.parse(localStorage.getItem("user"))?.nombre_empresa || "empresa";

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
        setErrorMessage("Error al cargar usuarios");
        return;
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      setErrorMessage("Error al obtener usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => setShowCreateModal(false);

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value });
  };

  const handleSaveUser = async () => {
    const password = `${empresa.toLowerCase()}1#`;
    const payload = { ...newUser, password };

    console.log("Usuario a guardar:", payload);
    handleCloseCreateModal();
  };

  const handleUpdateUser = async () => {
    const token = localStorage.getItem("token");

    await fetch(`${import.meta.env.VITE_API_URL}/users/${selectedUser.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(selectedUser),
    });

    fetchUsers();
    setShowEditModal(false);
  };

  const handleDeleteUser = async () => {
    const token = localStorage.getItem("token");

    await fetch(`${import.meta.env.VITE_API_URL}/users/${selectedUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchUsers();
    setShowDeleteModal(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      <div className="container mt-5 flex-grow-1">
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
                      <Button variant="success" className="me-2 btn-sm" onClick={() => { setSelectedUser(user); setShowEditModal(true); }}>Editar</Button>
                      <Button variant="danger" className="btn-sm" onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Estás seguro de realizar esta acción?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteUser}>Continuar</Button>
        </Modal.Footer>
      </Modal>
              {/* Footer con logo ECOS */}
<div className="footer">
  <div className="ecos-logo">
    <img src={logoEcos} alt="Ecos Logo" className="footer-logo" />
  </div>
  <div className="green-bar"></div>
</div>

<style jsx>{`
  .header {
    display: flex;
    align-items: center;
    padding: 10px 20px;
  }

  .logo-container {
    display: flex;
    align-items: flex-start;
  }

  .logo-simotec {
    width: 70px; /* tamaño correcto para el logo */
    height: auto;
  }

  .footer {
    width: 100%;
    position: relative;
    bottom: 0;
    text-align: center;
    margin-top: auto;
  }

  .ecos-logo {
    margin-bottom: 5px;
  }

  .footer-logo {
    height: 30px;
    width: auto;
  }

  .green-bar {
    background-color: #7ed957;
    height: 40px;
    width: 100%;
  }
`}</style>
    </div>
  );
};

export default UserList;
