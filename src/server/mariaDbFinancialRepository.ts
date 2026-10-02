import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { MonthData } from '../types';
import { getMariaDbPool } from './mariadb';

interface UserRow extends RowDataPacket {
  id: number;
}

interface MonthRow extends RowDataPacket {
  month_id: string;
  salary: string | number;
  expenses: string | MonthData['expenses'];
  extra_incomes: string | MonthData['extraIncomes'];
  piggy_bank: string | MonthData['piggyBank'];
  investments: string | NonNullable<MonthData['investments']>;
}

function parseJsonArray<T>(value: string | T[] | null): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Coluna JSON financeira inválida.');
  return parsed;
}

function validateMonth(monthId: string, data: MonthData) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthId)) throw new Error('Mês inválido.');
  if (!Number.isFinite(data.salary) || data.salary < 0) throw new Error('Salário inválido.');
  for (const key of ['expenses', 'extraIncomes', 'piggyBank'] as const) {
    if (!Array.isArray(data[key])) throw new Error(`Campo ${key} inválido.`);
  }
  if (data.investments !== undefined && !Array.isArray(data.investments)) {
    throw new Error('Campo investments inválido.');
  }
}

async function resolveAppUserId(
  firebaseUid: string,
  connection: Pool | PoolConnection = getMariaDbPool(),
): Promise<number> {
  const [rows] = await connection.execute<UserRow[]>(
    `SELECT id
       FROM app_users
      WHERE firebase_uid = ? AND status = 'active'
      LIMIT 1`,
    [firebaseUid],
  );
  if (!rows[0]) throw new Error('Usuário autenticado não está vinculado ao MariaDB.');
  return rows[0].id;
}

async function saveMonthWithConnection(
  connection: PoolConnection,
  userId: number,
  monthId: string,
  data: MonthData,
) {
  validateMonth(monthId, data);
  await connection.execute(
    `INSERT INTO financial_months
       (user_id, month_id, salary, expenses, extra_incomes, piggy_bank, investments, legacy_source, source_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'mariadb', UTC_TIMESTAMP(6))
     ON DUPLICATE KEY UPDATE
       salary = VALUES(salary),
       expenses = VALUES(expenses),
       extra_incomes = VALUES(extra_incomes),
       piggy_bank = VALUES(piggy_bank),
       investments = VALUES(investments),
       legacy_source = 'mariadb',
       source_updated_at = UTC_TIMESTAMP(6)`,
    [
      userId,
      monthId,
      data.salary,
      JSON.stringify(data.expenses),
      JSON.stringify(data.extraIncomes),
      JSON.stringify(data.piggyBank),
      JSON.stringify(data.investments ?? []),
    ],
  );
}

export async function checkMariaDbConnection(): Promise<boolean> {
  try {
    await getMariaDbPool().query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[MariaDB] Falha no teste de conexão:', error);
    return false;
  }
}

export async function getAllMariaDbMonths(firebaseUid: string): Promise<Record<string, MonthData>> {
  const pool = getMariaDbPool();
  const userId = await resolveAppUserId(firebaseUid, pool);
  const [rows] = await pool.execute<MonthRow[]>(
    `SELECT month_id, salary, expenses, extra_incomes, piggy_bank, investments
       FROM financial_months
      WHERE user_id = ?
      ORDER BY month_id`,
    [userId],
  );

  return Object.fromEntries(rows.map((row) => [row.month_id, {
    salary: Number(row.salary),
    expenses: parseJsonArray(row.expenses),
    extraIncomes: parseJsonArray(row.extra_incomes),
    piggyBank: parseJsonArray(row.piggy_bank),
    investments: parseJsonArray(row.investments),
  }]));
}

export async function saveMariaDbMonth(firebaseUid: string, monthId: string, data: MonthData) {
  const pool = getMariaDbPool();
  const connection = await pool.getConnection();
  try {
    const userId = await resolveAppUserId(firebaseUid, connection);
    await connection.beginTransaction();
    await saveMonthWithConnection(connection, userId, monthId, data);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function saveAllMariaDbMonths(firebaseUid: string, months: Record<string, MonthData>) {
  const pool = getMariaDbPool();
  const connection = await pool.getConnection();
  try {
    const userId = await resolveAppUserId(firebaseUid, connection);
    await connection.beginTransaction();
    for (const [monthId, data] of Object.entries(months)) {
      await saveMonthWithConnection(connection, userId, monthId, data);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
