import { Router } from "express";
import { query, queryOne } from "../db.js";

export const controleAtendimentosRouter = Router();

function validar(body) {
  const { terapeuta_id, convenio, data, ata, sistema } = body;
  if (!terapeuta_id) return "Terapeuta é obrigatório.";
  if (!convenio?.trim()) return "Convênio é obrigatório.";
  if (!data) return "Data é obrigatória.";
  if (ata === undefined || ata === null || !Number.isInteger(Number(ata)) || Number(ata) < 0) {
    return "Atendimentos na ata inválido.";
  }
  if (sistema === undefined || sistema === null || !Number.isInteger(Number(sistema)) || Number(sistema) < 0) {
    return "Atendimentos no sistema inválido.";
  }
  return null;
}

// retorna todos os lançamentos do mês, de todas as terapeutas e convênios — o filtro de
// cima (terapeuta + convênio) é aplicado no front, porque o dashboard do rodapé soma tudo
controleAtendimentosRouter.get("/mes/:ano/:mes", async (req, res) => {
  const ano = Number(req.params.ano);
  const mes = Number(req.params.mes);
  const mesFormatado = String(mes).padStart(2, "0");
  const linhas = await query(
    `SELECT ca.*, t.nome AS terapeuta_nome
     FROM controle_atendimentos ca
     JOIN terapeutas t ON t.id = ca.terapeuta_id
     WHERE to_char(ca.data::date, 'MM') = $1 AND to_char(ca.data::date, 'YYYY') = $2
     ORDER BY ca.data`,
    [mesFormatado, String(ano)]
  );
  res.json(linhas);
});

// upsert por (terapeuta_id, convenio, data) — cada dia útil só tem uma linha por
// terapeuta+convênio, editada diretamente na grade da semana
controleAtendimentosRouter.post("/", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { terapeuta_id, convenio, data, ata, sistema, observacao } = req.body;
  const linha = await queryOne(
    `INSERT INTO controle_atendimentos (terapeuta_id, convenio, data, ata, sistema, observacao)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (terapeuta_id, convenio, data)
     DO UPDATE SET ata = excluded.ata, sistema = excluded.sistema, observacao = excluded.observacao
     RETURNING id`,
    [Number(terapeuta_id), convenio.trim(), data, Number(ata), Number(sistema), observacao?.trim() || null]
  );
  const completo = await queryOne(
    `SELECT ca.*, t.nome AS terapeuta_nome FROM controle_atendimentos ca
     JOIN terapeutas t ON t.id = ca.terapeuta_id WHERE ca.id = $1`,
    [linha.id]
  );
  res.status(200).json(completo);
});
