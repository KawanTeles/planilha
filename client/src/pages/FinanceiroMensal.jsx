import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavegadorMes from "../components/financeiro/NavegadorMes.jsx";
import SecaoEntradas from "../components/financeiro/SecaoEntradas.jsx";
import SecaoSaidas from "../components/financeiro/SecaoSaidas.jsx";
import SecaoParcelasDoMes from "../components/financeiro/SecaoParcelasDoMes.jsx";
import SecaoFolhaPagamento from "../components/financeiro/SecaoFolhaPagamento.jsx";
import SecaoRepasses from "../components/financeiro/SecaoRepasses.jsx";
import PainelResumo from "../components/financeiro/PainelResumo.jsx";
import { formatarMesAno } from "../constants.js";
import { FileSpreadsheet } from "lucide-react";

export default function FinanceiroMensal() {
  const { ano: anoParam, mes: mesParam } = useParams();
  const ano = Number(anoParam);
  const mes = Number(mesParam);

  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [parcelasDoMes, setParcelasDoMes] = useState([]);
  const [folha, setFolha] = useState([]);
  const [repasses, setRepasses] = useState([]);
  const [carregando, setCarregando] = useState(true);

  function carregar() {
    setCarregando(true);
    Promise.all([
      fetch(`/api/entradas/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/saidas/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/parcelas/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/folha-pagamento/mes/${ano}/${mes}`).then((r) => r.json()),
      fetch(`/api/repasses/mes/${ano}/${mes}`).then((r) => r.json()),
    ])
      .then(([e, s, p, f, r]) => {
        setEntradas(e);
        setSaidas(s);
        setParcelasDoMes(p);
        setFolha(f);
        setRepasses(r);
      })
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [ano, mes]);

  const saidasFixas = saidas.filter((s) => s.tipo === "fixa");
  const saidasVariaveis = saidas.filter((s) => s.tipo === "variavel");

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Financeiro Mensal — {formatarMesAno(mes, ano)}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href={`/api/backup/mes/${ano}/${mes}/csv`}
            className="botao botao-secundario botao-pequeno"
            download
          >
            <FileSpreadsheet size={16} strokeWidth={1.75} /> Exportar mês (CSV)
          </a>
          <NavegadorMes ano={ano} mes={mes} />
        </div>
      </div>

      {carregando ? (
        <p className="texto-suave">Carregando...</p>
      ) : (
        <div className="layout-financeiro-mensal">
          <div className="coluna-principal">
            <SecaoEntradas mes={mes} ano={ano} entradas={entradas} onMudou={carregar} />

            <div className="bloco-financeiro-cabecalho">
              <h3 style={{ margin: "8px 0 0" }}>Saídas</h3>
            </div>
            <div className="saidas-lado-a-lado">
              <SecaoSaidas
                titulo="Contas fixas"
                tipo="fixa"
                mes={mes}
                ano={ano}
                saidas={saidasFixas}
                onMudou={carregar}
              />
              <SecaoSaidas
                titulo="Contas variáveis"
                tipo="variavel"
                mes={mes}
                ano={ano}
                saidas={saidasVariaveis}
                onMudou={carregar}
              />
            </div>

            <SecaoParcelasDoMes parcelas={parcelasDoMes} onMudou={carregar} />

            <SecaoFolhaPagamento folha={folha} onMudou={carregar} />

            <SecaoRepasses repasses={repasses} onMudou={carregar} />
          </div>

          <div className="coluna-resumo">
            <PainelResumo
              entradas={entradas}
              saidas={saidas}
              parcelasDoMes={parcelasDoMes}
              folha={folha}
              repasses={repasses}
            />
          </div>
        </div>
      )}
    </div>
  );
}
