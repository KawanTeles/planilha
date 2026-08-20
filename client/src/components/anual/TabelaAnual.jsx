import { Link } from "react-router-dom";
import { MESES, formatarMoeda } from "../../constants.js";

export default function TabelaAnual({ ano, meses, totaisAnuais }) {
  return (
    <div className="bloco-financeiro" style={{ overflowX: "auto" }}>
      <div className="bloco-financeiro-cabecalho">
        <h3>Consolidado dos 12 meses</h3>
      </div>
      <table className="tabela tabela-anual">
        <thead>
          <tr>
            <th>Mês</th>
            <th>Entradas</th>
            <th>Saídas</th>
            <th>Folha</th>
            <th>Repasses</th>
            <th>Balanço</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.mes}>
              <td>
                <Link to={`/financeiro-mensal/${ano}/${m.mes}`}>{MESES[m.mes - 1]}</Link>
              </td>
              <td>{formatarMoeda(m.totalEntradas)}</td>
              <td>{formatarMoeda(m.totalSaidas)}</td>
              <td>{formatarMoeda(m.totalFolha)}</td>
              <td>{formatarMoeda(m.totalRepasses)}</td>
              <td className={m.balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}>
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
            <td>
              <strong>{formatarMoeda(totaisAnuais.entradas)}</strong>
            </td>
            <td>
              <strong>{formatarMoeda(totaisAnuais.saidas)}</strong>
            </td>
            <td>
              <strong>{formatarMoeda(totaisAnuais.folha)}</strong>
            </td>
            <td>
              <strong>{formatarMoeda(totaisAnuais.repasses)}</strong>
            </td>
            <td className={totaisAnuais.balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}>
              <strong>{formatarMoeda(totaisAnuais.balanco)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
