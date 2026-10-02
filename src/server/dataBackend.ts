export type DataBackend = 'mariadb' | 'mongodb' | 'supabase';

export function getSelectedDataBackend(): DataBackend {
  const value = (process.env.DATA_BACKEND || 'mongodb').trim().toLowerCase();
  if (value === 'mariadb' || value === 'mongodb' || value === 'supabase') return value;
  throw new Error(`DATA_BACKEND inválido: ${value}`);
}

export function isMariaDbConfigured(): boolean {
  return ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].every(
    (name) => Boolean(process.env[name]?.trim()),
  );
}
