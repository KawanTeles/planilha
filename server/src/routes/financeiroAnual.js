import { Router } from "express";
import { query } from "../db.js";

export const financeiroAnualRouter = Router();

const CATEGORIAS = ["Unimed", "Bradesco", "Particular", "Sublocação de salas"];

function novoMes(mes) {
  return {
    mes,
    totalEntradas: 0,
    totalRecebido: 0,
    totalSaidas: 0,
    totalSaidasPago: 0,
    totalParcelas: 0,
    totalParcelasPago: 0,
    totalFolha: 0,
    totalFolhaPago: 0,
    totalRepasses: 0,
    totalRepassesPago: 0,
  };
}

financeiroAnualRouter.get("/:ano", async (req, res) => {
  const ano = Number(req.params.ano);
  const meses = Array.from({ length: 12 }, (_, i) => novoMes(i + 1));
  const porMes = (mes) => meses[mes - 1];

  for (const row of await query("SELECT mes, valor, status FROM entradas WHERE ano = $1", [ano])) {
    const m = porMes(row.mes);
    m.totalEntradas += Number(row.valor);
    if (row.status === "recebido") m.totalRecebido += Number(row.valor);
  }

  for (const row of await query("SELECT mes, valor, status FROM saidas WHERE ano = $1", [ano])) {
    const m = porMes(row.mes);
    m.totalSaidas += Number(row.valor);
    if (row.status === "pago") m.totalSaidasPago += Number(row.valor);
  }

  for (const row of await query("SELECT mes, valor, status FROM parcelas_lancamentos WHERE ano = $1", [ano])) {
    const m = porMes(row.mes);
    m.totalParcelas += Number(row.valor);
    if (row.status === "pago") m.totalParcelasPago += Number(row.valor);
  }

  for (const row of await query("SELECT mes, valor, status FROM folha_pagamento WHERE ano = $1", [ano])) {
    const m = porMes(row.mes);
    m.totalFolha += Number(row.valor);
    if (row.status === "pago") m.totalFolhaPago += Number(row.valor);
  }

  for (const row of await query("SELECT mes, valor, status FROM repasses WHERE ano = $1", [ano])) {
    const m = porMes(row.mes);
    m.totalRepasses += Number(row.valor);
    if (row.status === "pago") m.totalRepassesPago += Number(row.valor);
  }

  for (const m of meses) {
    m.balanco = m.totalRecebido - m.totalSaidasPago - m.totalParcelasPago - m.totalFolhaPago - m.totalRepassesPago;
  }

  const totaisAnuais = meses.reduce(
    (acc, m) => ({
      entradas: acc.entradas + m.totalEntradas,
      saidas: acc.saidas + m.totalSaidas,
      parcelas: acc.parcelas + m.totalParcelas,
      folha: acc.folha + m.totalFolha,
      repasses: acc.repasses + m.totalRepasses,
      balanco: acc.balanco + m.balanco,
    }),
    { entradas: 0, saidas: 0, parcelas: 0, folha: 0, repasses: 0, balanco: 0 }
  );

  const porCategoria = Object.fromEntries(CATEGORIAS.map((c) => [c, 0]));
  for (const row of await query(
    "SELECT categoria, SUM(valor) AS total FROM entradas WHERE ano = $1 GROUP BY categoria",
    [ano]
  )) {
    porCategoria[row.categoria] = Number(row.total);
  }
  const entradasPorCategoria = CATEGORIAS.map((categoria) => ({ categoria, valor: porCategoria[categoria] }));

  res.json({ ano, meses, totaisAnuais, entradasPorCategoria });
});
