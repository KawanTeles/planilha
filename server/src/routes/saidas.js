import { Router } from "express";
import { query, queryOne } from "../db.js";

export const saidasRouter = Router();

function validar(body) {
  const { mes, ano, tipo, descricao, valor, status } = body;
  if (!Number.isInteger(Number(mes)) || Number(mes) < 1 || Number(mes) > 12) return "Mês inválido.";
  if (!Number.isInteger(Number(ano)) || Number(ano) < 2000) return "Ano inválido.";
  if (tipo !== "fixa" && tipo !== "variavel") return "Tipo deve ser 'fixa' ou 'variavel'.";
  if (!descricao?.trim()) return "Descrição é obrigatória.";
  if (valor === undefined || Number.isNaN(Number(valor)) || Number(valor) <= 0) return "Valor inválido.";
  if (status && status !== "pago" && status !== "pendente") return "Status inválido.";
  return null;
}

saidasRouter.get("/mes/:ano/:mes", async (req, res) => {
  const { ano, mes } = req.params;
  const saidas = await query(
    "SELECT * FROM saidas WHERE ano = $1 AND mes = $2 ORDER BY id",
    [Number(ano), Number(mes)]
  );
  res.json(saidas);
});

saidasRouter.post("/", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { mes, ano, tipo, descricao, valor, status, data } = req.body;
  const criado = await queryOne(
    `INSERT INTO saidas (mes, ano, tipo, descricao, valor, status, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [Number(mes), Number(ano), tipo, descricao.trim(), Number(valor), status || "pendente", data || null]
  );
  res.status(201).json(criado);
});

saidasRouter.put("/:id", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = await queryOne("SELECT * FROM saidas WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Saída não encontrada." });
  const { mes, ano, tipo, descricao, valor, status, data } = req.body;
  const atualizado = await queryOne(
    `UPDATE saidas SET mes = $1, ano = $2, tipo = $3, descricao = $4, valor = $5, status = $6, data = $7
     WHERE id = $8 RETURNING *`,
    [Number(mes), Number(ano), tipo, descricao.trim(), Number(valor), status || "pendente", data || null, req.params.id]
  );
  res.json(atualizado);
});

saidasRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM saidas WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Saída não encontrada." });
  const atualizado = await queryOne(
    "UPDATE saidas SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});

saidasRouter.delete("/:id", async (req, res) => {
  const existente = await queryOne("SELECT * FROM saidas WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Saída não encontrada." });
  await query("DELETE FROM saidas WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
