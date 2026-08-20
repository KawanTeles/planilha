import { Router } from "express";
import { db } from "../db.js";

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

function gerarLancamentos(parcelaId, valorTotal, quantidade, mesInicio, anoInicio) {
  const valores = calcularValoresDasParcelas(valorTotal, quantidade);
  const inserir = db.prepare(
    "INSERT INTO parcelas_lancamentos (parcela_id, numero_parcela, mes, ano, valor) VALUES (?, ?, ?, ?, ?)"
  );
  let mes = mesInicio;
  let ano = anoInicio;
  for (let i = 0; i < quantidade; i++) {
    inserir.run(parcelaId, i + 1, mes, ano, valores[i]);
    ({ mes, ano } = proximoMes(mes, ano));
  }
}

function buscarComLancamentos(id) {
  const parcela = db.prepare("SELECT * FROM parcelas WHERE id = ?").get(id);
  if (!parcela) return null;
  const lancamentos = db
    .prepare("SELECT * FROM parcelas_lancamentos WHERE parcela_id = ? ORDER BY ano, mes")
    .all(id);
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

parcelasRouter.get("/", (req, res) => {
  const parcelas = db.prepare("SELECT id FROM parcelas ORDER BY ano_inicio, mes_inicio, id").all();
  res.json(parcelas.map((p) => buscarComLancamentos(p.id)));
});

parcelasRouter.get("/mes/:ano/:mes", (req, res) => {
  const { ano, mes } = req.params;
  const lancamentos = db
    .prepare(
      `SELECT pl.*, p.descricao
       FROM parcelas_lancamentos pl
       JOIN parcelas p ON p.id = pl.parcela_id
       WHERE pl.ano = ? AND pl.mes = ?
       ORDER BY p.descricao`
    )
    .all(Number(ano), Number(mes));
  res.json(lancamentos);
});

parcelasRouter.patch("/lancamentos/:id/status", (req, res) => {
  const { status } = req.body;
  if (status !== "pago" && status !== "pendente") {
    return res.status(400).json({ erro: "Status inválido." });
  }
  const existente = db.prepare("SELECT * FROM parcelas_lancamentos WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Lançamento não encontrado." });
  }
  db.prepare("UPDATE parcelas_lancamentos SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(db.prepare("SELECT * FROM parcelas_lancamentos WHERE id = ?").get(req.params.id));
});

parcelasRouter.post("/", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const { descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio } = req.body;

  const resultado = db
    .prepare(
      "INSERT INTO parcelas (descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio) VALUES (?, ?, ?, ?, ?)"
    )
    .run(descricao.trim(), Number(valor_total), Number(quantidade_parcelas), Number(mes_inicio), Number(ano_inicio));

  gerarLancamentos(
    resultado.lastInsertRowid,
    Number(valor_total),
    Number(quantidade_parcelas),
    Number(mes_inicio),
    Number(ano_inicio)
  );

  res.status(201).json(buscarComLancamentos(resultado.lastInsertRowid));
});

parcelasRouter.put("/:id", (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = db.prepare("SELECT * FROM parcelas WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Parcela/empréstimo não encontrado." });
  }
  const { descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio } = req.body;

  db.prepare(
    "UPDATE parcelas SET descricao = ?, valor_total = ?, quantidade_parcelas = ?, mes_inicio = ?, ano_inicio = ? WHERE id = ?"
  ).run(
    descricao.trim(),
    Number(valor_total),
    Number(quantidade_parcelas),
    Number(mes_inicio),
    Number(ano_inicio),
    req.params.id
  );

  // qualquer alteração nos parâmetros exige regerar os lançamentos mensais do zero —
  // mas o status "pago" de cada parcela é preservado pelo número dela (1ª, 2ª...),
  // já que o mês/valor exatos podem mudar mas "já paguei a 1ª parcela" continua valendo
  const statusAnterioresPorNumero = new Map(
    db
      .prepare("SELECT numero_parcela, status FROM parcelas_lancamentos WHERE parcela_id = ?")
      .all(req.params.id)
      .map((l) => [l.numero_parcela, l.status])
  );

  db.prepare("DELETE FROM parcelas_lancamentos WHERE parcela_id = ?").run(req.params.id);
  gerarLancamentos(
    Number(req.params.id),
    Number(valor_total),
    Number(quantidade_parcelas),
    Number(mes_inicio),
    Number(ano_inicio)
  );

  const marcarPago = db.prepare(
    "UPDATE parcelas_lancamentos SET status = 'pago' WHERE parcela_id = ? AND numero_parcela = ?"
  );
  for (const [numero, status] of statusAnterioresPorNumero) {
    if (status === "pago") marcarPago.run(req.params.id, numero);
  }

  res.json(buscarComLancamentos(req.params.id));
});

parcelasRouter.delete("/:id", (req, res) => {
  const existente = db.prepare("SELECT * FROM parcelas WHERE id = ?").get(req.params.id);
  if (!existente) {
    return res.status(404).json({ erro: "Parcela/empréstimo não encontrado." });
  }
  db.prepare("DELETE FROM parcelas WHERE id = ?").run(req.params.id);
  res.status(204).end();
});
