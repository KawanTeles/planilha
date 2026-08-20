import { Router } from "express";
import { db } from "../db.js";

export const backupRouter = Router();

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
