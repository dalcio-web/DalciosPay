import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspace = process.cwd();
const inputPath = path.join(workspace, 'migration-input', 'financial_db.months.json');
const outputPath = path.join(workspace, 'migration-input', 'import-financial-data.sql');
const expectedFirebaseUid = process.env.MIGRATION_FIREBASE_UID?.trim();
const adminEmail = process.env.MIGRATION_ADMIN_EMAIL?.trim();
if (!expectedFirebaseUid || !adminEmail) {
  throw new Error('Defina MIGRATION_FIREBASE_UID e MIGRATION_ADMIN_EMAIL antes de gerar o SQL.');
}

function normalizeExtendedJson(value) {
  if (Array.isArray(value)) return value.map(normalizeExtendedJson);
  if (!value || typeof value !== 'object') return value;

  const keys = Object.keys(value);
  if (keys.length === 1) {
    if ('$oid' in value) return String(value.$oid);
    if ('$date' in value) return String(value.$date);
    if ('$numberInt' in value) return Number(value.$numberInt);
    if ('$numberLong' in value) return Number(value.$numberLong);
    if ('$numberDouble' in value) return Number(value.$numberDouble);
    if ('$numberDecimal' in value) return String(value.$numberDecimal);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, normalizeExtendedJson(nested)]),
  );
}

function sqlUtf8(value) {
  const hex = Buffer.from(String(value), 'utf8').toString('hex');
  return `CONVERT(0x${hex} USING utf8mb4)`;
}

function validateDocument(document, index) {
  if (!document || typeof document !== 'object') throw new Error(`Documento ${index} inválido.`);
  if (typeof document.userId !== 'string' || !document.userId) throw new Error(`Documento ${index} sem userId.`);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(document.monthId)) {
    throw new Error(`Documento ${index} contém monthId inválido.`);
  }
  const salary = Number(document.salary ?? 0);
  if (!Number.isFinite(salary) || salary < 0) throw new Error(`Documento ${index} contém salário inválido.`);
  const updatedAt = new Date(normalizeExtendedJson(document.updatedAt));
  if (Number.isNaN(updatedAt.getTime())) throw new Error(`Documento ${index} sem updatedAt válido.`);
}

const raw = await readFile(inputPath, 'utf8');
const sourceHash = createHash('sha256').update(raw).digest('hex').toUpperCase();
const parsed = JSON.parse(raw);
if (!Array.isArray(parsed)) throw new Error('A exportação precisa ser um array JSON.');
if (parsed.length !== 59) throw new Error(`Esperados 59 documentos; encontrados ${parsed.length}.`);

parsed.forEach(validateDocument);
const normalized = parsed.map(normalizeExtendedJson);
const userIds = [...new Set(normalized.map((document) => document.userId))];
if (!userIds.includes(expectedFirebaseUid)) throw new Error('O Firebase UID esperado não foi encontrado.');

const newestByMonth = new Map();
for (const document of normalized) {
  const current = newestByMonth.get(document.monthId);
  if (!current || new Date(document.updatedAt) > new Date(current.updatedAt)) {
    newestByMonth.set(document.monthId, document);
  }
}

const selected = [...newestByMonth.values()].sort((a, b) => a.monthId.localeCompare(b.monthId));
if (selected.length !== 30) throw new Error(`Esperados 30 meses consolidados; encontrados ${selected.length}.`);

const entryCounts = selected.reduce(
  (counts, document) => ({
    expenses: counts.expenses + (Array.isArray(document.expenses) ? document.expenses.length : 0),
    extraIncomes: counts.extraIncomes + (Array.isArray(document.extraIncomes) ? document.extraIncomes.length : 0),
    piggyBank: counts.piggyBank + (Array.isArray(document.piggyBank) ? document.piggyBank.length : 0),
    investments: counts.investments + (Array.isArray(document.investments) ? document.investments.length : 0),
  }),
  { expenses: 0, extraIncomes: 0, piggyBank: 0, investments: 0 },
);

