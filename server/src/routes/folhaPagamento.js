import { Router } from "express";
import { query, queryOne } from "../db.js";

export const folhaPagamentoRouter = Router();

export async function garantirLinhasDoMes(ano, mes) {
  const colaboradoresAtivos = await query(
    "SELECT id, valor_base, tipo_pagamento FROM colaboradores WHERE status = 'ativo'"
  );
  // tipo_pagamento é gravado aqui, no momento da geração da linha do mês — não é
  // buscado ao vivo do cadastro depois, para que uma mudança futura no cadastro do
  // colaborador não reclassifique retroativamente meses já lançados
  for (const colaborador of colaboradoresAtivos) {
    await query(
      `INSERT INTO folha_pagamento (colaborador_id, mes, ano, valor, tipo_pagamento)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (colaborador_id, mes, ano) DO NOTHING`,
      [colaborador.id, mes, ano, colaborador.valor_base, colaborador.tipo_pagamento]
    );
  }
}

folhaPagamentoRouter.get("/mes/:ano/:mes", async (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  await garantirLinhasDoMes(ano, mes);
  const linhas = await query(
    `SELECT fp.id, fp.colaborador_id, fp.mes, fp.ano, fp.valor, fp.status, fp.tipo_pagamento,
            c.nome, c.cargo
     FROM folha_pagamento fp
     JOIN colaboradores c ON c.id = fp.colaborador_id
     WHERE fp.ano = $1 AND fp.mes = $2 AND c.excluido = false
     ORDER BY c.nome`,
    [ano, mes]
  );
  res.json(linhas);
});

folhaPagamentoRouter.put("/:id", async (req, res) => {
  const { valor } = req.body;
  if (valor === undefined || Number.isNaN(Number(valor)) || Number(valor) < 0) {
    return res.status(400).json({ erro: "Valor inválido." });
  }
  const existente = await queryOne("SELECT * FROM folha_pagamento WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  const atualizado = await queryOne(
    "UPDATE folha_pagamento SET valor = $1 WHERE id = $2 RETURNING *",
    [Number(valor), req.params.id]
  );
  res.json(atualizado);
});

folhaPagamentoRouter.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM folha_pagamento WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  const atualizado = await queryOne(
    "UPDATE folha_pagamento SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});
