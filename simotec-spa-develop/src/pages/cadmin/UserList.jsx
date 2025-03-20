import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert, Modal, Form } from "react-bootstrap";
import Papa from "papaparse"; // <--- Importar PapaParse
import logoSimotec from "../../fotos/IconSinFondo.png";
import logoEcos from "../../fotos/Icon2SinFondo.png";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Modals existentes
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal para subir CSV
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Usuario seleccionado para editar o eliminar
  const [selectedUser, setSelectedUser] = useState({});

  // Estado para el registro individual
  const [newUser, setNewUser] = useState({
    nombre: "",
    rut: "",
    fecha_nac: "",
    email: "",
    sector: "mineria",
    cargo: "operador",
  });

  // Datos parseados del CSV
  const [csvData, setCsvData] = useState([]);

  // Nombre de la empresa para generar la contraseña
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

  // Modal "Registrar Nuevo Usuario"
  const handleShowCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => setShowCreateModal(false);

  // Modal "Subir CSV"
  const handleShowCsvModal = () => setShowCsvModal(true);
  const handleCloseCsvModal = () => {
    setShowCsvModal(false);
    setCsvData([]); // Limpiamos datos del CSV
  };

  // Capturar cambios en el formulario de registro individual
  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // Registrar un usuario individual
  const handleSaveUser = async () => {
    console.log("🚀 Botón 'Guardar Usuario' presionado.");
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No se encontró el token de autenticación.");
      alert("No se encontró el token de autenticación.");
      return;
    }

    try {
      // Generar contraseña basada en la empresa
      const generatedPassword = `${empresa.toLowerCase()}1#`;

      // Construir el objeto del usuario con la contraseña generada
      const payload = { ...newUser, password: generatedPassword };

      console.log("📤 Enviando usuario a la API:", payload);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("🔎 Respuesta de la API:", response);

      if (!response.ok) {
        throw new Error(`❌ Error al registrar el usuario. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Usuario registrado con éxito:", data);

      alert(`Usuario registrado correctamente! Se ha enviado la contraseña: ${generatedPassword}`);

      handleCloseCreateModal();
      fetchUsers();
    } catch (error) {
      console.error("❌ Error en el registro:", error);
      alert("Hubo un error al registrar el usuario.");
    }
  };

  // ---------------------------
  // MANEJO DEL ARCHIVO CSV
  // ---------------------------

  // 1) Capturar el archivo CSV y parsearlo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,          // Usa la primera fila como nombres de columna
      skipEmptyLines: true,  // Ignorar líneas vacías
      complete: (results) => {
        // results.data es un array de objetos con las columnas del CSV
        setCsvData(results.data);
        console.log("CSV parseado:", results.data);
      },
    });
  };

  // 2) Procesar y registrar usuarios en lote
  const handleCsvSubmit = async () => {
    if (!csvData.length) {
      alert("No hay datos en el CSV para procesar.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No se encontró el token de autenticación.");
      return;
    }

    try {
      // Recorrer cada fila parseada y crear el usuario
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];

        // Generar la contraseña (mismo formato para todos)
        const generatedPassword = `${empresa.toLowerCase()}1#`;

        // Construir el payload con los campos del CSV
        // Ajusta los nombres de las columnas según tu CSV
        const payload = {
          nombre: row.nombre || "",
          rut: row.rut || "",
          fecha_nac: row.fecha_nac || "",
          email: row.email || "",
          sector: row.sector || "mineria",
          cargo: row.cargo || "operador",
          password: generatedPassword,
        };

        console.log(`Creando usuario de la fila ${i + 1}:`, payload);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(`❌ Error creando usuario en la fila ${i + 1}:`, response.status);
          // Opcional: puedes hacer un break si quieres detener todo o simplemente continuar
        }
      }

      alert("Usuarios creados correctamente desde el CSV");
      handleCloseCsvModal();
      fetchUsers();
    } catch (error) {
      console.error("Error procesando CSV:", error);
      alert("Ocurrió un error al procesar el CSV.");
    }
  };

  // ---------------------------
  // ELIMINAR USUARIO
  // ---------------------------
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

        {/* Botón para Registrar un Usuario de forma individual */}
        <Button variant="primary" className="mb-4 me-2" onClick={handleShowCreateModal}>
          Registrar Nuevo Usuario
        </Button>

        {/* Botón para Subir CSV */}
        <Button variant="success" className="mb-4" onClick={handleShowCsvModal}>
          Cargar CSV
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
                      <Button
                        variant="success"
                        className="me-2 btn-sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
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

      {/* Modal de Registro Individual */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nombre</Form.Label>
              <Form.Control type="text" name="nombre" onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>RUT</Form.Label>
              <Form.Control type="text" name="rut" onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Fecha de Nacimiento</Form.Label>
              <Form.Control type="date" name="fecha_nac" onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Sector</Form.Label>
              <Form.Select name="sector" onChange={handleChange} defaultValue={newUser.sector}>
                <option value="mineria">Minería</option>
                <option value="portuaria">Portuaria</option>
                <option value="construccion">Construcción</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Cargo</Form.Label>
              <Form.Select name="cargo" onChange={handleChange} defaultValue={newUser.cargo}>
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreateModal}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            Guardar Usuario
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Subir CSV */}
      <Modal show={showCsvModal} onHide={handleCloseCsvModal}>
        <Modal.Header closeButton>
          <Modal.Title>Subir CSV de Usuarios</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Selecciona el archivo CSV con las columnas: nombre, rut, fecha_nac, email, sector, cargo.</p>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Archivo CSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={handleFileChange} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCsvModal}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleCsvSubmit}>
            Procesar CSV
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Eliminación */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>¿Estás seguro de realizar esta acción?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Continuar
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
