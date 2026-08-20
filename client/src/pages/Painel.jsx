import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCircle,
  CreditCard,
  CalendarDays,
  BarChart3,
  Activity,
  ArrowRight
} from "lucide-react";
import { formatarMoeda, formatarMesAno } from "../constants.js";
import { calcularBalancoMensal } from "../utils/financeiro.js";
import GraficoBalancoMensal from "../components/anual/GraficoBalancoMensal.jsx";

const MODULOS = [
  { to: "/terapeutas", label: "Terapeutas", icon: Users },
  { to: "/colaboradores", label: "Colaboradores", icon: UserCircle },
  { to: "/parcelas", label: "Parcelas e Empréstimos", icon: CreditCard },
  { to: "/financeiro-mensal", label: "Financeiro Mensal", icon: CalendarDays },
  { to: "/financeiro-anual", label: "Financeiro Anual", icon: BarChart3 },
  { to: "/producao", label: "Produção de Terapeutas", icon: Activity },
];

export default function Painel() {
  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  const [balanco, setBalanco] = useState(null);
  const [anual, setAnual] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/entradas/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/saidas/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/parcelas/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/folha-pagamento/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/repasses/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/financeiro-anual/${ano}`).then((r) => r.json()),
    ])
      .then(([entradas, saidas, parcelasDoMes, folha, repasses, dadosAnuais]) => {
        setBalanco(calcularBalancoMensal({ entradas, saidas, parcelasDoMes, folha, repasses }));
        setAnual(dadosAnuais);
      })
      .finally(() => setCarregando(false));
  }, [ano, mes]);

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Painel</h2>
      </div>

      <div className="painel-linha-topo">
        <div className="cartao painel-mes-atual">
          <span className="texto-suave">Mês atual</span>
          <h3>{formatarMesAno(mes, ano)}</h3>
          <Link to={`/financeiro-mensal/${ano}/${mes}`} className="botao botao-secundario botao-pequeno">
            Abrir financeiro do mês <ArrowRight size={14} strokeWidth={1.75} />
          </Link>
        </div>

        <div className="cartao painel-balanco">
          <span className="texto-suave">Balanço do mês</span>
          {carregando ? (
            <p className="texto-suave">Calculando...</p>
          ) : (
            <h1 className={balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}>{formatarMoeda(balanco)}</h1>
          )}
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Atalhos</h3>
        <div className="painel-atalhos">
          {MODULOS.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.to} to={m.to} className="painel-atalho-card">
                <div className="atalho-icone-chip">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        {carregando || !anual ? (
          <p className="texto-suave">Carregando resumo anual...</p>
        ) : (
          <>
            <div className="pagina-cabecalho" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "20px" }}>Resumo anual rápido — {ano}</h3>
              <Link to={`/financeiro-anual/${ano}`} className="botao botao-secundario botao-pequeno">
                Ver financeiro anual completo <ArrowRight size={14} strokeWidth={1.75} />
              </Link>
            </div>
            <div className="painel-linha-topo" style={{ marginBottom: 24 }}>
              <div className="cartao">
                <span className="texto-suave">Entradas no ano</span>
                <h3>{formatarMoeda(anual.totaisAnuais.entradas)}</h3>
              </div>
              <div className="cartao">
                <span className="texto-suave">Saídas no ano</span>
                <h3>{formatarMoeda(anual.totaisAnuais.saidas)}</h3>
              </div>
              <div className="cartao">
                <span className="texto-suave">Balanço do ano</span>
                <h3 className={anual.totaisAnuais.balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}>
                  {formatarMoeda(anual.totaisAnuais.balanco)}
                </h3>
              </div>
            </div>
            <GraficoBalancoMensal meses={anual.meses} />
          </>
        )}
      </div>
    </div>
  );
}
