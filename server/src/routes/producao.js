import { Router } from "express";
import { query, queryOne } from "../db.js";

export const producaoRouter = Router();

// lista fechada — não configurável. "ABA" e "Prompt" são tipos separados (cada um com
// sua própria tabela e total no front), diferente do texto único "ABA / Prompt" de antes.
export const TIPOS_SERVICO = [
  "Integração Sensorial",
  "ABA",
  "Prompt",
  "Atendimento Particular",
  "Bradesco",
  "Convencional",
  "Outros valores",
];

function validar(body) {
  const { tipo_servico, data, terapeuta_id, valor, percentual } = body;
  if (!TIPOS_SERVICO.includes(tipo_servico)) return "Tipo de serviço inválido.";
  if (!data) return "Data é obrigatória.";
  if (!terapeuta_id) return "Terapeuta é obrigatório.";
  if (!valor || Number.isNaN(Number(valor)) || Number(valor) <= 0) return "Valor do atendimento inválido.";
  // percentual é sempre digitado manualmente a cada lançamento — sem valor padrão
  if (percentual === undefined || percentual === null || percentual === "") return "Percentual é obrigatório.";
  if (Number.isNaN(Number(percentual)) || Number(percentual) < 0 || Number(percentual) > 100) {
    return "Percentual deve estar entre 0 e 100.";
  }
  return null;
}

function calcular(valor, percentual) {
  const valorTerapeuta = Math.round(((Number(valor) * Number(percentual)) / 100) * 100) / 100;
  const valorClinica = Math.round(((Number(valor) * (100 - Number(percentual))) / 100) * 100) / 100;
  return { valorTerapeuta, valorClinica };
}

producaoRouter.get("/tipos", (req, res) => {
  res.json(TIPOS_SERVICO);
});

producaoRouter.get("/", async (req, res) => {
  const { tipo, mes, ano } = req.query;
  if (!TIPOS_SERVICO.includes(tipo)) {
    return res.status(400).json({ erro: "Tipo de serviço inválido." });
  }
  // mes/ano são opcionais: sem eles, mantém o comportamento antigo (lista tudo daquele tipo)
  if (mes && ano) {
    const mesFormatado = String(mes).padStart(2, "0");
    const lancamentos = await query(
      `SELECT pl.*, t.nome AS terapeuta_nome
       FROM producao_lancamentos pl
       JOIN terapeutas t ON t.id = pl.terapeuta_id
       WHERE pl.tipo_servico = $1 AND to_char(pl.data::date, 'MM') = $2 AND to_char(pl.data::date, 'YYYY') = $3
       ORDER BY pl.data DESC, pl.id DESC`,
      [tipo, mesFormatado, String(ano)]
    );
    return res.json(lancamentos);
  }
  const lancamentos = await query(
    `SELECT pl.*, t.nome AS terapeuta_nome
     FROM producao_lancamentos pl
     JOIN terapeutas t ON t.id = pl.terapeuta_id
     WHERE pl.tipo_servico = $1
     ORDER BY pl.data DESC, pl.id DESC`,
    [tipo]
  );
  res.json(lancamentos);
});

producaoRouter.post("/", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { tipo_servico, data, terapeuta_id, valor, percentual } = req.body;
  const { valorTerapeuta, valorClinica } = calcular(valor, percentual);
  const criado = await queryOne(
    `INSERT INTO producao_lancamentos
      (tipo_servico, data, terapeuta_id, valor, percentual, valor_terapeuta, valor_clinica)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [tipo_servico, data, Number(terapeuta_id), Number(valor), Number(percentual), valorTerapeuta, valorClinica]
  );
  const completo = await queryOne(
    `SELECT pl.*, t.nome AS terapeuta_nome FROM producao_lancamentos pl
     JOIN terapeutas t ON t.id = pl.terapeuta_id WHERE pl.id = $1`,
    [criado.id]
  );
  res.status(201).json(completo);
});

producaoRouter.put("/:id", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = await queryOne("SELECT * FROM producao_lancamentos WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Lançamento não encontrado." });
  const { tipo_servico, data, terapeuta_id, valor, percentual } = req.body;
  const { valorTerapeuta, valorClinica } = calcular(valor, percentual);
  await query(
    `UPDATE producao_lancamentos
     SET tipo_servico = $1, data = $2, terapeuta_id = $3, valor = $4, percentual = $5, valor_terapeuta = $6, valor_clinica = $7
     WHERE id = $8`,
    [
      tipo_servico,
      data,
      Number(terapeuta_id),
      Number(valor),
      Number(percentual),
      valorTerapeuta,
      valorClinica,
      req.params.id,
    ]
  );
  const atualizado = await queryOne(
    `SELECT pl.*, t.nome AS terapeuta_nome FROM producao_lancamentos pl
     JOIN terapeutas t ON t.id = pl.terapeuta_id WHERE pl.id = $1`,
    [req.params.id]
  );
  res.json(atualizado);
});

producaoRouter.delete("/:id", async (req, res) => {
  const existente = await queryOne("SELECT * FROM producao_lancamentos WHERE id = $1", [req.params.id]);
  if (!existente) return res.status(404).json({ erro: "Lançamento não encontrado." });
  await query("DELETE FROM producao_lancamentos WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
