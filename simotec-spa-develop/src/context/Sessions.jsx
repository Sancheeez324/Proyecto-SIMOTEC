import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return auth;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);

  // Restaurar la sesión al cargar la aplicación
  useEffect(() => {
    const userToken = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("type");

    if (userToken && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
    }
  }, []);

  const login = (token, user, type) => {
    // Limpiar cualquier sesión previa
    logout();

    // Guardar datos en localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("type", type);

    // Actualizar estado
    setIsAuthenticated(true);
    setUserType(type);
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("type");

    // Actualizar estado
    setIsAuthenticated(false);
    setUserType(null);
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return isAuthenticated && userType === role;
  };

  // Memoizar el valor del contexto para optimizar rendimiento
  const auth = useMemo(
    () => ({
      isAuthenticated,
      userType,
      login,
      logout,
      hasRole, // Añadir función para verificar roles
    }),
    [isAuthenticated, userType]
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};