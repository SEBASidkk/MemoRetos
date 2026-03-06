import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("jwt") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe(token).then((r) => {
        if (r.status === 200) setUser(r.data);
        else logout();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const saveAuth = (t, u) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("jwt", t);
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("jwt");
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, saveAuth, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
