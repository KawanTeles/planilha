import { Router } from "express";
import { query, queryOne } from "../db.js";

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

entradasRouter.get("/mes/:ano/:mes", async (req, res) => {
  const { ano, mes } = req.params;
  const entradas = await query(
    "SELECT * FROM entradas WHERE ano = $1 AND mes = $2 ORDER BY id",
    [Number(ano), Number(mes)]
  );
  res.json(entradas);
});

entradasRouter.post("/", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { mes, ano, categoria, descricao, valor, status, data_recebimento } = req.body;
  const criado = await queryOne(
    `INSERT INTO entradas (mes, ano, categoria, descricao, valor, status, data_recebimento)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      Number(mes),
      Number(ano),
      categoria,
      descricao.trim(),
      Number(valor),
      status || "a_receber",
      data_recebimento || null,
    ]
  );
  res.status(201).json(criado);
});

entradasRouter.put("/:id", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = await queryOne("SELECT * FROM entradas WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Entrada não encontrada." });
  const { mes, ano, categoria, descricao, valor, status, data_recebimento } = req.body;
  const atualizado = await queryOne(
    `UPDATE entradas SET mes = $1, ano = $2, categoria = $3, descricao = $4, valor = $5, status = $6, data_recebimento = $7
     WHERE id = $8 RETURNING *`,
    [
      Number(mes),
      Number(ano),
      categoria,
      descricao.trim(),
      Number(valor),
      status || "a_receber",
      data_recebimento || null,
      req.params.id,
    ]
  );
  res.json(atualizado);
});

entradasRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "recebido" && status !== "a_receber") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM entradas WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Entrada não encontrada." });
  const atualizado = await queryOne(
    "UPDATE entradas SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});

entradasRouter.delete("/:id", async (req, res) => {
  const existente = await queryOne("SELECT * FROM entradas WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Entrada não encontrada." });
  await query("DELETE FROM entradas WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
