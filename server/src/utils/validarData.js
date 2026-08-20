// aceita string vazia/undefined/null (campo opcional) ou uma data real no formato
// YYYY-MM-DD, dentro de um intervalo plausível de nascimento — rejeita formato errado,
// datas de calendário inexistentes (ex: 30/02) e anos absurdos
export function dataNascimentoValida(valor) {
  if (valor === undefined || valor === null || valor === "") return true;
  if (typeof valor !== "string") return false;

  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) return false;

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const data = new Date(ano, mes - 1, dia);
  const dataBateComEntrada = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!dataBateComEntrada) return false;

  const anoAtual = new Date().getFullYear();
  return ano >= 1930 && ano <= anoAtual;
}
