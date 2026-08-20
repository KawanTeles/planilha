import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatarMoeda } from "../constants.js";
import { useConfirm } from "../components/ConfirmProvider.jsx";

// lista fechada, exatamente os 6 tipos da seção 6.8 do documento — não configurável pela usuária
const TIPOS_SERVICO = [
  "Integração Sensorial",
  "ABA / Prompt",
  "Atendimento Particular",
  "Bradesco",
  "Convencional",
  "Outros valores",
];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formVazio(tipo) {
  // percentual começa vazio de propósito: é sempre digitado manualmente a cada lançamento,
  // nunca tem valor padrão nem repete o do lançamento anterior
  return { tipo_servico: tipo, data: hoje(), terapeuta_id: "", valor: "", percentual: "" };
}

export default function ProducaoTerapeutas() {
  const [abaAtiva, setAbaAtiva] = useState(TIPOS_SERVICO[0]);
  const [lancamentos, setLancamentos] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVazio(TIPOS_SERVICO[0]));
  const [erro, setErro] = useState("");
  const confirmar = useConfirm();

  useEffect(() => {
    fetch("/api/terapeutas")
      .then((r) => r.json())
      .then((lista) => setTerapeutas(lista.filter((t) => t.status === "ativo")));
  }, []);

  function carregar() {
    setCarregando(true);
    fetch(`/api/producao?tipo=${encodeURIComponent(abaAtiva)}`)
      .then((r) => r.json())
      .then(setLancamentos)
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [abaAtiva]);

  function trocarAba(tipo) {
    setAbaAtiva(tipo);
    setFormAberto(false);
    setEditandoId(null);
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm(formVazio(abaAtiva));
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(l) {
    setEditandoId(l.id);
    setForm({
      tipo_servico: l.tipo_servico,
      data: l.data,
      terapeuta_id: String(l.terapeuta_id),
      valor: String(l.valor),
      percentual: String(l.percentual),
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
    const url = editandoId ? `/api/producao/${editandoId}` : "/api/producao";
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
    carregar();
  }

  async function excluir(l) {
    if (!(await confirmar(`Excluir este lançamento de ${l.terapeuta_nome}?`))) return;
    await fetch(`/api/producao/${l.id}`, { method: "DELETE" });
    carregar();
  }

  const previaTerapeuta =
    form.valor && form.percentual !== "" ? (Number(form.valor) * Number(form.percentual)) / 100 : null;
  const previaClinica =
    form.valor && form.percentual !== "" ? (Number(form.valor) * (100 - Number(form.percentual))) / 100 : null;

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Produção de Terapeutas</h2>
        <Link to="/financeiro-mensal" className="texto-suave">
          Ver repasse do mês →
        </Link>
      </div>
      <p className="texto-suave" style={{ marginTop: -10, marginBottom: 18 }}>
        Apoio de consulta/apuração por tipo de serviço — use esses números para preencher o repasse mensal, mas os
        dois módulos não são somados automaticamente.
      </p>

      <div className="abas-producao">
        {TIPOS_SERVICO.map((tipo) => (
          <button
            key={tipo}
            className={`aba-producao-item ${abaAtiva === tipo ? "ativa" : ""}`}
            onClick={() => trocarAba(tipo)}
          >
            {tipo}
          </button>
        ))}
      </div>

      <div className="bloco-financeiro">
        <div className="bloco-financeiro-cabecalho">
          <h3>{abaAtiva}</h3>
          {!formAberto && (
            <button className="botao botao-primario botao-pequeno" onClick={abrirNovo}>
              + Novo lançamento
            </button>
          )}
        </div>

        {formAberto && (
          <form className="formulario-flutuante" onSubmit={salvar}>
            {erro && <p className="mensagem-erro">{erro}</p>}
            <div className="linha-formulario">
              <div className="campo">
                <label>Data</label>
                <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="campo">
                <label>Terapeuta</label>
                <select
                  value={form.terapeuta_id}
                  onChange={(e) => setForm({ ...form, terapeuta_id: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {terapeutas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="linha-formulario">
              <div className="campo">
                <label>Valor do atendimento (R$)</label>
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
                <label>Percentual da terapeuta (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="ex: 60"
                  value={form.percentual}
                  onChange={(e) => setForm({ ...form, percentual: e.target.value })}
                  required
                />
              </div>
            </div>
            {previaTerapeuta !== null && (
              <p className="texto-suave">
                Valor da terapeuta: <strong>{formatarMoeda(previaTerapeuta)}</strong> · Valor da clínica:{" "}
                <strong>{formatarMoeda(previaClinica)}</strong>
              </p>
            )}
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

        {carregando ? (
          <p className="texto-suave">Carregando...</p>
        ) : lancamentos.length === 0 ? (
          <p className="texto-suave">Nenhum lançamento em "{abaAtiva}" ainda.</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Terapeuta</th>
                <th>Valor</th>
                <th>%</th>
                <th>Valor terapeuta</th>
                <th>Valor clínica</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                  <td>{l.terapeuta_nome}</td>
                  <td>{formatarMoeda(l.valor)}</td>
                  <td>{l.percentual}%</td>
                  <td>{formatarMoeda(l.valor_terapeuta)}</td>
                  <td>{formatarMoeda(l.valor_clinica)}</td>
                  <td className="acoes">
                    <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(l)}>
                      Editar
                    </button>
                    <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(l)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
