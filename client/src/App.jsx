import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Painel from "./pages/Painel.jsx";
import Aniversariantes from "./pages/Aniversariantes.jsx";
import Terapeutas from "./pages/Terapeutas.jsx";
import Colaboradores from "./pages/Colaboradores.jsx";
import Parcelas from "./pages/Parcelas.jsx";
import FinanceiroMensal from "./pages/FinanceiroMensal.jsx";
import FinanceiroMensalRedirect from "./pages/FinanceiroMensalRedirect.jsx";
import FinanceiroAnual from "./pages/FinanceiroAnual.jsx";
import FinanceiroAnualRedirect from "./pages/FinanceiroAnualRedirect.jsx";
import ProducaoTerapeutas from "./pages/ProducaoTerapeutas.jsx";
import Login from "./pages/Login.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import "./App.css";

export default function App() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return <div className="tela-carregando-auth">Carregando...</div>;
  }

  if (!autenticado) {
    return <Login />;
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="conteudo">
        <Header />
        <main className="area-principal">
          <Routes>
            <Route path="/" element={<Painel />} />
            <Route path="/aniversariantes" element={<Aniversariantes />} />
            <Route path="/terapeutas" element={<Terapeutas />} />
            <Route path="/colaboradores" element={<Colaboradores />} />
            <Route path="/parcelas" element={<Parcelas />} />
            <Route path="/financeiro-mensal" element={<FinanceiroMensalRedirect />} />
            <Route path="/financeiro-mensal/:ano/:mes" element={<FinanceiroMensal />} />
            <Route path="/financeiro-anual" element={<FinanceiroAnualRedirect />} />
            <Route path="/financeiro-anual/:ano" element={<FinanceiroAnual />} />
            <Route path="/producao" element={<ProducaoTerapeutas />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
