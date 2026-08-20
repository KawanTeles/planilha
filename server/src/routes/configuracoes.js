import { Router } from "express";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../db.js";

// tudo aqui já exige sessão válida (montado depois do requireAuth em app.js)
export const configuracoesRouter = Router();

configuracoesRouter.put("/senha", async (req, res) => {
  const { senha_atual, senha_nova } = req.body;
  if (!senha_atual || !senha_nova) {
    return res.status(400).json({ erro: "Informe a senha atual e a nova senha." });
  }
  if (senha_nova.length < 6) {
    return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
  }
  const admin = await queryOne("SELECT * FROM administradores WHERE id = $1", [req.admin.sub]);
  if (!admin) {
    return res.status(401).json({ erro: "Não autenticado." });
  }
  const senhaAtualValida = await bcrypt.compare(senha_atual, admin.senha_hash);
  if (!senhaAtualValida) {
    // 400, não 401: senha atual errada é erro de validação da ação, não sessão inválida —
    // um 401 aqui seria pego pelo interceptor global do front e derrubaria a sessão à toa
    return res.status(400).json({ erro: "Senha atual incorreta." });
  }
  const novoHash = await bcrypt.hash(senha_nova, 12);
  await query("UPDATE administradores SET senha_hash = $1 WHERE id = $2", [novoHash, admin.id]);
  res.status(204).end();
});
