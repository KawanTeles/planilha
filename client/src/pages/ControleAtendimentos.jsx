import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { MESES } from "../constants.js";
import GraficoAtaSistema from "../components/controle/GraficoAtaSistema.jsx";

const CONVENIOS = ["Unimed", "Bradesco", "Particular", "Sublocação de salas", "Outro"];
const NOMES_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const agora = new Date();

function paraISO(data) {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatarDiaMes(data) {
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

// semanas seguem o calendário normal (segunda a domingo); só as linhas de segunda a sexta
// aparecem, e semanas que cruzam a fronteira do mês mostram só os dias daquele mês
function gerarSemanasDoMes(ano, mes) {
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  const diaSemana = primeiroDia.getDay();
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  const cursor = new Date(ano, mes - 1, 1 + deslocamento);

  const semanas = [];
  while (cursor <= ultimoDia) {
    const dias = [];
    for (let i = 0; i < 5; i++) {
      const dia = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i);
      if (dia >= primeiroDia && dia <= ultimoDia) dias.push(dia);
    }
    if (dias.length > 0) semanas.push({ dias });
    cursor.setDate(cursor.getDate() + 7);
  }
  return semanas.map((s, i) => ({ ...s, indice: i + 1 }));
}

function valoresVazios() {
  return { ata: "", sistema: "", observacao: "" };
}

export default function ControleAtendimentos() {
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [terapeutas, setTerapeutas] = useState([]);
  const [terapeutaId, setTerapeutaId] = useState("");
  const [convenioSelecionado, setConvenioSelecionado] = useState(CONVENIOS[0]);
  const [convenioLivre, setConvenioLivre] = useState("");
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [valores, setValores] = useState({});
  const salvosRef = useRef({});

  useEffect(() => {
    fetch("/api/terapeutas")
      .then((r) => r.json())
      .then((lista) => setTerapeutas(lista.filter((t) => t.status === "ativo")));
  }, []);

  function carregar() {
    setCarregando(true);
    fetch(`/api/controle-atendimentos/mes/${ano}/${mes}`)
      .then((r) => r.json())
      .then(setRegistros)
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [ano, mes]);

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

  const convenioEfetivo = convenioSelecionado === "Outro" ? convenioLivre.trim() : convenioSelecionado;
  const filtroCompleto = Boolean(terapeutaId) && Boolean(convenioEfetivo);

  const semanas = useMemo(() => gerarSemanasDoMes(ano, mes), [ano, mes]);

  // sincroniza os campos editáveis com o que já está salvo sempre que muda o filtro/mês
  useEffect(() => {
    const novo = {};
    for (const semana of semanas) {
      for (const dia of semana.dias) {
        const iso = paraISO(dia);
        const existente = filtroCompleto
          ? registros.find(
              (r) => String(r.terapeuta_id) === terapeutaId && r.convenio === convenioEfetivo && r.data === iso
            )
          : null;
        novo[iso] = existente
          ? { ata: String(existente.ata), sistema: String(existente.sistema), observacao: existente.observacao || "" }
          : valoresVazios();
      }
    }
    setValores(novo);
    salvosRef.current = novo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registros, terapeutaId, convenioEfetivo, mes, ano]);

  function atualizarCampo(iso, campo, valor) {
    setValores((prev) => ({ ...prev, [iso]: { ...prev[iso], [campo]: valor } }));
  }

  async function salvarDia(iso) {
    if (!filtroCompleto) return;
    const atual = valores[iso] || valoresVazios();
    const salvo = salvosRef.current[iso] || valoresVazios();
    if (atual.ata === salvo.ata && atual.sistema === salvo.sistema && atual.observacao === salvo.observacao) return;

    const resposta = await fetch("/api/controle-atendimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terapeuta_id: terapeutaId,
        convenio: convenioEfetivo,
        data: iso,
        ata: Number(atual.ata || 0),
        sistema: Number(atual.sistema || 0),
        observacao: atual.observacao || "",
      }),
    });
    if (!resposta.ok) return;
    const linha = await resposta.json();
    setRegistros((prev) => [...prev.filter((r) => r.id !== linha.id), linha]);
    salvosRef.current = {
      ...salvosRef.current,
      [iso]: { ata: String(linha.ata), sistema: String(linha.sistema), observacao: linha.observacao || "" },
    };
  }

  // dashboard do rodapé: soma TODOS os registros do mês (todas terapeutas/convênios),
  // independente do filtro selecionado acima
  const resumoSemanas = semanas.map((semana) => {
    const isosSemana = new Set(semana.dias.map(paraISO));
    const doMes = registros.filter((r) => isosSemana.has(r.data));
    const totalAta = doMes.reduce((soma, r) => soma + Number(r.ata), 0);
    const totalSistema = doMes.reduce((soma, r) => soma + Number(r.sistema), 0);
    return { indice: semana.indice, totalAta, totalSistema, diferenca: totalSistema - totalAta };
  });
  const totalAtaMes = resumoSemanas.reduce((soma, s) => soma + s.totalAta, 0);
  const totalSistemaMes = resumoSemanas.reduce((soma, s) => soma + s.totalSistema, 0);
  const diferencaMes = totalSistemaMes - totalAtaMes;

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Controle de Atendimentos</h2>
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

      <div className="bloco-financeiro">
        <div className="bloco-financeiro-cabecalho">
          <h3>Filtro</h3>
        </div>
        <div className="linha-formulario">
          <div className="campo">
            <label>Terapeuta</label>
            <select value={terapeutaId} onChange={(e) => setTerapeutaId(e.target.value)}>
              <option value="">Selecione...</option>
              {terapeutas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Convênio</label>
            <select value={convenioSelecionado} onChange={(e) => setConvenioSelecionado(e.target.value)}>
              {CONVENIOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {convenioSelecionado === "Outro" && (
            <div className="campo">
              <label>Qual convênio?</label>
              <input
                type="text"
                value={convenioLivre}
                onChange={(e) => setConvenioLivre(e.target.value)}
                placeholder="Digite o nome do convênio"
              />
            </div>
          )}
        </div>
      </div>

      {carregando ? (
        <p className="texto-suave">Carregando...</p>
      ) : !filtroCompleto ? (
        <div className="estado-vazio">
          <ClipboardCheck size={40} className="estado-vazio-icone" strokeWidth={1.5} />
          <h3>Selecione terapeuta e convênio</h3>
          <p>Escolha uma terapeuta e um convênio acima para lançar e conferir os atendimentos do mês.</p>
        </div>
      ) : (
        semanas.map((semana) => {
          const totalAtaSemana = semana.dias.reduce(
            (soma, d) => soma + Number((valores[paraISO(d)] || valoresVazios()).ata || 0),
            0
          );
          const totalSistemaSemana = semana.dias.reduce(
            (soma, d) => soma + Number((valores[paraISO(d)] || valoresVazios()).sistema || 0),
            0
          );
          const diferencaSemana = totalSistemaSemana - totalAtaSemana;

          return (
            <div className="bloco-financeiro" key={semana.indice}>
              <div className="bloco-financeiro-cabecalho">
                <h3>
                  Semana {semana.indice} ({formatarDiaMes(semana.dias[0])} a {formatarDiaMes(semana.dias[semana.dias.length - 1])})
                </h3>
              </div>
              <div className="tabela-container">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th className="valor-monetario">Ata</th>
                      <th className="valor-monetario">Sistema</th>
                      <th className="valor-monetario">Diferença</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semana.dias.map((dia) => {
                      const iso = paraISO(dia);
                      const v = valores[iso] || valoresVazios();
                      const semDados = v.ata === "" && v.sistema === "";
                      const diferenca = Number(v.sistema || 0) - Number(v.ata || 0);
                      return (
                        <tr key={iso}>
                          <td>
                            {NOMES_DIA[dia.getDay()]} {formatarDiaMes(dia)}
                          </td>
                          <td className="valor-monetario">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={v.ata}
                              onChange={(e) => atualizarCampo(iso, "ata", e.target.value)}
                              onBlur={() => salvarDia(iso)}
                              style={{ width: 70, textAlign: "right" }}
                            />
                          </td>
                          <td className="valor-monetario">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={v.sistema}
                              onChange={(e) => atualizarCampo(iso, "sistema", e.target.value)}
                              onBlur={() => salvarDia(iso)}
                              style={{ width: 70, textAlign: "right" }}
                            />
                          </td>
                          <td className="valor-monetario">
                            {semDados ? (
                              <span className="texto-suave">—</span>
                            ) : diferenca === 0 ? (
                              <span className="selo selo-ativo">OK</span>
                            ) : (
                              <span className="selo selo-alerta">{diferenca > 0 ? `+${diferenca}` : diferenca}</span>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              value={v.observacao}
                              onChange={(e) => atualizarCampo(iso, "observacao", e.target.value)}
                              onBlur={() => salvarDia(iso)}
                              placeholder="Observação (opcional)"
                              style={{ width: "100%" }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <strong>Subtotal da semana</strong>
                      </td>
                      <td className="valor-monetario">
                        <strong>{totalAtaSemana}</strong>
                      </td>
                      <td className="valor-monetario">
                        <strong>{totalSistemaSemana}</strong>
                      </td>
                      <td className="valor-monetario">
                        <strong>{diferencaSemana === 0 ? "OK" : diferencaSemana > 0 ? `+${diferencaSemana}` : diferencaSemana}</strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })
      )}

      <div className="pagina-cabecalho" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Resumo do mês — {MESES[mes - 1]}/{ano}</h2>
      </div>
      <p className="texto-suave" style={{ marginTop: -8 }}>
        Soma de todas as terapeutas e convênios lançados no mês, independente do filtro acima.
      </p>

      {registros.length === 0 && !carregando ? (
        <div className="estado-vazio">
          <ClipboardCheck size={40} className="estado-vazio-icone" strokeWidth={1.5} />
          <h3>Nenhum atendimento lançado neste mês ainda</h3>
        </div>
      ) : (
        <>
          <div className="painel-linha-topo">
            <div className="cartao">
              <span className="texto-suave">Total na ata</span>
              <h3>{totalAtaMes}</h3>
            </div>
            <div className="cartao">
              <span className="texto-suave">Total no sistema</span>
              <h3>{totalSistemaMes}</h3>
            </div>
            <div className="cartao">
              <span className="texto-suave">Diferença do mês</span>
              <h3 className={diferencaMes === 0 ? "" : "balanco-negativo"}>
                {diferencaMes === 0 ? "OK" : diferencaMes > 0 ? `+${diferencaMes}` : diferencaMes}
              </h3>
            </div>
          </div>

          <GraficoAtaSistema semanas={resumoSemanas} />
        </>
      )}
    </div>
  );
}
