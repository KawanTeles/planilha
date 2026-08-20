import { Router } from "express";
import { db } from "../db.js";
import { garantirLinhasDoMes as garantirFolhaDoMes } from "./folhaPagamento.js";
import { garantirLinhasDoMes as garantirRepasseDoMes } from "./repasses.js";

export const backupRouter = Router();

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const TABELAS = [
  "terapeutas",
  "colaboradores",
  "parcelas",
  "parcelas_lancamentos",
  "entradas",
  "saidas",
  "folha_pagamento",
  "repasses",
  "producao_lancamentos",
];

backupRouter.get("/", (req, res) => {
  const dados = { sistema: "Desenvolva", exportado_em: new Date().toISOString() };
  for (const tabela of TABELAS) {
    dados[tabela] = db.prepare(`SELECT * FROM ${tabela}`).all();
  }
  const nomeArquivo = `desenvolva-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.send(JSON.stringify(dados, null, 2));
});

function csvCampo(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function csvLinha(campos) {
  return campos.map(csvCampo).join(";") + "\r\n";
}

function csvSecao(titulo, cabecalho, linhas) {
  let saida = `${titulo}\r\n`;
  saida += csvLinha(cabecalho);
  for (const linha of linhas) saida += csvLinha(linha);
  saida += "\r\n";
  return saida;
}

backupRouter.get("/mes/:ano/:mes/csv", (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano)) {
    return res.status(400).json({ erro: "Mês/ano inválidos." });
  }

  garantirFolhaDoMes(ano, mes);
  garantirRepasseDoMes(ano, mes);

  const entradas = db.prepare("SELECT * FROM entradas WHERE ano = ? AND mes = ? ORDER BY id").all(ano, mes);
  const saidas = db.prepare("SELECT * FROM saidas WHERE ano = ? AND mes = ? ORDER BY id").all(ano, mes);
  const parcelas = db
    .prepare(
      `SELECT pl.*, p.descricao FROM parcelas_lancamentos pl
       JOIN parcelas p ON p.id = pl.parcela_id
       WHERE pl.ano = ? AND pl.mes = ? ORDER BY p.descricao`
    )
    .all(ano, mes);
  const folha = db
    .prepare(
      `SELECT fp.*, c.nome, c.cargo FROM folha_pagamento fp
       JOIN colaboradores c ON c.id = fp.colaborador_id
       WHERE fp.ano = ? AND fp.mes = ? ORDER BY c.nome`
    )
    .all(ano, mes);
  const repasses = db
    .prepare(
      `SELECT r.*, t.nome, t.especialidade FROM repasses r
       JOIN terapeutas t ON t.id = r.terapeuta_id
       WHERE r.ano = ? AND r.mes = ? ORDER BY t.nome`
    )
    .all(ano, mes);
  const mesFormatado = String(mes).padStart(2, "0");
  const producao = db
    .prepare(
      `SELECT pl.*, t.nome AS terapeuta_nome FROM producao_lancamentos pl
       JOIN terapeutas t ON t.id = pl.terapeuta_id
       WHERE strftime('%m', pl.data) = ? AND strftime('%Y', pl.data) = ?
       ORDER BY pl.data`
    )
    .all(mesFormatado, String(ano));

  let csv = `Desenvolva - Relatorio mensal - ${MESES_PT[mes - 1]}/${ano}\r\n\r\n`;

  csv += csvSecao(
    "ENTRADAS",
    ["Categoria", "Descricao", "Valor", "Status", "Data de recebimento"],
    entradas.map((e) => [e.categoria, e.descricao, e.valor.toFixed(2), e.status, e.data_recebimento ?? ""])
  );

  csv += csvSecao(
    "SAIDAS",
    ["Tipo", "Descricao", "Valor", "Status", "Data"],
    saidas.map((s) => [s.tipo, s.descricao, s.valor.toFixed(2), s.status, s.data ?? ""])
  );

  csv += csvSecao(
    "PARCELAS E EMPRESTIMOS DO MES",
    ["Descricao", "Numero da parcela", "Valor", "Status"],
    parcelas.map((p) => [p.descricao, p.numero_parcela, p.valor.toFixed(2), p.status])
  );

  csv += csvSecao(
    "FOLHA DE PAGAMENTO",
    ["Colaborador", "Cargo", "Tipo de pagamento", "Valor", "Status"],
    folha.map((f) => [f.nome, f.cargo, f.tipo_pagamento, f.valor.toFixed(2), f.status])
  );

  csv += csvSecao(
    "REPASSE DE PRESTADORES DE SERVICO",
    ["Terapeuta", "Especialidade", "Valor", "Status"],
    repasses.map((r) => [r.nome, r.especialidade, r.valor.toFixed(2), r.status])
  );

  csv += csvSecao(
    "PRODUCAO DE TERAPEUTAS",
    ["Tipo de servico", "Data", "Terapeuta", "Valor", "Percentual", "Valor terapeuta", "Valor clinica"],
    producao.map((p) => [
      p.tipo_servico,
      p.data,
      p.terapeuta_nome,
      p.valor.toFixed(2),
      p.percentual,
      p.valor_terapeuta.toFixed(2),
      p.valor_clinica.toFixed(2),
    ])
  );

  const nomeArquivo = `desenvolva-${MESES_PT[mes - 1].toLowerCase()}-${ano}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  // BOM no inicio para o Excel abrir acentos/UTF-8 corretamente no Windows
  res.send("﻿" + csv);
});
