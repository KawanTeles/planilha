import { formatarMoeda } from "../../constants.js";
import { CheckCircle, RotateCcw } from "lucide-react";

export default function SecaoParcelasDoMes({ parcelas, onMudou }) {
  async function alternarStatus(lancamento) {
    const novoStatus = lancamento.status === "pago" ? "pendente" : "pago";
    await fetch(`/api/parcelas/lancamentos/${lancamento.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    onMudou();
  }

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Parcelas e empréstimos do mês</h3>
      </div>
      <p className="texto-suave">
        Gerados automaticamente pelo cadastro de Parcelas e Empréstimos — para adicionar um novo, use aquele módulo.
      </p>
      {parcelas.length === 0 ? (
        <p className="texto-suave" style={{ padding: "16px 0" }}>Nenhuma parcela cai neste mês.</p>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Descrição</th>
                <th className="valor-monetario">Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr key={p.id}>
                  <td>{p.descricao}</td>
                  <td className="valor-monetario">{formatarMoeda(p.valor)}</td>
                  <td>
                    <span className={`selo ${p.status === "pago" ? "selo-ativo" : "selo-inativo"}`}>
                      {p.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="acoes">
                    <button
                      className={`botao botao-pequeno ${p.status === "pago" ? "botao-secundario" : "botao-sucesso"}`}
                      onClick={() => alternarStatus(p)}
                      title={p.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                    >
                      {p.status === "pago" ? <RotateCcw size={14} strokeWidth={1.75} /> : <CheckCircle size={14} strokeWidth={1.75} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
