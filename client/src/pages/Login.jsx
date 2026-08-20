import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import logo from "../assets/logo.png";
import "./Login.css";

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (erroCapturado) {
      setErro(erroCapturado.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={aoSubmeter}>
        <img src={logo} alt="Desenvolva" className="cartao-login-logo" />
        <h1>Desenvolva</h1>
        <p className="texto-suave">Entre com sua conta de administrador</p>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <div className="campo">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
