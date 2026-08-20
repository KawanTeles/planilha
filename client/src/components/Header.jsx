import { LogOut } from "lucide-react";
import logo from "../assets/logo.png";
import { useAuth } from "../auth/AuthContext.jsx";
import "./Header.css";

export default function Header() {
  const { admin, sair } = useAuth();

  return (
    <header className="header">
      <img src={logo} alt="Desenvolva — Centro de Desenvolvimento Infantil" className="header-logo" />
      <div className="header-titulos">
        <h1>Desenvolva</h1>
        <p>Gestão administrativa e financeira</p>
      </div>
      <span className="texto-suave header-admin-email">{admin?.email}</span>
      <a href="/api/backup" className="botao botao-secundario botao-pequeno header-backup" download>
        ⬇ Baixar backup
      </a>
      <button type="button" className="botao botao-secundario botao-pequeno" onClick={sair}>
        <LogOut size={14} strokeWidth={1.75} /> Sair
      </button>
    </header>
  );
}
