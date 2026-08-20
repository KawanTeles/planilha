import { useNavigate } from "react-router-dom";

export default function NavegadorAno({ ano }) {
  const navigate = useNavigate();

  return (
    <div className="navegador-mes">
      <button className="botao botao-secundario botao-pequeno" onClick={() => navigate(`/financeiro-anual/${ano - 1}`)}>
        ‹
      </button>
      <div className="navegador-mes-seletores">
        <select value={ano} onChange={(e) => navigate(`/financeiro-anual/${e.target.value}`)}>
          {Array.from({ length: 6 }, (_, i) => ano - 3 + i).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <button className="botao botao-secundario botao-pequeno" onClick={() => navigate(`/financeiro-anual/${ano + 1}`)}>
        ›
      </button>
    </div>
  );
}
