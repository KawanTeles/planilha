import { Router } from "express";
import { query, queryOne } from "../db.js";

export const parcelasRouter = Router();

function calcularValoresDasParcelas(valorTotal, quantidade) {
  const totalCentavos = Math.round(valorTotal * 100);
  const baseCentavos = Math.floor(totalCentavos / quantidade);
  const valoresCentavos = Array(quantidade).fill(baseCentavos);
  const diferenca = totalCentavos - baseCentavos * quantidade;
  // distribui os centavos que sobraram do arredondamento na última parcela,
  // garantindo que a soma das parcelas feche exatamente com o valor total
  valoresCentavos[quantidade - 1] += diferenca;
  return valoresCentavos.map((c) => c / 100);
}

function proximoMes(mes, ano) {
  return mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };
}

async function gerarLancamentos(parcelaId, valorTotal, quantidade, mesInicio, anoInicio) {
  const valores = calcularValoresDasParcelas(valorTotal, quantidade);
  let mes = mesInicio;
  let ano = anoInicio;
  for (let i = 0; i < quantidade; i++) {
    await query(
      "INSERT INTO parcelas_lancamentos (parcela_id, numero_parcela, mes, ano, valor) VALUES ($1, $2, $3, $4, $5)",
      [parcelaId, i + 1, mes, ano, valores[i]]
    );
    ({ mes, ano } = proximoMes(mes, ano));
  }
}

async function buscarComLancamentos(id) {
  const parcela = await queryOne("SELECT * FROM parcelas WHERE id = $1", [id]);
  if (!parcela) return null;
  const lancamentos = await query(
    "SELECT * FROM parcelas_lancamentos WHERE parcela_id = $1 ORDER BY ano, mes",
    [id]
  );
  return { ...parcela, lancamentos };
}

function validar(body) {
  const { descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio } = body;
  if (!descricao?.trim()) return "Descrição é obrigatória.";
  if (!valor_total || Number.isNaN(Number(valor_total)) || Number(valor_total) <= 0) {
    return "Valor total inválido.";
  }
  if (!Number.isInteger(Number(quantidade_parcelas)) || Number(quantidade_parcelas) < 1) {
    return "Quantidade de parcelas inválida.";
  }
  if (!Number.isInteger(Number(mes_inicio)) || Number(mes_inicio) < 1 || Number(mes_inicio) > 12) {
    return "Mês de início inválido.";
  }
  if (!Number.isInteger(Number(ano_inicio)) || Number(ano_inicio) < 2000) {
    return "Ano de início inválido.";
  }
  return null;
}

parcelasRouter.get("/", async (req, res) => {
  const parcelas = await query("SELECT id FROM parcelas ORDER BY ano_inicio, mes_inicio, id");
  const completas = await Promise.all(parcelas.map((p) => buscarComLancamentos(p.id)));
  res.json(completas);
});

parcelasRouter.get("/mes/:ano/:mes", async (req, res) => {
  const { ano, mes } = req.params;
  const lancamentos = await query(
    `SELECT pl.*, p.descricao
     FROM parcelas_lancamentos pl
     JOIN parcelas p ON p.id = pl.parcela_id
     WHERE pl.ano = $1 AND pl.mes = $2
     ORDER BY p.descricao`,
    [Number(ano), Number(mes)]
  );
  res.json(lancamentos);
});

parcelasRouter.patch("/lancamentos/:id/status", async (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = await queryOne("SELECT * FROM parcelas_lancamentos WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Lançamento não encontrado." });
  }
  const atualizado = await queryOne(
    "UPDATE parcelas_lancamentos SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(atualizado);
});

parcelasRouter.post("/", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio } = req.body;

  const criada = await queryOne(
    `INSERT INTO parcelas (descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [descricao.trim(), Number(valor_total), Number(quantidade_parcelas), Number(mes_inicio), Number(ano_inicio)]
  );

  await gerarLancamentos(
    criada.id,
    Number(valor_total),
    Number(quantidade_parcelas),
    Number(mes_inicio),
    Number(ano_inicio)
  );

  res.status(201).json(await buscarComLancamentos(criada.id));
});

parcelasRouter.put("/:id", async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = await queryOne("SELECT * FROM parcelas WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Parcela/empréstimo não encontrado." });
  }
  const { descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio } = req.body;

  await query(
    "UPDATE parcelas SET descricao = $1, valor_total = $2, quantidade_parcelas = $3, mes_inicio = $4, ano_inicio = $5 WHERE id = $6",
    [
      descricao.trim(),
      Number(valor_total),
      Number(quantidade_parcelas),
      Number(mes_inicio),
      Number(ano_inicio),
      req.params.id,
    ]
  );

  // qualquer alteração nos parâmetros exige regerar os lançamentos mensais do zero —
  // mas o status "pago" de cada parcela é preservado pelo número dela (1ª, 2ª...),
  // já que o mês/valor exatos podem mudar mas "já paguei a 1ª parcela" continua valendo
  const statusAnteriores = await query(
    "SELECT numero_parcela, status FROM parcelas_lancamentos WHERE parcela_id = $1",
    [req.params.id]
  );
  const statusAnterioresPorNumero = new Map(statusAnteriores.map((l) => [l.numero_parcela, l.status]));

  await query("DELETE FROM parcelas_lancamentos WHERE parcela_id = $1", [req.params.id]);
  await gerarLancamentos(
    Number(req.params.id),
    Number(valor_total),
    Number(quantidade_parcelas),
    Number(mes_inicio),
    Number(ano_inicio)
  );

  for (const [numero, status] of statusAnterioresPorNumero) {
    if (status === "pago") {
      await query(
        "UPDATE parcelas_lancamentos SET status = 'pago' WHERE parcela_id = $1 AND numero_parcela = $2",
        [req.params.id, numero]
      );
    }
  }

  res.json(await buscarComLancamentos(req.params.id));
});

parcelasRouter.delete("/:id", async (req, res) => {
  const existente = await queryOne("SELECT * FROM parcelas WHERE id = $1", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ erro: "Parcela/empréstimo não encontrado." });
  }
  await query("DELETE FROM parcelas WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
