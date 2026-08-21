import { Router } from "express";
import PDFDocument from "pdfkit";
import { query } from "../db.js";
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

backupRouter.get("/", async (req, res) => {
  const dados = { sistema: "Desenvolva", exportado_em: new Date().toISOString() };
  for (const tabela of TABELAS) {
    dados[tabela] = await query(`SELECT * FROM ${tabela}`);
  }
  const nomeArquivo = `desenvolva-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.send(JSON.stringify(dados, null, 2));
});

function formatarValorCampoPdf(valor) {
  if (valor === null || valor === undefined) return "—";
  if (valor instanceof Date) return valor.toISOString();
  return String(valor);
}

backupRouter.get("/pdf", async (req, res) => {
  const dados = {};
  for (const tabela of TABELAS) {
    dados[tabela] = await query(`SELECT * FROM ${tabela} ORDER BY id`);
  }

  const nomeArquivo = `desenvolva-backup-${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);

  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  doc.pipe(res);

  doc.fontSize(18).text("Desenvolva — Backup completo", { align: "left" });
  doc
    .fontSize(10)
    .fillColor("#555555")
    .text(`Exportado em: ${new Date().toLocaleString("pt-BR")}`);
  doc.fillColor("black");
  doc.moveDown(1);

  for (const tabela of TABELAS) {
    const linhas = dados[tabela];
    doc.addPage();
    doc.fontSize(15).text(tabela.toUpperCase(), { underline: true });
    doc.fontSize(9).fillColor("#555555").text(`${linhas.length} registro(s)`);
    doc.fillColor("black");
    doc.moveDown(0.5);

    if (linhas.length === 0) {
      doc.fontSize(10).text("Nenhum registro.");
      continue;
    }

    const colunas = Object.keys(linhas[0]);
    for (const linha of linhas) {
      const texto = colunas.map((c) => `${c}: ${formatarValorCampoPdf(linha[c])}`).join("   |   ");
      doc.fontSize(8).text(texto, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
      doc
        .moveTo(doc.page.margins.left, doc.y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
        .strokeColor("#dddddd")
        .stroke();
      doc.moveDown(0.4);
    }
  }

  doc.end();
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

backupRouter.get("/mes/:ano/:mes/csv", async (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano)) {
    return res.status(400).json({ erro: "Mês/ano inválidos." });
  }

  await garantirFolhaDoMes(ano, mes);
  await garantirRepasseDoMes(ano, mes);

  const entradas = await query("SELECT * FROM entradas WHERE ano = $1 AND mes = $2 ORDER BY id", [ano, mes]);
  const saidas = await query("SELECT * FROM saidas WHERE ano = $1 AND mes = $2 ORDER BY id", [ano, mes]);
  const parcelas = await query(
    `SELECT pl.*, p.descricao FROM parcelas_lancamentos pl
     JOIN parcelas p ON p.id = pl.parcela_id
     WHERE pl.ano = $1 AND pl.mes = $2 ORDER BY p.descricao`,
    [ano, mes]
  );
  const folha = await query(
    `SELECT fp.*, c.nome, c.cargo FROM folha_pagamento fp
     JOIN colaboradores c ON c.id = fp.colaborador_id
     WHERE fp.ano = $1 AND fp.mes = $2 ORDER BY c.nome`,
    [ano, mes]
  );
  const repasses = await query(
    `SELECT r.*, t.nome, t.especialidade FROM repasses r
     JOIN terapeutas t ON t.id = r.terapeuta_id
     WHERE r.ano = $1 AND r.mes = $2 ORDER BY t.nome`,
    [ano, mes]
  );
  const mesFormatado = String(mes).padStart(2, "0");
  const producao = await query(
    `SELECT pl.*, t.nome AS terapeuta_nome FROM producao_lancamentos pl
     JOIN terapeutas t ON t.id = pl.terapeuta_id
     WHERE to_char(pl.data::date, 'MM') = $1 AND to_char(pl.data::date, 'YYYY') = $2
     ORDER BY pl.data`,
    [mesFormatado, String(ano)]
  );

  let csv = `Desenvolva - Relatorio mensal - ${MESES_PT[mes - 1]}/${ano}\r\n\r\n`;

  csv += csvSecao(
    "ENTRADAS",
    ["Categoria", "Descricao", "Valor", "Status", "Data de recebimento"],
    entradas.map((e) => [e.categoria, e.descricao, Number(e.valor).toFixed(2), e.status, e.data_recebimento ?? ""])
  );

  csv += csvSecao(
    "SAIDAS",
    ["Tipo", "Descricao", "Valor", "Status", "Data"],
    saidas.map((s) => [s.tipo, s.descricao, Number(s.valor).toFixed(2), s.status, s.data ?? ""])
  );

  csv += csvSecao(
    "PARCELAS E EMPRESTIMOS DO MES",
    ["Descricao", "Numero da parcela", "Valor", "Status"],
    parcelas.map((p) => [p.descricao, p.numero_parcela, Number(p.valor).toFixed(2), p.status])
  );

  csv += csvSecao(
    "FOLHA DE PAGAMENTO",
    ["Colaborador", "Cargo", "Tipo de pagamento", "Valor", "Status"],
    folha.map((f) => [f.nome, f.cargo, f.tipo_pagamento, Number(f.valor).toFixed(2), f.status])
  );

  csv += csvSecao(
    "REPASSE DE PRESTADORES DE SERVICO",
    ["Terapeuta", "Especialidade", "Valor", "Status"],
    repasses.map((r) => [r.nome, r.especialidade, Number(r.valor).toFixed(2), r.status])
  );

  csv += csvSecao(
    "PRODUCAO DE TERAPEUTAS",
    ["Tipo de servico", "Data", "Terapeuta", "Valor", "Percentual", "Valor terapeuta", "Valor clinica"],
    producao.map((p) => [
      p.tipo_servico,
      p.data,
      p.terapeuta_nome,
      Number(p.valor).toFixed(2),
      p.percentual,
      Number(p.valor_terapeuta).toFixed(2),
      Number(p.valor_clinica).toFixed(2),
    ])
  );

  const nomeArquivo = `desenvolva-${MESES_PT[mes - 1].toLowerCase()}-${ano}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  // BOM no inicio para o Excel abrir acentos/UTF-8 corretamente no Windows
  res.send("﻿" + csv);
});
