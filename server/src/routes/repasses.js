import { Router } from "express";
import { query, queryOne } from "../db.js";

export const repassesRouter = Router();

// o repasse NÃO tem valor no cadastro do terapeuta (só nome e especialidade) e não deve
// copiar o valor de nenhum mês anterior — cada mês nasce zerado, o valor é sempre digitado
// manualmente pela usuária (varia mês a mês por produção)
export async function garantirLinhasDoMes(ano, mes) {
  const terapeutasAtivos = await query("SELECT id FROM terapeutas WHERE status = 'ativo'");
  for (const terapeuta of terapeutasAtivos) {
    await query(
      `INSERT INTO repasses (terapeuta_id, mes, ano, valor)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (terapeuta_id, mes, ano) DO NOTHING`,
      [terapeuta.id, mes, ano]
    );
  }
}

repassesRouter.get("/mes/:ano/:mes", async (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  await garantirLinhasDoMes(ano, mes);
  const linhas = await query(
    `SELECT r.id, r.terapeuta_id, r.mes, r.ano, r.valor, r.status,
            t.nome, t.especialidade
     FROM repasses r
     JOIN terapeutas t ON t.id = r.terapeuta_id
     WHERE r.ano = $1 AND r.mes = $2
     ORDER BY t.nome`,
    [ano, mes]
  );
  res.json(linhas);
});

repassesRouter.put("/:id", async (req, res) => {
  const { valor } = req.body;
  if (valor === undefined || Number.isNaN(Number(valor)) || Number(valor) < 0) {
    return res.status(400).json({ erro: "Valor inválido." });
  }
  const existente = await queryOne("SELECT * FROM repasses WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  const atualizado = await queryOne(
    "UPDATE repasses SET valor = $1 WHERE id = $2 RETURNING *",
    [Number(valor), req.params.id]
  );
  res.json(atualizado);
});

repassesRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM repasses WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  const atualizado = await queryOne(
    "UPDATE repasses SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});
