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
    nombre_empresa: "",
  });

  // Al montar, cargamos la lista
  useEffect(() => {
    fetchUsers();
  }, []);

  // -------------------------------------------------
  // 1) Cargar Lista de Usuarios
  // -------------------------------------------------
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

  // -------------------------------------------------
  // Manejo de modales
  // -------------------------------------------------
  const handleShowCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => setShowCreateModal(false);
  const handleShowEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => setShowEditModal(false);
  const handleShowDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  // -------------------------------------------------
  // Manejo de cambios en formularios
  // -------------------------------------------------
  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value });
  };

  // -------------------------------------------------
  // Guardar nuevo usuario (con creación de contraseña)
  // -------------------------------------------------
  const handleSaveUser = async () => {
    // Validar que se ingrese el nombre de la empresa
    if (!newUser.nombre_empresa) {
      alert("El campo 'Nombre de la Empresa' es obligatorio");
      return;
    }
    // Generar contraseña: nombre_empresa en minúsculas, sin espacios, + "1#"
    const password = `${newUser.nombre_empresa.toLowerCase().replace(/\s/g, "")}1#`;
    const payload = { ...newUser, password };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchUsers();
        handleCloseCreateModal();
      } else {
        console.error("Error al crear usuario");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------
  // Actualizar usuario editado
  // -------------------------------------------------
  const handleUpdateUser = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedUser),
        }
      );
      if (response.ok) {
        fetchUsers();
        handleCloseEditModal();
      } else {
        console.error("Error al actualizar usuario");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------
  // Eliminar usuario (mostrando datos en el modal)
  // -------------------------------------------------
  const handleDeleteUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al eliminar usuario:", errorData.message);
        alert("Error al eliminar usuario: " + errorData.message);
        return;
      }
      // Si la eliminación es exitosa, actualizamos la lista y cerramos el modal
      fetchUsers();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("Error al eliminar usuario, intente nuevamente.");
    }
  };  

  // -------------------------------------------------
  // Manejo de carga masiva por CSV
  // -------------------------------------------------
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      if (lines.length <= 1) return;
      // Suponiendo que la cabecera es: nombre,rut,email,fecha_nac,sector,cargo,nombre_empresa
      const header = lines[0].split(",").map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (row === "") continue;
        const values = row.split(",");
        let record = {};
        header.forEach((h, index) => {
          record[h] = values[index] ? values[index].trim() : "";
        });
        // Generar contraseña para el registro
        if (record.nombre_empresa) {
          record.password = `${record.nombre_empresa.toLowerCase().replace(/\s/g, "")}1#`;
        } else {
          console.error("Falta el nombre de la empresa en el registro:", record);
          continue;
        }
        // Enviar cada usuario al API
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(record),
          });
          if (!response.ok) {
            console.error("Error al crear usuario desde CSV:", record);
          }
        } catch (error) {
          console.error("Error en la creación de usuario desde CSV", error);
        }
      }
      fetchUsers();
    };
    reader.readAsText(file);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Encabezado */}
      <header className="header">
        <div className="logo-container">
          <img src={logoSimotec} alt="Simotec Logo" className="logo-simotec" />
        </div>
      </header>

      <div className="container mt-5 flex-grow-1">
        <h1 className="mb-4">Gestión de Usuarios</h1>
        <div className="mb-4 d-flex gap-2">
          <Button variant="primary" onClick={handleShowCreateModal}>
            Registrar Nuevo Usuario
          </Button>
          <Button
            variant="secondary"
            style={{ backgroundColor: "#459b37", borderColor: "#459b37" }}
            onClick={() => document.getElementById("csvInput").click()}
          >
            Cargar CSV
          </Button>
          <input
            type="file"
            id="csvInput"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleCSVUpload}
          />
        </div>

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
      <th>Fecha de Nacimiento</th> {/* Nueva columna */}
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
        <td>{new Date(user.fecha_nac).toISOString().split("T")[0]}</td> {/* Mostrar fecha de nacimiento */}
        <td>{user.sector}</td>
        <td>{user.cargo}</td>
        <td>
          <Button
            variant="success"
            className="me-2 btn-sm"
            onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            className="btn-sm"
            onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
          >
            Eliminar
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>

          </>
        )}
      </div>

      {/* Modal para crear usuario */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={newUser.nombre}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>RUT</Form.Label>
              <Form.Control
                type="text"
                name="rut"
                value={newUser.rut}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Nacimiento</Form.Label>
              <Form.Control
                type="date"
                name="fecha_nac"
                value={newUser.fecha_nac}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sector</Form.Label>
              <Form.Select
                name="sector"
                value={newUser.sector}
                onChange={handleChange}
              >
                <option value="mineria">Minería</option>
                <option value="portuaria">Portuario</option>
                <option value="construccion">Construcción</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cargo</Form.Label>
              <Form.Select
                name="cargo"
                value={newUser.cargo}
                onChange={handleChange}
              >
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Empresa</Form.Label>
              <Form.Control
                type="text"
                name="nombre_empresa"
                value={newUser.nombre_empresa}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreateModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar usuario */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={selectedUser.nombre || ""}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>RUT</Form.Label>
              <Form.Control
                type="text"
                name="rut"
                value={selectedUser.rut || ""}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={selectedUser.email || ""}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Nacimiento</Form.Label>
              <Form.Control
                type="date"
                name="fecha_nac"
                value={selectedUser.fecha_nac || ""}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sector</Form.Label>
              <Form.Select
                name="sector"
                value={selectedUser.sector || "mineria"}
                onChange={handleEditChange}
              >
                <option value="mineria">Minería</option>
                <option value="portuaria">Portuario</option>
                <option value="construccion">Construcción</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cargo</Form.Label>
              <Form.Select
                name="cargo"
                value={selectedUser.cargo || "operador"}
                onChange={handleEditChange}
              >
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Empresa</Form.Label>
              <Form.Control
                type="text"
                name="nombre_empresa"
                value={selectedUser.nombre_empresa || ""}
                onChange={handleEditChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Actualizar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para eliminar usuario (mostrando datos) */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de eliminar el siguiente usuario?</p>
          <p>
            <strong>Nombre:</strong> {selectedUser.nombre}
          </p>
          <p>
            <strong>RUT:</strong> {selectedUser.rut}
          </p>
          <p>
            <strong>Email:</strong> {selectedUser.email}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Eliminar
          </Button>
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
          width: 70px;
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
