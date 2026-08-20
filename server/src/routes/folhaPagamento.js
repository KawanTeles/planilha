import { Router } from "express";
import { db } from "../db.js";

export const folhaPagamentoRouter = Router();

export function garantirLinhasDoMes(ano, mes) {
  const colaboradoresAtivos = db
    .prepare("SELECT id, valor_base, tipo_pagamento FROM colaboradores WHERE status = 'ativo'")
    .all();
  // tipo_pagamento é gravado aqui, no momento da geração da linha do mês — não é
  // buscado ao vivo do cadastro depois, para que uma mudança futura no cadastro do
  // colaborador não reclassifique retroativamente meses já lançados
  const inserir = db.prepare(
    "INSERT OR IGNORE INTO folha_pagamento (colaborador_id, mes, ano, valor, tipo_pagamento) VALUES (?, ?, ?, ?, ?)"
  );
  for (const colaborador of colaboradoresAtivos) {
    inserir.run(colaborador.id, mes, ano, colaborador.valor_base, colaborador.tipo_pagamento);
  }
}

folhaPagamentoRouter.get("/mes/:ano/:mes", (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  garantirLinhasDoMes(ano, mes);
  const linhas = db
    .prepare(
      `SELECT fp.id, fp.colaborador_id, fp.mes, fp.ano, fp.valor, fp.status, fp.tipo_pagamento,
              c.nome, c.cargo
       FROM folha_pagamento fp
       JOIN colaboradores c ON c.id = fp.colaborador_id
       WHERE fp.ano = ? AND fp.mes = ?
       ORDER BY c.nome`
    )
    .all(ano, mes);
  res.json(linhas);
});

folhaPagamentoRouter.put("/:id", (req, res) => {
  const { valor } = req.body;
  if (valor === undefined || Number.isNaN(Number(valor)) || Number(valor) < 0) {
    return res.status(400).json({ erro: "Valor inválido." });
  }
  const existente = db.prepare("SELECT * FROM folha_pagamento WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  db.prepare("UPDATE folha_pagamento SET valor = ? WHERE id = ?").run(Number(valor), req.params.id);
  res.json(db.prepare("SELECT * FROM folha_pagamento WHERE id = ?").get(req.params.id));
});

folhaPagamentoRouter.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM folha_pagamento WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Registro não encontrado." });
  db.prepare("UPDATE folha_pagamento SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(db.prepare("SELECT * FROM folha_pagamento WHERE id = ?").get(req.params.id));
});
