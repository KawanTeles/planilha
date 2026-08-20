import { useEffect, useState } from "react";

const VAZIO = { nome: "", especialidade: "" };

export default function Terapeutas() {
  const [terapeutas, setTerapeutas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");

  function carregar() {
    setCarregando(true);
    fetch("/api/terapeutas")
      .then((r) => r.json())
      .then(setTerapeutas)
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(VAZIO);
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(terapeuta) {
    setEditandoId(terapeuta.id);
    setForm({ nome: terapeuta.nome, especialidade: terapeuta.especialidade });
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
    const url = editandoId ? `/api/terapeutas/${editandoId}` : "/api/terapeutas";
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

  async function alternarStatus(terapeuta) {
    const novoStatus = terapeuta.status === "ativo" ? "inativo" : "ativo";
    await fetch(`/api/terapeutas/${terapeuta.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    carregar();
  }

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Terapeutas</h2>
        {!formAberto && (
          <button className="botao botao-primario" onClick={abrirNovo}>
            + Novo terapeuta
          </button>
        )}
      </div>

      {formAberto && (
        <form className="formulario-flutuante" onSubmit={salvar}>
          <h3>{editandoId ? "Editar terapeuta" : "Novo terapeuta"}</h3>
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
              <label htmlFor="especialidade">Especialidade</label>
              <input
                id="especialidade"
                type="text"
                value={form.especialidade}
                onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                required
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
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Especialidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {terapeutas.map((t) => (
              <tr key={t.id} className={t.status === "inativo" ? "inativo" : ""}>
                <td>{t.nome}</td>
                <td>{t.especialidade}</td>
                <td>
                  <span className={`selo ${t.status === "ativo" ? "selo-ativo" : "selo-inativo"}`}>
                    {t.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="acoes">
                  <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(t)}>
                    Editar
                  </button>
                  <button
                    className={`botao botao-pequeno ${t.status === "ativo" ? "botao-perigo" : "botao-sucesso"}`}
                    onClick={() => alternarStatus(t)}
                  >
                    {t.status === "ativo" ? "Inativar" : "Reativar"}
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
