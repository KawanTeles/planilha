import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavegadorAno from "../components/anual/NavegadorAno.jsx";
import TabelaAnual from "../components/anual/TabelaAnual.jsx";
import GraficoEntradasSaidas from "../components/anual/GraficoEntradasSaidas.jsx";
import GraficoBalancoMensal from "../components/anual/GraficoBalancoMensal.jsx";
import GraficoComposicaoEntradas from "../components/anual/GraficoComposicaoEntradas.jsx";

export default function FinanceiroAnual() {
  const { ano: anoParam } = useParams();
  const ano = Number(anoParam);

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    fetch(`/api/financeiro-anual/${ano}`)
      .then((r) => r.json())
      .then(setDados)
      .finally(() => setCarregando(false));
  }, [ano]);

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Financeiro Anual — {ano}</h2>
        <NavegadorAno ano={ano} />
      </div>

      {carregando || !dados ? (
        <p className="texto-suave">Carregando...</p>
      ) : (
        <div className="coluna-principal">
          <TabelaAnual ano={ano} meses={dados.meses} totaisAnuais={dados.totaisAnuais} />
          <GraficoEntradasSaidas meses={dados.meses} />
          <GraficoBalancoMensal meses={dados.meses} />
          <GraficoComposicaoEntradas entradasPorCategoria={dados.entradasPorCategoria} />
        </div>
      )}
    </div>
  );
}
