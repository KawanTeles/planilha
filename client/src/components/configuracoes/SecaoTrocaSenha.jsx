import { useState } from "react";
import { KeyRound } from "lucide-react";

const VAZIO = { senha_atual: "", senha_nova: "", confirmar_senha_nova: "" };

// componente genérico — recebe o endpoint de troca de senha, pra poder ser reaproveitado
// futuramente (troca de senha de terapeutas/colaboradores) quando o login individual deles
// for liberado. Por enquanto só é usado pela seção do administrador.
export default function SecaoTrocaSenha({ titulo, descricao, endpoint }) {
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (form.senha_nova.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (form.senha_nova !== form.confirmar_senha_nova) {
      setErro("A confirmação não bate com a nova senha.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha_atual: form.senha_atual, senha_nova: form.senha_nova }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        setErro(dados.erro || "Não foi possível trocar a senha.");
        return;
      }
      setForm(VAZIO);
      setSucesso("Senha alterada com sucesso.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cartao">
      <div className="cabecalho-com-icone">
        <div className="atalho-icone-chip">
          <KeyRound size={22} strokeWidth={1.75} />
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          {descricao && <p className="texto-suave" style={{ margin: "4px 0 0" }}>{descricao}</p>}
        </div>
      </div>

      <form onSubmit={salvar} style={{ marginTop: 20 }}>
        {erro && <p className="mensagem-erro">{erro}</p>}
        {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

        <div className="campo" style={{ marginBottom: 14 }}>
          <label htmlFor={`${endpoint}-senha-atual`}>Senha atual</label>
          <input
            id={`${endpoint}-senha-atual`}
            type="password"
            value={form.senha_atual}
            onChange={(e) => setForm({ ...form, senha_atual: e.target.value })}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="linha-formulario">
          <div className="campo">
            <label htmlFor={`${endpoint}-senha-nova`}>Nova senha</label>
            <input
              id={`${endpoint}-senha-nova`}
              type="password"
              value={form.senha_nova}
              onChange={(e) => setForm({ ...form, senha_nova: e.target.value })}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="campo">
            <label htmlFor={`${endpoint}-confirmar-senha`}>Confirmar nova senha</label>
            <input
              id={`${endpoint}-confirmar-senha`}
              type="password"
              value={form.confirmar_senha_nova}
              onChange={(e) => setForm({ ...form, confirmar_senha_nova: e.target.value })}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <div className="formulario-acoes">
          <button type="submit" className="botao botao-primario" disabled={enviando}>
            {enviando ? "Salvando..." : "Trocar senha"}
          </button>
        </div>
      </form>
    </div>
  );
}
