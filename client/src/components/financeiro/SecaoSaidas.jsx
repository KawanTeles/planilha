import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, RotateCcw, Receipt } from "lucide-react";
import { formatarMoeda } from "../../constants.js";
import { useConfirm } from "../ConfirmProvider.jsx";

function formVazio(mes, ano, tipo) {
  return { mes, ano, tipo, descricao: "", valor: "", status: "pendente", data: "" };
}

export default function SecaoSaidas({ titulo, tipo, mes, ano, saidas, onMudou }) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVazio(mes, ano, tipo));
  const [erro, setErro] = useState("");
  const confirmar = useConfirm();

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
    if (!(await confirmar(`Excluir a saída "${saida.descricao}"?`))) return;
    await fetch(`/api/saidas/${saida.id}`, { method: "DELETE" });
    onMudou();
  }

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>{titulo}</h3>
        {!formAberto && (
          <button className="botao botao-primario botao-pequeno" onClick={abrirNovo}>
            <Plus size={16} strokeWidth={1.75} /> Nova
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
        <div className="estado-vazio" style={{ padding: "40px 20px" }}>
          <Receipt size={32} className="estado-vazio-icone" strokeWidth={1.5} />
          <h3 style={{ fontSize: "16px" }}>Nenhuma saída lançada</h3>
        </div>
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
              {saidas.map((s) => (
                <tr key={s.id}>
                  <td>{s.descricao}</td>
                  <td className="valor-monetario">{formatarMoeda(s.valor)}</td>
                  <td>
                    <span className={`selo ${s.status === "pago" ? "selo-ativo" : "selo-inativo"}`}>
                      {s.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="acoes">
                    <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(s)} title="Editar">
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                    <button
                      className={`botao botao-pequeno ${s.status === "pago" ? "botao-secundario" : "botao-sucesso"}`}
                      onClick={() => alternarStatus(s)}
                      title={s.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                    >
                      {s.status === "pago" ? <RotateCcw size={14} strokeWidth={1.75} /> : <CheckCircle size={14} strokeWidth={1.75} />}
                    </button>
                    <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(s)} title="Excluir">
                      <Trash2 size={14} strokeWidth={1.75} />
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
