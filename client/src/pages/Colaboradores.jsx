import { useEffect, useState } from "react";
import { Plus, Pencil, Power, PowerOff, Trash2, UserCircle } from "lucide-react";
import { dataNascimentoValida } from "../utils/validarData.js";
import { useConfirm } from "../components/ConfirmProvider.jsx";

const VAZIO = { nome: "", cargo: "", tipo_pagamento: "fixo", valor_base: "", data_nascimento: "" };

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const confirmar = useConfirm();

  function carregar() {
    setCarregando(true);
    fetch("/api/colaboradores")
      .then((r) => r.json())
      .then(setColaboradores)
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(VAZIO);
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(colaborador) {
    setEditandoId(colaborador.id);
    setForm({
      nome: colaborador.nome,
      cargo: colaborador.cargo,
      tipo_pagamento: colaborador.tipo_pagamento,
      valor_base: String(colaborador.valor_base),
      data_nascimento: colaborador.data_nascimento || "",
    });
    setErro("");
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(VAZIO);
    setErro("");
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    if (!dataNascimentoValida(form.data_nascimento)) {
      setErro("Data de nascimento inválida.");
      return;
    }
    const url = editandoId ? `/api/colaboradores/${editandoId}` : "/api/colaboradores";
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
    fecharForm();
    carregar();
  }

  async function alternarStatus(colaborador) {
    const novoStatus = colaborador.status === "ativo" ? "inativo" : "ativo";
    await fetch(`/api/colaboradores/${colaborador.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    carregar();
  }

  async function excluirDefinitivamente(colaborador) {
    const ok = await confirmar(
      `Excluir "${colaborador.nome}" definitivamente? Essa ação não pode ser desfeita. O histórico de folha de pagamento já lançado em meses anteriores continua intacto.`
    );
    if (!ok) return;
    await fetch(`/api/colaboradores/${colaborador.id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Colaboradores</h2>
        {!formAberto && (
          <button className="botao botao-primario" onClick={abrirNovo}>
            <Plus size={16} strokeWidth={1.75} /> Novo colaborador
          </button>
        )}
      </div>

      {formAberto && (
        <form className="formulario-flutuante" onSubmit={salvar}>
          <h3>{editandoId ? "Editar colaborador" : "Novo colaborador"}</h3>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <div className="linha-formulario">
            <div className="campo">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                autoFocus
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="cargo">Cargo</label>
              <input
                id="cargo"
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="linha-formulario">
            <div className="campo">
              <label htmlFor="tipo_pagamento">Tipo de pagamento</label>
              <select
                id="tipo_pagamento"
                value={form.tipo_pagamento}
                onChange={(e) => setForm({ ...form, tipo_pagamento: e.target.value })}
              >
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="valor_base">Valor base (R$)</label>
              <input
                id="valor_base"
                type="number"
                min="0"
                step="0.01"
                value={form.valor_base}
                onChange={(e) => setForm({ ...form, valor_base: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="linha-formulario">
            <div className="campo">
              <label htmlFor="data_nascimento">Data de nascimento</label>
              <input
                id="data_nascimento"
                type="date"
                value={form.data_nascimento}
                onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
              />
            </div>
          </div>
          <div className="formulario-acoes">
            <button type="button" className="botao botao-secundario" onClick={fecharForm}>
              Cancelar
            </button>
            <button type="submit" className="botao botao-primario">
              Salvar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <p className="texto-suave">Carregando...</p>
      ) : colaboradores.length === 0 ? (
        <div className="estado-vazio">
          <UserCircle size={48} className="estado-vazio-icone" strokeWidth={1.5} />
          <h3>Nenhum colaborador cadastrado</h3>
          <p>Cadastre sua equipe administrativa, recepção ou limpeza.</p>
        </div>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Tipo de pagamento</th>
                <th className="valor-monetario">Valor base</th>
                <th>Data de nascimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c) => (
                <tr key={c.id} className={c.status === "inativo" ? "inativo" : ""}>
                  <td>{c.nome}</td>
                  <td>{c.cargo}</td>
                  <td>
                    <span className={`selo ${c.tipo_pagamento === "fixo" ? "selo-azul" : "selo-dourado"}`}>
                      {c.tipo_pagamento === "fixo" ? "Fixo" : "Variável"}
                    </span>
                  </td>
                  <td className="valor-monetario">{formatarMoeda(c.valor_base)}</td>
                  <td>{formatarData(c.data_nascimento)}</td>
                  <td>
                    <span className={`selo ${c.status === "ativo" ? "selo-ativo" : "selo-inativo"}`}>
                      {c.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="acoes">
                    <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(c)}>
                      <Pencil size={14} strokeWidth={1.75} /> Editar
                    </button>
                    <button
                      className={`botao botao-pequeno ${c.status === "ativo" ? "botao-perigo" : "botao-sucesso"}`}
                      onClick={() => alternarStatus(c)}
                    >
                      {c.status === "ativo" ? <PowerOff size={14} strokeWidth={1.75} /> : <Power size={14} strokeWidth={1.75} />}
                      {c.status === "ativo" ? "Inativar" : "Reativar"}
                    </button>
                    {c.status === "inativo" && (
                      <button
                        className="botao botao-perigo botao-pequeno"
                        onClick={() => excluirDefinitivamente(c)}
                      >
                        <Trash2 size={14} strokeWidth={1.75} /> Excluir definitivamente
                      </button>
                    )}
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
