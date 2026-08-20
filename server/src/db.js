import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

export async function query(text, params) {
  const resultado = await pool.query(text, params);
  return resultado.rows;
}

export async function queryOne(text, params) {
  const linhas = await query(text, params);
  return linhas[0] ?? null;
}
