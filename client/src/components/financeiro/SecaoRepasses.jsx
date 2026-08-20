import { useState } from "react";
import { formatarMoeda } from "../../constants.js";
import { CheckCircle, RotateCcw } from "lucide-react";

function LinhaRepasse({ linha, onSalvarValor, onAlternarStatus }) {
  const [valor, setValor] = useState(String(linha.valor));

  function salvarSeMudou() {
    if (Number(valor) !== Number(linha.valor) && !Number.isNaN(Number(valor)) && Number(valor) >= 0) {
      onSalvarValor(linha, Number(valor));
    } else {
      setValor(String(linha.valor));
    }
  }

  return (
    <tr>
      <td>
        {linha.nome}
        <div className="texto-suave">{linha.especialidade}</div>
      </td>
      <td className="valor-monetario">
        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvarSeMudou}
          style={{ width: 110, padding: "6px 8px", border: "1px solid var(--borda)", borderRadius: 8, textAlign: "right" }}
        />
      </td>
      <td>
        <span className={`selo ${linha.status === "pago" ? "selo-ativo" : "selo-inativo"}`}>
          {linha.status === "pago" ? "Pago" : "Pendente"}
        </span>
      </td>
      <td className="acoes">
        <button
          className={`botao botao-pequeno ${linha.status === "pago" ? "botao-secundario" : "botao-sucesso"}`}
          onClick={() => onAlternarStatus(linha)}
          title={linha.status === "pago" ? "Marcar pendente" : "Marcar pago"}
        >
          {linha.status === "pago" ? <RotateCcw size={14} strokeWidth={1.75} /> : <CheckCircle size={14} strokeWidth={1.75} />}
        </button>
      </td>
    </tr>
  );
}

export default function SecaoRepasses({ repasses, onMudou }) {
  async function salvarValor(linha, novoValor) {
    await fetch(`/api/repasses/${linha.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: novoValor }),
    });
    onMudou();
  }

  async function alternarStatus(linha) {
    const novoStatus = linha.status === "pago" ? "pendente" : "pago";
    await fetch(`/api/repasses/${linha.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    onMudou();
  }

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Repasse de prestadores de serviço</h3>
      </div>
      <p className="texto-suave">
        Valor digitado manualmente todo mês, terapeuta por terapeuta — não é puxado do cadastro nem repetido do mês
        anterior.
      </p>
      {repasses.length === 0 ? (
        <p className="texto-suave" style={{ padding: "16px 0" }}>
          Nenhum terapeuta ativo cadastrado. Cadastre em "Terapeutas" para que apareçam aqui automaticamente.
        </p>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Terapeuta</th>
                <th className="valor-monetario">Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {repasses.map((linha) => (
                <LinhaRepasse key={linha.id} linha={linha} onSalvarValor={salvarValor} onAlternarStatus={alternarStatus} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
