import { Router } from "express";
import { query, queryOne } from "../db.js";

export const terapeutasRouter = Router();

terapeutasRouter.get("/", async (req, res) => {
  const terapeutas = await query("SELECT * FROM terapeutas ORDER BY nome");
  res.json(terapeutas);
});

terapeutasRouter.post("/", async (req, res) => {
  const { nome, especialidade } = req.body;
  if (!nome?.trim() || !especialidade?.trim()) {
    return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
  }
  const criado = await queryOne(
    "INSERT INTO terapeutas (nome, especialidade) VALUES ($1, $2) RETURNING *",
    [nome.trim(), especialidade.trim()]
  );
  res.status(201).json(criado);
});

terapeutasRouter.put("/:id", async (req, res) => {
  const { nome, especialidade } = req.body;
  if (!nome?.trim() || !especialidade?.trim()) {
    return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
  }
  const existente = await queryOne("SELECT * FROM terapeutas WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Terapeuta não encontrado." });
  }
  const atualizado = await queryOne(
    "UPDATE terapeutas SET nome = $1, especialidade = $2 WHERE id = $3 RETURNING *",
    [nome.trim(), especialidade.trim(), req.params.id]
  );
  res.json(atualizado);
});

terapeutasRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "ativo" && status !== "inativo") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM terapeutas WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Terapeuta não encontrado." });
  }
  const atualizado = await queryOne(
    "UPDATE terapeutas SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});
