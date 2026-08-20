import logo from "../assets/logo.png";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <img src={logo} alt="Desenvolva — Centro de Desenvolvimento Infantil" className="header-logo" />
      <div className="header-titulos">
        <h1>Desenvolva</h1>
        <p>Gestão administrativa e financeira</p>
      </div>
      <a href="/api/backup" className="botao botao-secundario botao-pequeno header-backup" download>
        ⬇ Baixar backup
      </a>
    </header>
  );
}
