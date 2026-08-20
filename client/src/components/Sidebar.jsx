import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  CreditCard, 
  CalendarDays, 
  BarChart3, 
  Activity 
} from "lucide-react";
import "./Sidebar.css";

const ITENS = [
  { to: "/", label: "Painel", icon: LayoutDashboard, fim: true },
  { to: "/terapeutas", label: "Terapeutas", icon: Users },
  { to: "/colaboradores", label: "Colaboradores", icon: UserCircle },
  { to: "/parcelas", label: "Parcelas e Empréstimos", icon: CreditCard },
  { to: "/financeiro-mensal", label: "Financeiro Mensal", icon: CalendarDays },
  { to: "/financeiro-anual", label: "Financeiro Anual", icon: BarChart3 },
  { to: "/producao", label: "Produção de Terapeutas", icon: Activity },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-placeholder">Desenvolva</div>
      </div>
      <nav>
        <ul>
          {ITENS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink to={item.to} end={item.fim} className={({ isActive }) => (isActive ? "ativo" : "")}>
                  <div className="sidebar-icone-chip">
                    <Icon size={20} strokeWidth={1.75} className="sidebar-icone" />
                  </div>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
