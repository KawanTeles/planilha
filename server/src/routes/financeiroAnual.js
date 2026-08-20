import { Router } from "express";
import { db } from "../db.js";

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

financeiroAnualRouter.get("/:ano", (req, res) => {
  const ano = Number(req.params.ano);
  const meses = Array.from({ length: 12 }, (_, i) => novoMes(i + 1));
  const porMes = (mes) => meses[mes - 1];

  for (const row of db
    .prepare("SELECT mes, valor, status FROM entradas WHERE ano = ?")
    .all(ano)) {
    const m = porMes(row.mes);
    m.totalEntradas += row.valor;
    if (row.status === "recebido") m.totalRecebido += row.valor;
  }

  for (const row of db.prepare("SELECT mes, valor, status FROM saidas WHERE ano = ?").all(ano)) {
    const m = porMes(row.mes);
    m.totalSaidas += row.valor;
    if (row.status === "pago") m.totalSaidasPago += row.valor;
  }

  for (const row of db
    .prepare("SELECT mes, valor, status FROM parcelas_lancamentos WHERE ano = ?")
    .all(ano)) {
    const m = porMes(row.mes);
    m.totalParcelas += row.valor;
    if (row.status === "pago") m.totalParcelasPago += row.valor;
  }

  for (const row of db.prepare("SELECT mes, valor, status FROM folha_pagamento WHERE ano = ?").all(ano)) {
    const m = porMes(row.mes);
    m.totalFolha += row.valor;
    if (row.status === "pago") m.totalFolhaPago += row.valor;
  }

  for (const row of db.prepare("SELECT mes, valor, status FROM repasses WHERE ano = ?").all(ano)) {
    const m = porMes(row.mes);
    m.totalRepasses += row.valor;
    if (row.status === "pago") m.totalRepassesPago += row.valor;
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
  for (const row of db
    .prepare("SELECT categoria, SUM(valor) AS total FROM entradas WHERE ano = ? GROUP BY categoria")
    .all(ano)) {
    porCategoria[row.categoria] = row.total;
  }
  const entradasPorCategoria = CATEGORIAS.map((categoria) => ({ categoria, valor: porCategoria[categoria] }));

  res.json({ ano, meses, totaisAnuais, entradasPorCategoria });
});
