import { useState } from "react";
import { formatarMoeda } from "../../constants.js";

function formVazio(mes, ano, tipo) {
  return { mes, ano, tipo, descricao: "", valor: "", status: "pendente", data: "" };
}

export default function SecaoSaidas({ titulo, tipo, mes, ano, saidas, onMudou }) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVazio(mes, ano, tipo));
  const [erro, setErro] = useState("");

  function abrirNovo() {
    setEditandoId(null);
    setForm(formVazio(mes, ano, tipo));
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(saida) {
    setEditandoId(saida.id);
    setForm({
      mes: saida.mes,
      ano: saida.ano,
      tipo: saida.tipo,
      descricao: saida.descricao,
      valor: String(saida.valor),
      status: saida.status,
      data: saida.data || "",
    });
    setErro("");
    setFormAberto(true);
  }

  function fechar() {
    setFormAberto(false);
    setEditandoId(null);
    setErro("");
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    const url = editandoId ? `/api/saidas/${editandoId}` : "/api/saidas";
    const metodo = editandoId ? "PUT" : "POST";
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      setErro(dados.erro || "Não foi possível salvar.");
      return;
    }
    fechar();
    onMudou();
  }

  async function alternarStatus(saida) {
    const novoStatus = saida.status === "pago" ? "pendente" : "pago";
    await fetch(`/api/saidas/${saida.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    onMudou();
  }

  async function excluir(saida) {
    if (!window.confirm(`Excluir a saída "${saida.descricao}"?`)) return;
    await fetch(`/api/saidas/${saida.id}`, { method: "DELETE" });
    onMudou();
  }

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>{titulo}</h3>
        {!formAberto && (
          <button className="botao botao-primario botao-pequeno" onClick={abrirNovo}>
            + Nova
          </button>
        )}
      </div>

      {formAberto && (
        <form className="formulario-flutuante" onSubmit={salvar}>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <div className="campo">
            <label>Descrição</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
            />
          </div>
          <div className="linha-formulario">
            <div className="campo">
              <label>Valor (R$)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                required
              />
            </div>
            <div className="campo">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
          <div className="campo">
            <label>Data de vencimento/pagamento</label>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="formulario-acoes">
            <button type="button" className="botao botao-secundario" onClick={fechar}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario">
              Salvar
            </button>
          </div>
        </form>
      )}

      {saidas.length === 0 ? (
        <p className="texto-suave">Nenhuma saída lançada.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {saidas.map((s) => (
              <tr key={s.id}>
                <td>{s.descricao}</td>
                <td>{formatarMoeda(s.valor)}</td>
                <td>
                  <span className={`selo ${s.status === "pago" ? "selo-ativo" : "selo-inativo"}`}>
                    {s.status === "pago" ? "Pago" : "Pendente"}
                  </span>
                </td>
                <td className="acoes">
                  <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(s)}>
                    Editar
                  </button>
                  <button
                    className={`botao botao-pequeno ${s.status === "pago" ? "botao-secundario" : "botao-sucesso"}`}
                    onClick={() => alternarStatus(s)}
                  >
                    {s.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                  </button>
                  <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(s)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
