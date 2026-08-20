import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryOne } from "../db.js";

export const authRouter = Router();

const NOME_COOKIE = "sessao";
const DURACAO_MS = 7 * 24 * 60 * 60 * 1000;
// hash bcrypt válido (de uma senha aleatória descartada), usado só para o compare
// rodar com o mesmo custo quando o email não existe — evita vazar por tempo de resposta
// se um email está cadastrado ou não
const HASH_FANTASMA = "$2b$12$.7JTJlHGWfyDNR2QM.WmC.d1.XBQGUHritAhg4Mbjn61/qhcpt20K";

function opcoesCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DURACAO_MS,
    path: "/",
  };
}

authRouter.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email?.trim() || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios." });
  }
  const admin = await queryOne("SELECT * FROM administradores WHERE email = $1", [email.trim().toLowerCase()]);
  // sempre roda o compare mesmo se o admin não existir, para o tempo de resposta
  // não vazar se o email está cadastrado ou não
  const senhaValida = await bcrypt.compare(senha, admin?.senha_hash ?? HASH_FANTASMA);
  if (!admin || !senhaValida) {
    return res.status(401).json({ erro: "Email ou senha inválidos." });
  }
  const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie(NOME_COOKIE, token, opcoesCookie());
  res.json({ id: admin.id, email: admin.email });
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(NOME_COOKIE, { ...opcoesCookie(), maxAge: 0 });
  res.status(204).end();
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.[NOME_COOKIE];
  if (!token) return res.status(401).json({ erro: "Não autenticado." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await queryOne("SELECT id, email FROM administradores WHERE id = $1", [payload.sub]);
    if (!admin) return res.status(401).json({ erro: "Sessão inválida." });
    res.json(admin);
  } catch {
    res.status(401).json({ erro: "Sessão inválida ou expirada." });
  }
});
