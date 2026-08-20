import { useEffect, useState } from "react";
import { Cake } from "lucide-react";
import { MESES } from "../constants.js";

function extrairMesDia(dataStr) {
  const data = new Date(dataStr + "T00:00:00");
  return { mes: data.getMonth() + 1, dia: data.getDate() };
}

export default function Aniversariantes() {
  const agora = new Date();
  const mes = agora.getMonth() + 1;

  const [terapeutas, setTerapeutas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    Promise.all([fetch("/api/terapeutas").then((r) => r.json()), fetch("/api/colaboradores").then((r) => r.json())])
      .then(([listaTerapeutas, listaColaboradores]) => {
        setTerapeutas(listaTerapeutas);
        setColaboradores(listaColaboradores);
      })
      .finally(() => setCarregando(false));
  }, []);

  const pessoas = [
    ...terapeutas
      .filter((t) => t.status === "ativo" && t.data_nascimento)
      .map((t) => ({ id: t.id, nome: t.nome, tipo: "Terapeuta", subtitulo: t.especialidade, data_nascimento: t.data_nascimento })),
    ...colaboradores
      .filter((c) => c.status === "ativo" && c.data_nascimento)
      .map((c) => ({ id: c.id, nome: c.nome, tipo: "Colaborador", subtitulo: c.cargo, data_nascimento: c.data_nascimento })),
  ];

  const aniversariantes = pessoas
    .map((p) => ({ ...p, ...extrairMesDia(p.data_nascimento) }))
    .filter((p) => p.mes === mes)
    .sort((a, b) => a.dia - b.dia);

  // destaca o próximo aniversário que ainda não passou este mês — sem cruzar pro mês
  // seguinte, pra não confundir com o que já foi comemorado
  const diaHoje = agora.getDate();
  const indiceProximo = aniversariantes.findIndex((p) => p.dia >= diaHoje);

  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Aniversariantes — {MESES[mes - 1]}</h2>
      </div>

      <div className="cartao">
        {carregando ? (
          <p className="texto-suave">Carregando...</p>
        ) : aniversariantes.length === 0 ? (
          <div className="estado-vazio">
            <Cake size={48} className="estado-vazio-icone" strokeWidth={1.5} />
            <h3>Ninguém faz aniversário este mês</h3>
            <p>Cadastre a data de nascimento em Terapeutas ou Colaboradores para que apareça aqui automaticamente.</p>
          </div>
        ) : (
          <ul className="lista-aniversariantes">
            {aniversariantes.map((p, indice) => (
              <li
                key={`${p.tipo}-${p.id}`}
                className={`item-aniversariante ${indice === indiceProximo ? "item-aniversariante-proximo" : ""}`}
              >
                <span className="aniversariante-dia">{String(p.dia).padStart(2, "0")}</span>
                <div className="aniversariante-info">
                  <strong>{p.nome}</strong>
                  <div className="texto-suave">
                    {p.tipo} · {p.subtitulo}
                  </div>
                </div>
                {indice === indiceProximo && <span className="aniversariante-selo-proximo">Próximo</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
