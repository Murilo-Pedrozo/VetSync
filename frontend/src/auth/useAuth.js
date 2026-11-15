import { useContext } from "react";
import { AuthContext } from "./contexto";

export const useAuth = () => useContext(AuthContext);
