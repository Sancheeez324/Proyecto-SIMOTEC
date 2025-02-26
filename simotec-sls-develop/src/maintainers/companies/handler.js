const { queryWithTransaction } = require("../../config/database");
const { generateResponse, getFechaChile } = require("../../utils/utils");

// TODO: formatear fechas

module.exports.createCompany = async (event) => {
  try {
    const { name, admin_user_id } = JSON.parse(event.body);

    if (!name || !admin_user_id) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    // Verificar que el usuario administrador exista
    return await queryWithTransaction(async (connection) => {
      const [admin] = await connection.execute(
        'SELECT id FROM users WHERE id = ? AND role = "compania_admin"',
        [admin_user_id]
      );

      if (admin.length === 0) {
        return generateResponse(400, { message: "Invalid admin_user_id" });
      }

      // Crear la compañía
      await connection.execute(
        "INSERT INTO companies (name, admin_user_id, created_at) VALUES (?, ?, NOW())",
        [name, admin_user_id]
      );

      return generateResponse(201, { message: "Company created successfully" });
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.listCompanies = async () => {
  try {
    const [companies] = await queryWithTransaction(async (connection) => {
      return await connection.execute(
        "SELECT c.id, c.name, c.admin_user_id, c.created_at, u.name as admin_name, u.email as admin_email FROM companies c JOIN users u ON c.admin_user_id = u.id"
      );
    });

    companies.forEach((company) => {
      company.created_at = getFechaChile(company.created_at, true);
      company.company_admin = {
        name: company.admin_name,
        email: company.admin_email,
      };
      delete company.admin_name;
      delete company.admin_email;
    });

    return generateResponse(200, { companies });
  } catch (error) {
    console.error("Error listing companies:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};


// TODO: Revisar esta funcion para saber que se debe cumplir de los requerimientos de los flujos ⚠️
module.exports.editCompany = async (event) => {
  try {
    const companyId = event.pathParameters.companyId;
    const { name, admin_user_id } = JSON.parse(event.body);

    if (!name || !admin_user_id) {
      return generateResponse(400, { message: "Missing required fields" });
    }

    return await queryWithTransaction(async (connection) => {
      const [company] = await connection.execute(
        "SELECT id FROM companies WHERE id = ?",
        [companyId]
      );

      if (company.length === 0) {
        return generateResponse(404, { message: "Company not found" });
      }

      // Verificar que el usuario administrador existe
      const [admin] = await connection.execute(
        'SELECT id FROM users WHERE id = ? AND role = "compania_admin"',
        [admin_user_id]
      );

      if (admin.length === 0) {
        return generateResponse(400, { message: "Invalid admin_user_id" });
      }

      // Actualizar la compañía
      await connection.execute(
        "UPDATE companies SET name = ?, admin_user_id = ? WHERE id = ?",
        [name, admin_user_id, companyId]
      );

      return generateResponse(200, { message: "Company updated successfully" });
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};

module.exports.deleteCompany = async (event) => {
  try {
    const companyId = event.pathParameters.companyId;

    return await queryWithTransaction(async (connection) => {
      const [company] = await connection.execute(
        "SELECT id FROM companies WHERE id = ?",
        [companyId]
      );

      if (company.length === 0) {
        return generateResponse(404, { message: "Company not found" });
      }

      // Eliminar la compañía y todas sus relaciones
      await connection.execute("DELETE FROM companies WHERE id = ?", [
        companyId,
      ]);

      return generateResponse(200, { message: "Company deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return generateResponse(500, { message: "Internal Server Error" });
  }
};
