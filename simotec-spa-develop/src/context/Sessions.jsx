import { createContext, useContext, useState, useMemo, useEffect } from "react";
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
  const [user, setUser] = useState(null); // ✅ Estado para almacenar el usuario

  // Restaurar la sesión al cargar la aplicación
  useEffect(() => {
    try {
      const userToken = localStorage.getItem("token");
      const storedUserType = localStorage.getItem("type");
      const storedUser = localStorage.getItem("user");

      if (userToken && storedUserType && storedUser) {
        setIsAuthenticated(true);
        setUserType(storedUserType);
        setUser(JSON.parse(storedUser)); // ✅ Parseamos el usuario de localStorage
      }
    } catch (error) {
      console.error("Error restaurando la sesión:", error);
      logout(); // ✅ Si hay error, forzamos un logout limpio
    }
  }, []);

  const login = (token, user, type) => {
    try {
      logout(); // ✅ Limpiar sesión anterior

      console.log("Datos recibidos en login:", { token, user, type }); // 👀 Verifica qué llega


      // Guardar datos en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // ✅ Guardamos el usuario correctamente
      localStorage.setItem("type", type);

      // Actualizar estado
      setIsAuthenticated(true);
      setUserType(type);
      setUser(user);
    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("type");

      setIsAuthenticated(false);
      setUserType(null);
      setUser(null);
    } catch (error) {
      console.error("Error en logout:", error);
    }
  };

  const hasRole = (role) => isAuthenticated && userType === role;

  // Memoizar el contexto para optimizar rendimiento
  const auth = useMemo(
    () => ({
      isAuthenticated,
      userType,
      user, // ✅ Aseguramos que user esté en el contexto
      login,
      logout,
      hasRole,
    }),
    [isAuthenticated, userType, user]
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
