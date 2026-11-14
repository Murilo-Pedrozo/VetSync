import { useEffect, useState } from "react";
import { api } from "./services/api";

export default function App() {
  const [estado, setEstado] = useState("verificando");

  useEffect(() => {
    api
      .get("/saude/")
      .then(() => setEstado("conectada"))
      .catch(() => setEstado("falhou"));
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>VetSync</h1>
      <p>API: {estado}</p>
    </main>
  );
}