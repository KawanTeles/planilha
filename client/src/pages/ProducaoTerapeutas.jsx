import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { MESES, formatarMoeda } from "../constants.js";
import { useConfirm } from "../components/ConfirmProvider.jsx";

// lista fechada, exatamente os tipos da seção 6.8 do documento — não configurável pela usuária.
// "ABA" e "Prompt" são tipos separados (cada um com aba, tabela e total próprios).
const TIPOS_SERVICO = [
  "Integração Sensorial",
  "ABA",
  "Prompt",
  "Atendimento Particular",
  "Bradesco",
  "Convencional",
  "Outros valores",
];

const agora = new Date();

function dataPadrao(mes, ano) {
  // se estiver vendo o mes/ano atual, usa a data de hoje; senao, o dia 1 do mes visualizado
  if (mes === agora.getMonth() + 1 && ano === agora.getFullYear()) {
    return agora.toISOString().slice(0, 10);
  }
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

function formVazio(tipo, mes, ano) {
  // percentual começa vazio de propósito: é sempre digitado manualmente a cada lançamento,
  // nunca tem valor padrão nem repete o do lançamento anterior
  return { tipo_servico: tipo, data: dataPadrao(mes, ano), terapeuta_id: "", valor: "", percentual: "" };
}

export default function ProducaoTerapeutas() {
  const [abaAtiva, setAbaAtiva] = useState(TIPOS_SERVICO[0]);
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [lancamentos, setLancamentos] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formVazio(TIPOS_SERVICO[0], agora.getMonth() + 1, agora.getFullYear()));
  const [erro, setErro] = useState("");
  const confirmar = useConfirm();

  useEffect(() => {
    fetch("/api/terapeutas")
      .then((r) => r.json())
      .then((lista) => setTerapeutas(lista.filter((t) => t.status === "ativo")));
  }, []);

  function carregar() {
    setCarregando(true);
    fetch(`/api/producao?tipo=${encodeURIComponent(abaAtiva)}&mes=${mes}&ano=${ano}`)
      .then((r) => r.json())
      .then(setLancamentos)
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [abaAtiva, mes, ano]);

  function trocarAba(tipo) {
    setAbaAtiva(tipo);
    setFormAberto(false);
    setEditandoId(null);
  }

  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  }

  function proximoMes() {
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm(formVazio(abaAtiva, mes, ano));
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

  const totalTerapeuta = lancamentos.reduce((soma, l) => soma + Number(l.valor_terapeuta), 0);
  const totalClinica = lancamentos.reduce((soma, l) => soma + Number(l.valor_clinica), 0);

  // lancamentos já vêm ordenados por data (desc) do backend — agrupar dias consecutivos
  // permite bater o "Total do dia" com a ata física, além do total do mês que já existia
  const gruposPorDia = [];
  for (const l of lancamentos) {
    const grupoAtual = gruposPorDia[gruposPorDia.length - 1];
    if (grupoAtual && grupoAtual.data === l.data) {
      grupoAtual.linhas.push(l);
      grupoAtual.totalTerapeuta += Number(l.valor_terapeuta);
      grupoAtual.totalClinica += Number(l.valor_clinica);
    } else {
      gruposPorDia.push({
        data: l.data,
        linhas: [l],
        totalTerapeuta: Number(l.valor_terapeuta),
        totalClinica: Number(l.valor_clinica),
      });
    }
  }

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Produção de Terapeutas</h2>
        <div className="navegador-mes">
          <button className="botao botao-secundario botao-pequeno" onClick={mesAnterior} aria-label="Mês anterior">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <span style={{ fontWeight: 600, minWidth: 120, textAlign: "center" }}>
            {MESES[mes - 1]}/{ano}
          </span>
          <button className="botao botao-secundario botao-pequeno" onClick={proximoMes} aria-label="Próximo mês">
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="pagina-cabecalho" style={{ marginTop: -10 }}>
        <p className="texto-suave">
          Apoio de consulta/apuração por tipo de serviço — use esses números para preencher o repasse mensal, mas os
          dois módulos não são somados automaticamente.
        </p>
        <Link to="/financeiro-mensal" className="texto-suave">
          Ver repasse do mês →
        </Link>
      </div>

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
              <Plus size={16} strokeWidth={1.75} /> Novo lançamento
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
          <div className="estado-vazio" style={{ padding: "40px 20px", marginTop: "20px" }}>
            <ClipboardList size={32} className="estado-vazio-icone" strokeWidth={1.5} />
            <h3 style={{ fontSize: "16px" }}>Nenhum lançamento em "{abaAtiva}"</h3>
          </div>
        ) : (
          <div className="tabela-container">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Terapeuta</th>
                  <th className="valor-monetario">Valor</th>
                  <th className="valor-monetario">%</th>
                  <th className="valor-monetario">Valor terapeuta</th>
                  <th className="valor-monetario">Valor clínica</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {gruposPorDia.map((grupo) => (
                  <Fragment key={grupo.data}>
                    {grupo.linhas.map((l) => (
                      <tr key={l.id}>
                        <td>{new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                        <td>{l.terapeuta_nome}</td>
                        <td className="valor-monetario">{formatarMoeda(l.valor)}</td>
                        <td className="valor-monetario">{l.percentual}%</td>
                        <td className="valor-monetario">{formatarMoeda(l.valor_terapeuta)}</td>
                        <td className="valor-monetario">{formatarMoeda(l.valor_clinica)}</td>
                        <td className="acoes">
                          <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(l)} title="Editar">
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(l)} title="Excluir">
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="linha-total-dia">
                      <td colSpan={4}>
                        <strong>
                          Total do dia — {new Date(grupo.data + "T00:00:00").toLocaleDateString("pt-BR")}
                        </strong>
                      </td>
                      <td className="valor-monetario">
                        <strong>{formatarMoeda(grupo.totalTerapeuta)}</strong>
                      </td>
                      <td className="valor-monetario">
                        <strong>{formatarMoeda(grupo.totalClinica)}</strong>
                      </td>
                      <td></td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <strong>Total do mês — {MESES[mes - 1]}/{ano}</strong>
                  </td>
                  <td className="valor-monetario">
                    <strong>{formatarMoeda(totalTerapeuta)}</strong>
                  </td>
                  <td className="valor-monetario">
                    <strong>{formatarMoeda(totalClinica)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
