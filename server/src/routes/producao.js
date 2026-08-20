import { Router } from "express";
import { db } from "../db.js";

export const producaoRouter = Router();

// lista fechada, exatamente os 6 tipos da seção 6.8 do documento — não configurável
export const TIPOS_SERVICO = [
  "Integração Sensorial",
  "ABA / Prompt",
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

producaoRouter.get("/", (req, res) => {
  const { tipo } = req.query;
  if (!TIPOS_SERVICO.includes(tipo)) {
    return res.status(400).json({ erro: "Tipo de serviço inválido." });
  }
  const lancamentos = db
    .prepare(
      `SELECT pl.*, t.nome AS terapeuta_nome
       FROM producao_lancamentos pl
       JOIN terapeutas t ON t.id = pl.terapeuta_id
       WHERE pl.tipo_servico = ?
       ORDER BY pl.data DESC, pl.id DESC`
    )
    .all(tipo);
  res.json(lancamentos);
});

producaoRouter.post("/", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { tipo_servico, data, terapeuta_id, valor, percentual } = req.body;
  const { valorTerapeuta, valorClinica } = calcular(valor, percentual);
  const resultado = db
    .prepare(
      `INSERT INTO producao_lancamentos
        (tipo_servico, data, terapeuta_id, valor, percentual, valor_terapeuta, valor_clinica)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(tipo_servico, data, Number(terapeuta_id), Number(valor), Number(percentual), valorTerapeuta, valorClinica);
  const criado = db
    .prepare(
      `SELECT pl.*, t.nome AS terapeuta_nome FROM producao_lancamentos pl
       JOIN terapeutas t ON t.id = pl.terapeuta_id WHERE pl.id = ?`
    )
    .get(resultado.lastInsertRowid);
  res.status(201).json(criado);
});

producaoRouter.put("/:id", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = db.prepare("SELECT * FROM producao_lancamentos WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Lançamento não encontrado." });
  const { tipo_servico, data, terapeuta_id, valor, percentual } = req.body;
  const { valorTerapeuta, valorClinica } = calcular(valor, percentual);
  db.prepare(
    `UPDATE producao_lancamentos
     SET tipo_servico = ?, data = ?, terapeuta_id = ?, valor = ?, percentual = ?, valor_terapeuta = ?, valor_clinica = ?
     WHERE id = ?`
  ).run(
    tipo_servico,
    data,
    Number(terapeuta_id),
    Number(valor),
    Number(percentual),
    valorTerapeuta,
    valorClinica,
    req.params.id
  );
  const atualizado = db
    .prepare(
      `SELECT pl.*, t.nome AS terapeuta_nome FROM producao_lancamentos pl
       JOIN terapeutas t ON t.id = pl.terapeuta_id WHERE pl.id = ?`
    )
    .get(req.params.id);
  res.json(atualizado);
});

producaoRouter.delete("/:id", (req, res) => {
  const existente = db.prepare("SELECT * FROM producao_lancamentos WHERE id = ?").get(req.params.id);
  if (!existente) return res.status(404).json({ erro: "Lançamento não encontrado." });
  db.prepare("DELETE FROM producao_lancamentos WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
