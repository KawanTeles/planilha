import { Fragment, useEffect, useState } from "react";
import { MESES, formatarMoeda, formatarMesAno } from "../constants.js";

const anoAtual = new Date().getFullYear();
const VAZIO = { descricao: "", valor_total: "", quantidade_parcelas: "", mes_inicio: "1", ano_inicio: String(anoAtual) };

export default function Parcelas() {
  const [parcelas, setParcelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [expandidoId, setExpandidoId] = useState(null);

  function carregar() {
    setCarregando(true);
    fetch("/api/parcelas")
      .then((r) => r.json())
      .then(setParcelas)
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(VAZIO);
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(parcela) {
    setEditandoId(parcela.id);
    setForm({
      descricao: parcela.descricao,
      valor_total: String(parcela.valor_total),
      quantidade_parcelas: String(parcela.quantidade_parcelas),
      mes_inicio: String(parcela.mes_inicio),
      ano_inicio: String(parcela.ano_inicio),
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
    const url = editandoId ? `/api/parcelas/${editandoId}` : "/api/parcelas";
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
    const salvo = await resposta.json();
    fecharForm();
    carregar();
    setExpandidoId(salvo.id);
  }

  async function excluir(parcela) {
    if (!window.confirm(`Excluir "${parcela.descricao}"? Isso remove também os lançamentos gerados em todos os meses.`)) {
      return;
    }
    await fetch(`/api/parcelas/${parcela.id}`, { method: "DELETE" });
    carregar();
  }

  const valorParcelaPrevia =
    form.valor_total && form.quantidade_parcelas && Number(form.quantidade_parcelas) > 0
      ? Number(form.valor_total) / Number(form.quantidade_parcelas)
      : null;

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Parcelas e Empréstimos</h2>
        {!formAberto && (
          <button className="botao botao-primario" onClick={abrirNovo}>
            + Novo parcelamento/empréstimo
          </button>
        )}
      </div>

      {formAberto && (
        <form className="formulario-flutuante" onSubmit={salvar}>
          <h3>{editandoId ? "Editar parcelamento/empréstimo" : "Novo parcelamento/empréstimo"}</h3>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <div className="campo">
            <label htmlFor="descricao">Descrição</label>
            <input
              id="descricao"
              type="text"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              autoFocus
              required
            />
          </div>
          <div className="linha-formulario">
            <div className="campo">
              <label htmlFor="valor_total">Valor total (R$)</label>
              <input
                id="valor_total"
                type="number"
                min="0.01"
                step="0.01"
                value={form.valor_total}
                onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="quantidade_parcelas">Quantidade de parcelas</label>
              <input
                id="quantidade_parcelas"
                type="number"
                min="1"
                step="1"
                value={form.quantidade_parcelas}
                onChange={(e) => setForm({ ...form, quantidade_parcelas: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="linha-formulario">
            <div className="campo">
              <label htmlFor="mes_inicio">Mês de início</label>
              <select
                id="mes_inicio"
                value={form.mes_inicio}
                onChange={(e) => setForm({ ...form, mes_inicio: e.target.value })}
              >
                {MESES.map((nome, i) => (
                  <option key={nome} value={i + 1}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="ano_inicio">Ano de início</label>
              <input
                id="ano_inicio"
                type="number"
                step="1"
                value={form.ano_inicio}
                onChange={(e) => setForm({ ...form, ano_inicio: e.target.value })}
                required
              />
            </div>
          </div>
          {valorParcelaPrevia !== null && (
            <p className="texto-suave">
              Valor de cada parcela (calculado automaticamente): <strong>{formatarMoeda(valorParcelaPrevia)}</strong>
            </p>
          )}
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
      ) : parcelas.length === 0 ? (
        <p className="texto-suave">Nenhuma parcela ou empréstimo cadastrado ainda.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor total</th>
              <th>Parcelas</th>
              <th>Valor da parcela</th>
              <th>Início</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {parcelas.map((p) => {
              const ultimo = p.lancamentos[p.lancamentos.length - 1];
              const expandido = expandidoId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td>{p.descricao}</td>
                    <td>{formatarMoeda(p.valor_total)}</td>
                    <td>{p.quantidade_parcelas}x</td>
                    <td>{formatarMoeda(p.lancamentos[0]?.valor ?? 0)}</td>
                    <td>
                      {formatarMesAno(p.mes_inicio, p.ano_inicio)}
                      {ultimo && (
                        <>
                          {" "}
                          <span className="texto-suave">até {formatarMesAno(ultimo.mes, ultimo.ano)}</span>
                        </>
                      )}
                    </td>
                    <td className="acoes">
                      <button
                        className="botao botao-secundario botao-pequeno"
                        onClick={() => setExpandidoId(expandido ? null : p.id)}
                      >
                        {expandido ? "Ocultar meses" : "Ver meses"}
                      </button>
                      <button className="botao botao-secundario botao-pequeno" onClick={() => abrirEdicao(p)}>
                        Editar
                      </button>
                      <button className="botao botao-perigo botao-pequeno" onClick={() => excluir(p)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {expandido && (
                    <tr>
                      <td colSpan={6} style={{ background: "var(--cor-lilas-suave)", padding: "12px 16px" }}>
                        <strong>Lançamentos gerados automaticamente:</strong>
                        <table className="tabela" style={{ marginTop: 8, background: "transparent" }}>
                          <thead>
                            <tr>
                              <th>Nº</th>
                              <th>Mês/Ano</th>
                              <th>Valor</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.lancamentos.map((l) => (
                              <tr key={l.id}>
                                <td>{l.numero_parcela}</td>
                                <td>{formatarMesAno(l.mes, l.ano)}</td>
                                <td>{formatarMoeda(l.valor)}</td>
                                <td>
                                  <span className={`selo ${l.status === "pago" ? "selo-ativo" : "selo-inativo"}`}>
                                    {l.status === "pago" ? "Pago" : "Pendente"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
