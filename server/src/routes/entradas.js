import { Router } from "express";
import { db } from "../db.js";

export const entradasRouter = Router();

const CATEGORIAS = ["Unimed", "Bradesco", "Particular", "Sublocação de salas"];

function validar(body) {
  const { mes, ano, categoria, descricao, valor, status } = body;
  if (!Number.isInteger(Number(mes)) || Number(mes) < 1 || Number(mes) > 12) return "Mês inválido.";
  if (!Number.isInteger(Number(ano)) || Number(ano) < 2000) return "Ano inválido.";
  if (!CATEGORIAS.includes(categoria)) return "Categoria inválida.";
  if (!descricao?.trim()) return "Descrição é obrigatória.";
  if (valor === undefined || Number.isNaN(Number(valor)) || Number(valor) <= 0) return "Valor inválido.";
  if (status && status !== "recebido" && status !== "a_receber") return "Status inválido.";
  return null;
}

entradasRouter.get("/mes/:ano/:mes", (req, res) => {
  const { ano, mes } = req.params;
  const entradas = db
    .prepare("SELECT * FROM entradas WHERE ano = ? AND mes = ? ORDER BY id")
    .all(Number(ano), Number(mes));
  res.json(entradas);
});

entradasRouter.post("/", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { mes, ano, categoria, descricao, valor, status, data_recebimento } = req.body;
  const resultado = db
    .prepare(
      "INSERT INTO entradas (mes, ano, categoria, descricao, valor, status, data_recebimento) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      Number(mes),
      Number(ano),
      categoria,
      descricao.trim(),
      Number(valor),
      status || "a_receber",
      data_recebimento || null
    );
  const criado = db.prepare("SELECT * FROM entradas WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json(criado);
});

entradasRouter.put("/:id", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = db.prepare("SELECT * FROM entradas WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Entrada não encontrada." });
  const { mes, ano, categoria, descricao, valor, status, data_recebimento } = req.body;
  db.prepare(
    "UPDATE entradas SET mes = ?, ano = ?, categoria = ?, descricao = ?, valor = ?, status = ?, data_recebimento = ? WHERE id = ?"
  ).run(
    Number(mes),
    Number(ano),
    categoria,
    descricao.trim(),
    Number(valor),
    status || "a_receber",
    data_recebimento || null,
    req.params.id
  );
  const atualizado = db.prepare("SELECT * FROM entradas WHERE id = ?").get(req.params.id);
  res.json(atualizado);
});

entradasRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "recebido" && status !== "a_receber") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM entradas WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Entrada não encontrada." });
  db.prepare("UPDATE entradas SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(db.prepare("SELECT * FROM entradas WHERE id = ?").get(req.params.id));
});

entradasRouter.delete("/:id", (req, res) => {
  const existente = db.prepare("SELECT * FROM entradas WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Entrada não encontrada." });
  db.prepare("DELETE FROM entradas WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
