import { Router } from "express";
import { query, queryOne } from "../db.js";
import { dataNascimentoValida } from "../utils/validarData.js";

export const terapeutasRouter = Router();

terapeutasRouter.get("/", async (req, res) => {
  const terapeutas = await query("SELECT * FROM terapeutas ORDER BY nome");
  res.json(terapeutas);
});

terapeutasRouter.post("/", async (req, res) => {
  const { nome, especialidade, data_nascimento } = req.body;
  if (!nome?.trim() || !especialidade?.trim()) {
    return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
  }
  if (!dataNascimentoValida(data_nascimento)) {
    return res.status(400).json({ erro: "Data de nascimento inválida." });
  }
  const criado = await queryOne(
    "INSERT INTO terapeutas (nome, especialidade, data_nascimento) VALUES ($1, $2, $3) RETURNING *",
    [nome.trim(), especialidade.trim(), data_nascimento || null]
  );
  res.status(201).json(criado);
});

terapeutasRouter.put("/:id", async (req, res) => {
  const { nome, especialidade, data_nascimento } = req.body;
  if (!nome?.trim() || !especialidade?.trim()) {
    return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
  }
  if (!dataNascimentoValida(data_nascimento)) {
    return res.status(400).json({ erro: "Data de nascimento inválida." });
  }
  const existente = await queryOne("SELECT * FROM terapeutas WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Terapeuta não encontrado." });
  }
  const atualizado = await queryOne(
    "UPDATE terapeutas SET nome = $1, especialidade = $2, data_nascimento = $3 WHERE id = $4 RETURNING *",
    [nome.trim(), especialidade.trim(), data_nascimento || null, req.params.id]
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
