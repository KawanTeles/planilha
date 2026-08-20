import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// intercepta 401 de qualquer fetch da aplicação (não só os que passam pelo AuthProvider)
// para derrubar a sessão na hora — sem precisar tratar 401 em cada tela que chama a API
let aoReceber401 = null;
const fetchOriginal = window.fetch.bind(window);
window.fetch = async (...args) => {
  const resposta = await fetchOriginal(...args);
  if (resposta.status === 401 && aoReceber401) aoReceber401();
  return resposta;
};

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const verificarSessao = useCallback(() => {
    setCarregando(true);
    return fetchOriginal("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    aoReceber401 = () => setAdmin(null);
    verificarSessao();
    return () => {
      aoReceber401 = null;
    };
  }, [verificarSessao]);

  async function entrar(email, senha) {
    const resposta = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.erro || "Não foi possível entrar.");
    }
    const dados = await resposta.json();
    setAdmin(dados);
  }

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, autenticado: !!admin, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
