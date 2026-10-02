import mysql, { type Pool } from 'mysql2/promise';

let pool: Pool | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

export function getMariaDbPool(): Pool {
  if (pool) return pool;

  const port = Number(process.env.DB_PORT || '3306');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT inválida.');
  }

  pool = mysql.createPool({
    host: requiredEnv('DB_HOST'),
    port,
    user: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || '5'),
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  });

  return pool;
}
