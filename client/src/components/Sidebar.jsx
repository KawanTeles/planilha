import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const ITENS = [
  { to: "/", label: "Painel", fim: true },
  { to: "/terapeutas", label: "Terapeutas" },
  { to: "/colaboradores", label: "Colaboradores" },
  { to: "/parcelas", label: "Parcelas e Empréstimos" },
  { to: "/financeiro-mensal", label: "Financeiro Mensal" },
  { to: "/financeiro-anual", label: "Financeiro Anual" },
  { to: "/producao", label: "Produção de Terapeutas" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {ITENS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.fim} className={({ isActive }) => (isActive ? "ativo" : "")}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
