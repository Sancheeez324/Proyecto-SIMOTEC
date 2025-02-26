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

  useEffect(() => {
    const userToken = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("type");

    if (userToken && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType); // Restablecer el tipo de usuario desde localStorage
    }
  }, []); // Esto se ejecuta una vez al montar el componente, asegurando la restauración de la sesión

  const login = (token, user, type) => {
    logout(); // Limpiar cualquier sesión previa
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("type", type);
    setUserType(type);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("type");
    setUserType(null);
    setIsAuthenticated(false);
    return <Navigate to="/" />;
  };

  const auth = useMemo(() => ({ isAuthenticated, userType, login, logout }), [isAuthenticated, userType]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};