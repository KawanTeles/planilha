// mesma regra do backend (server/src/utils/validarData.js) — aceita vazio (campo opcional)
// ou uma data real no formato YYYY-MM-DD, dentro de um intervalo plausível de nascimento
export function dataNascimentoValida(valor) {
  if (!valor) return true;
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
