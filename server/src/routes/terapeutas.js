import { Router } from "express";
import { db } from "../db.js";

export const terapeutasRouter = Router();

terapeutasRouter.get("/", (req, res) => {
  const terapeutas = db.prepare("SELECT * FROM terapeutas ORDER BY nome").all();
  res.json(terapeutas);
});

terapeutasRouter.post("/", (req, res) => {
  const { nome, especialidade } = req.body;
  if (!nome?.trim() || !especialidade?.trim()) {
    return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
  }
  const resultado = db
    .prepare("INSERT INTO terapeutas (nome, especialidade) VALUES (?, ?)")
    .run(nome.trim(), especialidade.trim());
  const criado = db.prepare("SELECT * FROM terapeutas WHERE id = ?").get(resultado.lastInsertRowid);
  res.status(201).json(criado);
});

terapeutasRouter.put("/:id", (req, res) => {
  const { nome, especialidade } = req.body;
  if (!nome?.trim() || !especialidade?.trim()) {
    return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
  }
  const existente = db.prepare("SELECT * FROM terapeutas WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Terapeuta não encontrado." });
  }
  db.prepare("UPDATE terapeutas SET nome = ?, especialidade = ? WHERE id = ?").run(
    nome.trim(),
    especialidade.trim(),
    req.params.id
  );
  const atualizado = db.prepare("SELECT * FROM terapeutas WHERE id = ?").get(req.params.id);
  res.json(atualizado);
});

terapeutasRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "ativo" && status !== "inativo") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM terapeutas WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Terapeuta não encontrado." });
  }
  db.prepare("UPDATE terapeutas SET status = ? WHERE id = ?").run(status, req.params.id);
  const atualizado = db.prepare("SELECT * FROM terapeutas WHERE id = ?").get(req.params.id);
  res.json(atualizado);
});
