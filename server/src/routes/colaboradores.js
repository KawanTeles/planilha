import { Router } from "express";
import { query, queryOne } from "../db.js";

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

colaboradoresRouter.get("/", async (req, res) => {
  const colaboradores = await query("SELECT * FROM colaboradores ORDER BY nome");
  res.json(colaboradores);
});

colaboradoresRouter.post("/", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { nome, cargo, tipo_pagamento, valor_base } = req.body;
  const criado = await queryOne(
    "INSERT INTO colaboradores (nome, cargo, tipo_pagamento, valor_base) VALUES ($1, $2, $3, $4) RETURNING *",
    [nome.trim(), cargo.trim(), tipo_pagamento, Number(valor_base)]
  );
  res.status(201).json(criado);
});

colaboradoresRouter.put("/:id", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = await queryOne("SELECT * FROM colaboradores WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Colaborador não encontrado." });
  }
  const { nome, cargo, tipo_pagamento, valor_base } = req.body;
  const atualizado = await queryOne(
    "UPDATE colaboradores SET nome = $1, cargo = $2, tipo_pagamento = $3, valor_base = $4 WHERE id = $5 RETURNING *",
    [nome.trim(), cargo.trim(), tipo_pagamento, Number(valor_base), req.params.id]
  );
  res.json(atualizado);
});

colaboradoresRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "ativo" && status !== "inativo") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM colaboradores WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Colaborador não encontrado." });
  }
  const atualizado = await queryOne(
    "UPDATE colaboradores SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});
