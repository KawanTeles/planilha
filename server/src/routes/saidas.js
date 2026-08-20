import { Router } from "express";
import { db } from "../db.js";

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

saidasRouter.get("/mes/:ano/:mes", (req, res) => {
  const { ano, mes } = req.params;
  const saidas = db.prepare("SELECT * FROM saidas WHERE ano = ? AND mes = ? ORDER BY id").all(Number(ano), Number(mes));
  res.json(saidas);
});

saidasRouter.post("/", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { mes, ano, tipo, descricao, valor, status, data } = req.body;
  const resultado = db
    .prepare("INSERT INTO saidas (mes, ano, tipo, descricao, valor, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(Number(mes), Number(ano), tipo, descricao.trim(), Number(valor), status || "pendente", data || null);
  const criado = db.prepare("SELECT * FROM saidas WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json(criado);
});

saidasRouter.put("/:id", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = db.prepare("SELECT * FROM saidas WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Saída não encontrada." });
  const { mes, ano, tipo, descricao, valor, status, data } = req.body;
  db.prepare(
    "UPDATE saidas SET mes = ?, ano = ?, tipo = ?, descricao = ?, valor = ?, status = ?, data = ? WHERE id = ?"
  ).run(Number(mes), Number(ano), tipo, descricao.trim(), Number(valor), status || "pendente", data || null, req.params.id);
  const atualizado = db.prepare("SELECT * FROM saidas WHERE id = ?").get(req.params.id);
  res.json(atualizado);
});

saidasRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM saidas WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Saída não encontrada." });
  db.prepare("UPDATE saidas SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(db.prepare("SELECT * FROM saidas WHERE id = ?").get(req.params.id));
});

saidasRouter.delete("/:id", (req, res) => {
  const existente = db.prepare("SELECT * FROM saidas WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Saída não encontrada." });
  db.prepare("DELETE FROM saidas WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
