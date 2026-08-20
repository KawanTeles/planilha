import { formatarMoeda } from "../../constants.js";
import { somar, calcularBalancoMensal } from "../../utils/financeiro.js";

export default function PainelResumo({ entradas, saidas, parcelasDoMes, folha, repasses }) {
  const totalEntradas = somar(entradas);
  const totalRecebido = somar(entradas, (e) => e.status === "recebido");
  const totalAReceber = somar(entradas, (e) => e.status === "a_receber");

  const totalSaidas = somar(saidas);
  const totalSaidasPago = somar(saidas, (s) => s.status === "pago");
  const totalSaidasPendente = somar(saidas, (s) => s.status === "pendente");

  const totalParcelas = somar(parcelasDoMes);
  const totalParcelasPago = somar(parcelasDoMes, (p) => p.status === "pago");

  const totalFolha = somar(folha);
  const totalFolhaPago = somar(folha, (f) => f.status === "pago");

  const totalRepasses = somar(repasses);
  const totalRepassesPago = somar(repasses, (r) => r.status === "pago");

  const balanco = calcularBalancoMensal({ entradas, saidas, parcelasDoMes, folha, repasses });

  return (
    <div className="painel-resumo">
      <h3>Resumo do mês</h3>

      <div className="resumo-grupo">
        <div className="resumo-linha">
          <span>Total de entradas</span>
          <strong>{formatarMoeda(totalEntradas)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Total recebido</span>
          <strong>{formatarMoeda(totalRecebido)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Total a receber</span>
          <strong>{formatarMoeda(totalAReceber)}</strong>
        </div>
      </div>

      <div className="resumo-grupo">
        <div className="resumo-linha">
          <span>Total de saídas</span>
          <strong>{formatarMoeda(totalSaidas)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Total pago</span>
          <strong>{formatarMoeda(totalSaidasPago)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Total pendente</span>
          <strong>{formatarMoeda(totalSaidasPendente)}</strong>
        </div>
      </div>

      <div className="resumo-grupo">
        <div className="resumo-linha">
          <span>Total de parcelas do mês</span>
          <strong>{formatarMoeda(totalParcelas)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Parcelas pagas</span>
          <strong>{formatarMoeda(totalParcelasPago)}</strong>
        </div>
      </div>

      <div className="resumo-grupo">
        <div className="resumo-linha">
          <span>Total da folha do mês</span>
          <strong>{formatarMoeda(totalFolha)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Folha paga</span>
          <strong>{formatarMoeda(totalFolhaPago)}</strong>
        </div>
      </div>

      <div className="resumo-grupo">
        <div className="resumo-linha">
          <span>Total de repasses do mês</span>
          <strong>{formatarMoeda(totalRepasses)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Repasses pagos</span>
          <strong>{formatarMoeda(totalRepassesPago)}</strong>
        </div>
      </div>

      <div className="resumo-balanco">
        <span>Balanço do mês</span>
        <strong className={balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}>{formatarMoeda(balanco)}</strong>
      </div>
      <p className="texto-suave" style={{ marginTop: 8 }}>
        Considera recebido − pago (saídas + parcelas + folha + repasses).
      </p>
    </div>
  );
}