const runId = randomUUID();
const sql = [];
sql.push('-- DalciosPay - importação financeira gerada localmente');
sql.push(`-- Origem SHA-256: ${sourceHash}`);
sql.push(`-- Documentos lidos: ${normalized.length}; meses consolidados: ${selected.length}`);
sql.push('SET NAMES utf8mb4;');
sql.push('SET time_zone = "+00:00";');
sql.push('START TRANSACTION;');
sql.push('');
sql.push('SET @dalcios_user_id := (SELECT id FROM app_users WHERE email = ' + sqlUtf8(adminEmail) + ' LIMIT 1);');
sql.push("SET @missing_user := IF(@dalcios_user_id IS NULL, 1, 0);");
sql.push("INSERT INTO migration_runs (run_id, source_system, status, records_read, records_written, records_skipped, summary)");
sql.push(`VALUES (${sqlUtf8(runId)}, 'mongodb', 'started', ${normalized.length}, 0, 0, ${sqlUtf8(JSON.stringify({ sourceHash, selectedMonths: selected.length }))});`);
sql.push('');

for (const legacyUserId of userIds) {
  sql.push('INSERT IGNORE INTO legacy_user_mappings (user_id, source_system, legacy_user_id)');
  sql.push(`SELECT @dalcios_user_id, 'mongodb', ${sqlUtf8(legacyUserId)} FROM DUAL WHERE @dalcios_user_id IS NOT NULL;`);
}

for (const document of selected) {
  const objectId = normalizeExtendedJson(document._id) || `${document.userId}:${document.monthId}`;
  const expenses = JSON.stringify(document.expenses ?? []);
  const extraIncomes = JSON.stringify(document.extraIncomes ?? []);
  const piggyBank = JSON.stringify(document.piggyBank ?? []);
  const investments = JSON.stringify(document.investments ?? []);
  const updatedAt = new Date(document.updatedAt).toISOString().slice(0, 23).replace('T', ' ');
  const salary = Number(document.salary ?? 0).toFixed(2);

  sql.push('INSERT INTO financial_months');
  sql.push('  (user_id, month_id, salary, expenses, extra_incomes, piggy_bank, investments, legacy_source, legacy_record_id, source_updated_at)');
  sql.push('SELECT');
  sql.push(`  @dalcios_user_id, '${document.monthId}', ${salary},`);
  sql.push(`  ${sqlUtf8(expenses)}, ${sqlUtf8(extraIncomes)}, ${sqlUtf8(piggyBank)}, ${sqlUtf8(investments)},`);
  sql.push(`  'mongodb', ${sqlUtf8(objectId)}, '${updatedAt}'`);
  sql.push('FROM DUAL WHERE @dalcios_user_id IS NOT NULL');
  sql.push('ON DUPLICATE KEY UPDATE');
  sql.push('  salary = VALUES(salary),');
  sql.push('  expenses = VALUES(expenses),');
  sql.push('  extra_incomes = VALUES(extra_incomes),');
  sql.push('  piggy_bank = VALUES(piggy_bank),');
  sql.push('  investments = VALUES(investments),');
  sql.push('  legacy_source = VALUES(legacy_source),');
  sql.push('  legacy_record_id = VALUES(legacy_record_id),');
  sql.push('  source_updated_at = VALUES(source_updated_at);');
}

sql.push('');
sql.push('UPDATE migration_runs');
sql.push(`SET status = IF(@missing_user = 0, 'completed', 'failed'), records_written = IF(@missing_user = 0, ${selected.length}, 0), finished_at = UTC_TIMESTAMP(6)`);
sql.push(`WHERE run_id = ${sqlUtf8(runId)};`);
sql.push('');
sql.push('COMMIT;');
sql.push('');
sql.push('SELECT');
sql.push('  COUNT(*) AS imported_months,');
sql.push('  MIN(month_id) AS first_month,');
sql.push('  MAX(month_id) AS last_month,');
sql.push('  SUM(JSON_LENGTH(expenses)) AS expense_entries,');
sql.push('  SUM(JSON_LENGTH(extra_incomes)) AS extra_income_entries,');
sql.push('  SUM(JSON_LENGTH(piggy_bank)) AS piggy_bank_entries,');
sql.push('  SUM(JSON_LENGTH(investments)) AS investment_entries');
sql.push('FROM financial_months WHERE user_id = @dalcios_user_id;');

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${sql.join('\n')}\n`, 'utf8');

process.stdout.write(JSON.stringify({
  input: path.basename(inputPath),
  output: path.basename(outputPath),
  sourceHash,
  documentsRead: normalized.length,
  uniqueLegacyUsers: userIds.length,
  monthsSelected: selected.length,
  firstMonth: selected[0].monthId,
  lastMonth: selected.at(-1).monthId,
  entryCounts,
}, null, 2));
