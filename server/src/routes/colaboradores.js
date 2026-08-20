import { Router } from "express";
import { db } from "../db.js";

export const colaboradoresRouter = Router();

function validar(body) {
  const { nome, cargo, tipo_pagamento, valor_base } = body;
  if (!nome?.trim() || !cargo?.trim()) {
    return "Nome e cargo são obrigatórios.";
  }
  if (tipo_pagamento !== "fixo" && tipo_pagamento !== "variavel") {
    return "Tipo de pagamento deve ser 'fixo' ou 'variavel'.";
  }
  if (valor_base === undefined || valor_base === null || Number.isNaN(Number(valor_base)) || Number(valor_base) < 0) {
    return "Valor base inválido.";
  }
  return null;
}

colaboradoresRouter.get("/", (req, res) => {
  const colaboradores = db.prepare("SELECT * FROM colaboradores ORDER BY nome").all();
  res.json(colaboradores);
});

colaboradoresRouter.post("/", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { nome, cargo, tipo_pagamento, valor_base } = req.body;
  const resultado = db
    .prepare("INSERT INTO colaboradores (nome, cargo, tipo_pagamento, valor_base) VALUES (?, ?, ?, ?)")
    .run(nome.trim(), cargo.trim(), tipo_pagamento, Number(valor_base));
  const criado = db.prepare("SELECT * FROM colaboradores WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json(criado);
});

colaboradoresRouter.put("/:id", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = db.prepare("SELECT * FROM colaboradores WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Colaborador não encontrado." });
  }
  const { nome, cargo, tipo_pagamento, valor_base } = req.body;
  db.prepare("UPDATE colaboradores SET nome = ?, cargo = ?, tipo_pagamento = ?, valor_base = ? WHERE id = ?").run(
    nome.trim(),
    cargo.trim(),
    tipo_pagamento,
    Number(valor_base),
    req.params.id
  );
  const atualizado = db.prepare("SELECT * FROM colaboradores WHERE id = ?").get(req.params.id);
  res.json(atualizado);
});

colaboradoresRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "ativo" && status !== "inativo") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM colaboradores WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Colaborador não encontrado." });
  }
  db.prepare("UPDATE colaboradores SET status = ? WHERE id = ?").run(status, req.params.id);
  const atualizado = db.prepare("SELECT * FROM colaboradores WHERE id = ?").get(req.params.id);
  res.json(atualizado);
});
