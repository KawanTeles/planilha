import SecaoTrocaSenha from "../components/configuracoes/SecaoTrocaSenha.jsx";

// Estrutura pensada pra crescer: quando o login individual de terapeutas/colaboradores
// for liberado no futuro, basta adicionar novas <SecaoTrocaSenha> aqui (ou uma lista deles)
// apontando pro endpoint correspondente — o componente já é genérico.
export default function Configuracoes() {
  return (
    <div>
      <div className="pagina-cabecalho">
        <h2>Configurações</h2>
      </div>

      <SecaoTrocaSenha
        titulo="Minha senha"
        descricao="Troque a senha da sua conta de administrador."
        endpoint="/api/configuracoes/senha"
      />
    </div>
  );
}
