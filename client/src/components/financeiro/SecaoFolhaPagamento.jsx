import { useState } from "react";
import { formatarMoeda } from "../../constants.js";

function ColunaFolha({ titulo, linhas, onSalvarValor, onAlternarStatus }) {
  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>{titulo}</h3>
      </div>
      {linhas.length === 0 ? (
        <p className="texto-suave">Nenhum colaborador aqui.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <LinhaFolha
                key={linha.id}
                linha={linha}
                onSalvarValor={onSalvarValor}
                onAlternarStatus={onAlternarStatus}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function LinhaFolha({ linha, onSalvarValor, onAlternarStatus }) {
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
        <div className="texto-suave">{linha.cargo}</div>
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvarSeMudou}
          style={{ width: 110, padding: "6px 8px", border: "1px solid var(--borda)", borderRadius: 8 }}
        />
      </td>
      <td>
        <span className={`selo ${linha.status === "pago" ? "selo-ativo" : "selo-inativo"}`}>
          {linha.status === "pago" ? "Pago" : "Pendente"}
        </span>
      </td>
      <td>
        <button
          className={`botao botao-pequeno ${linha.status === "pago" ? "botao-secundario" : "botao-sucesso"}`}
          onClick={() => onAlternarStatus(linha)}
        >
          {linha.status === "pago" ? "Marcar pendente" : "Marcar pago"}
        </button>
      </td>
    </tr>
  );
}

export default function SecaoFolhaPagamento({ folha, onMudou }) {
  const fixos = folha.filter((f) => f.tipo_pagamento === "fixo");
  const variaveis = folha.filter((f) => f.tipo_pagamento === "variavel");

  async function salvarValor(linha, novoValor) {
    await fetch(`/api/folha-pagamento/${linha.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: novoValor }),
    });
    onMudou();
  }

  async function alternarStatus(linha) {
    const novoStatus = linha.status === "pago" ? "pendente" : "pago";
    await fetch(`/api/folha-pagamento/${linha.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    onMudou();
  }

  return (
    <div>
      <div className="bloco-financeiro-cabecalho">
        <h3 style={{ margin: "8px 0 0" }}>Folha de pagamento</h3>
      </div>
      {folha.length === 0 ? (
        <p className="texto-suave">
          Nenhum colaborador ativo cadastrado. Cadastre em "Colaboradores" para que apareçam aqui automaticamente.
        </p>
      ) : (
        <div className="saidas-lado-a-lado">
          <ColunaFolha titulo="Pagamentos fixos" linhas={fixos} onSalvarValor={salvarValor} onAlternarStatus={alternarStatus} />
          <ColunaFolha
            titulo="Pagamentos variáveis"
            linhas={variaveis}
            onSalvarValor={salvarValor}
            onAlternarStatus={alternarStatus}
          />
        </div>
      )}
    </div>
  );
}
