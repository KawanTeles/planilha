import { Router } from "express";
import { db } from "../db.js";

export const repassesRouter = Router();

// o repasse NÃO tem valor no cadastro do terapeuta (só nome e especialidade) e não deve
// copiar o valor de nenhum mês anterior — cada mês nasce zerado, o valor é sempre digitado
// manualmente pela usuária (varia mês a mês por produção)
export function garantirLinhasDoMes(ano, mes) {
  const terapeutasAtivos = db.prepare("SELECT id FROM terapeutas WHERE status = 'ativo'").all();
  const inserir = db.prepare("INSERT OR IGNORE INTO repasses (terapeuta_id, mes, ano, valor) VALUES (?, ?, ?, 0)");
  for (const terapeuta of terapeutasAtivos) {
    inserir.run(terapeuta.id, mes, ano);
  }
}

repassesRouter.get("/mes/:ano/:mes", (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  garantirLinhasDoMes(ano, mes);
  const linhas = db
    .prepare(
      `SELECT r.id, r.terapeuta_id, r.mes, r.ano, r.valor, r.status,
              t.nome, t.especialidade
       FROM repasses r
       JOIN terapeutas t ON t.id = r.terapeuta_id
       WHERE r.ano = ? AND r.mes = ?
       ORDER BY t.nome`
    )
    .all(ano, mes);
  res.json(linhas);
});

repassesRouter.put("/:id", (req, res) => {
  const { valor } = req.body;
  if (valor === undefined || Number.isNaN(Number(valor)) || Number(valor) < 0) {
    return res.status(400).json({ erro: "Valor inválido." });
  }
  const existente = db.prepare("SELECT * FROM repasses WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  db.prepare("UPDATE repasses SET valor = ? WHERE id = ?").run(Number(valor), req.params.id);
  res.json(db.prepare("SELECT * FROM repasses WHERE id = ?").get(req.params.id));
});

repassesRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM repasses WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  db.prepare("UPDATE repasses SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(db.prepare("SELECT * FROM repasses WHERE id = ?").get(req.params.id));
});
