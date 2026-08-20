export function somar(lista, filtro) {
  return lista.filter(filtro ?? (() => true)).reduce((soma, item) => soma + Number(item.valor), 0);
}

// mesma fórmula usada no resumo mensal (Etapas 5-7): recebido − pago (saídas + parcelas + folha + repasses)
export function calcularBalancoMensal({ entradas, saidas, parcelasDoMes, folha, repasses }) {
  const totalRecebido = somar(entradas, (e) => e.status === "recebido");
  const totalSaidasPago = somar(saidas, (s) => s.status === "pago");
  const totalParcelasPago = somar(parcelasDoMes, (p) => p.status === "pago");
  const totalFolhaPago = somar(folha, (f) => f.status === "pago");
  const totalRepassesPago = somar(repasses, (r) => r.status === "pago");
  return totalRecebido - totalSaidasPago - totalParcelasPago - totalFolhaPago - totalRepassesPago;
}
