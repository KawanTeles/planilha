import { useNavigate } from "react-router-dom";
import { MESES } from "../../constants.js";

export default function NavegadorMes({ ano, mes }) {
  const navigate = useNavigate();

  function irPara(novoMes, novoAno) {
    navigate(`/financeiro-mensal/${novoAno}/${novoMes}`);
  }

  function anterior() {
    if (mes === 1) irPara(12, ano - 1);
    else irPara(mes - 1, ano);
  }

  function proximo() {
    if (mes === 12) irPara(1, ano + 1);
    else irPara(mes + 1, ano);
  }

  return (
    <div className="navegador-mes">
      <button className="botao botao-secundario botao-pequeno" onClick={anterior} aria-label="Mês anterior">
        ‹
      </button>
      <div className="navegador-mes-seletores">
        <select value={mes} onChange={(e) => irPara(Number(e.target.value), ano)}>
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {nome}
            </option>
          ))}
        </select>
        <select value={ano} onChange={(e) => irPara(mes, Number(e.target.value))}>
          {Array.from({ length: 6 }, (_, i) => ano - 2 + i).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <button className="botao botao-secundario botao-pequeno" onClick={proximo} aria-label="Próximo mês">
        ›
      </button>
    </div>
  );
}
