import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, RotateCcw, PiggyBank } from "lucide-react";
import { formatarMoeda } from "../../constants.js";
import { useConfirm } from "../ConfirmProvider.jsx";

const CATEGORIAS = ["Unimed", "Bradesco", "Particular", "Sublocação de salas"];

function formVazio(mes, ano) {
  return { mes, ano, categoria: CATEGORIAS[0], descricao: "", valor: "", status: "a_receber", data_recebimento: "" };
}

export default function SecaoEntradas({ mes, ano, entradas, onMudou }) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVazio(mes, ano));
  const [erro, setErro] = useState("");
  const confirmar = useConfirm();

  function abrirNovo() {
    setEditandoId(null);
    setForm(formVazio(mes, ano));
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(entrada) {
    setEditandoId(entrada.id);
    setForm({
      mes: entrada.mes,
      ano: entrada.ano,
      categoria: entrada.categoria,
      descricao: entrada.descricao,
      valor: String(entrada.valor),
      status: entrada.status,
      data_recebimento: entrada.data_recebimento || "",
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
    const url = editandoId ? `/api/entradas/${editandoId}` : "/api/entradas";
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

  async function alternarStatus(entrada) {
    const novoStatus = entrada.status === "recebido" ? "a_receber" : "recebido";
    await fetch(`/api/entradas/${entrada.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    onMudou();
  }

  async function excluir(entrada) {
    if (!(await confirmar(`Excluir a entrada "${entrada.descricao}"?`))) return;
    await fetch(`/api/entradas/${entrada.id}`, { method: "DELETE" });
    onMudou();
  }

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Entradas</h3>
        {!formAberto && (
          <button className="botao botao-primario botao-pequeno" onClick={abrirNovo}>
            <Plus size={16} strokeWidth={1.75} /> Nova entrada
          </button>
        )}
      </div>

      {formAberto && (
        <form className="formulario-flutuante" onSubmit={salvar}>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <div className="linha-formulario">
            <div className="campo">
              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Descrição</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                required
              />
            </div>
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
                <option value="a_receber">A receber</option>
                <option value="recebido">Recebido</option>
              </select>
            </div>
            <div className="campo">
              <label>Data de recebimento</label>
              <input
                type="date"
                value={form.data_recebimento}
                onChange={(e) => setForm({ ...form, data_recebimento: e.target.value })}
              />
            </div>
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

      {entradas.length === 0 ? (
        <div className="estado-vazio">
          <PiggyBank size={40} className="estado-vazio-icone" strokeWidth={1.5} />
          <h3>Nenhuma entrada lançada neste mês</h3>
          <p>Adicione entradas para ter controle sobre os seus recebimentos.</p>
        </div>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Descrição</th>
                <th className="valor-monetario">Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <tr key={e.id}>
                  <td>{e.categoria}</td>
                  <td>{e.descricao}</td>
                  <td className="valor-monetario">{formatarMoeda(e.valor)}</td>
                  <td>
                    <span className={`selo ${e.status === "recebido" ? "selo-ativo" : "selo-inativo"}`}>
                      {e.status === "recebido" ? "Recebido" : "A receber"}
                    </span>
                  </td>
                  <td className="acoes">
                    <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(e)}>
                      <Pencil size={14} strokeWidth={1.75} /> Editar
                    </button>
                    <button
                      className={`botao botao-pequeno ${e.status === "recebido" ? "botao-secundario" : "botao-sucesso"}`}
                      onClick={() => alternarStatus(e)}
                    >
                      {e.status === "recebido" ? <RotateCcw size={14} strokeWidth={1.75} /> : <CheckCircle size={14} strokeWidth={1.75} />}
                      {e.status === "recebido" ? "Marcar a receber" : "Marcar recebido"}
                    </button>
                    <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(e)}>
                      <Trash2 size={14} strokeWidth={1.75} /> Excluir
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
