import { Link } from "react-router-dom";
import { MESES, formatarMoeda } from "../../constants.js";

export default function TabelaAnual({ ano, meses, totaisAnuais }) {
  return (
    <div className="bloco-financeiro" style={{ overflowX: "auto" }}>
      <div className="bloco-financeiro-cabecalho">
        <h3>Consolidado dos 12 meses</h3>
      </div>
      <div className="tabela-container">
        <table className="tabela tabela-anual">
          <thead>
            <tr>
              <th>Mês</th>
              <th className="valor-monetario">Entradas</th>
              <th className="valor-monetario">Saídas</th>
              <th className="valor-monetario">Folha</th>
              <th className="valor-monetario">Repasses</th>
              <th className="valor-monetario">Balanço</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.mes}>
                <td>
                  <Link to={`/financeiro-mensal/${ano}/${m.mes}`}>{MESES[m.mes - 1]}</Link>
                </td>
                <td className="valor-monetario">{formatarMoeda(m.totalEntradas)}</td>
                <td className="valor-monetario">{formatarMoeda(m.totalSaidas)}</td>
                <td className="valor-monetario">{formatarMoeda(m.totalFolha)}</td>
                <td className="valor-monetario">{formatarMoeda(m.totalRepasses)}</td>
                <td className={`valor-monetario ${m.balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}`}>
                  <strong>{formatarMoeda(m.balanco)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Total do ano</strong>
              </td>
              <td className="valor-monetario">
                <strong>{formatarMoeda(totaisAnuais.entradas)}</strong>
              </td>
              <td className="valor-monetario">
                <strong>{formatarMoeda(totaisAnuais.saidas)}</strong>
              </td>
              <td className="valor-monetario">
                <strong>{formatarMoeda(totaisAnuais.folha)}</strong>
              </td>
              <td className="valor-monetario">
                <strong>{formatarMoeda(totaisAnuais.repasses)}</strong>
              </td>
              <td className={`valor-monetario ${totaisAnuais.balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}`}>
                <strong>{formatarMoeda(totaisAnuais.balanco)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
