import { auth } from '../lib/firebase';
import { MonthData } from '../types';

export interface DbStatus {
  mariadb: {
    configured: boolean;
    connected: boolean;
  };
  mongodb: {
    configured: boolean;
    connected: boolean;
  };
  supabase: {
    configured: boolean;
    connected: boolean;
  };
  activeDb: 'mariadb' | 'mongodb' | 'supabase';
}

// Fetch the verified Firebase session token used by the backend.
async function getAuthHeaders(): Promise<HeadersInit> {
  let token = '';
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn('[MongoService] Failed to retrieve Firebase ID token:', err);
    }
  }

  if (!token) throw new Error('Sessão Firebase não encontrada. Entre novamente.');

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Helper to safely parse server errors, avoiding JSON parse crashes when HTML is returned
async function handleFetchError(response: Response, defaultMessage: string): Promise<never> {
  const text = await response.text().catch(() => '');
  let errorData: any = {};
  try {
    errorData = JSON.parse(text);
  } catch (err) {
    // Slice potential HTML response to avoid over-cluttering the front-end alert
    const cleanSnippet = text.replace(/<[^>]*>/g, '').trim().substring(0, 150);
    throw new Error(`Erro do servidor (HTTP ${response.status}): ${cleanSnippet || defaultMessage}`);
  }
  throw new Error(errorData.error || defaultMessage);
}

export const mongoService = {
  // Check backend integration status
  async getDbStatus(): Promise<DbStatus> {
    try {
      const response = await fetch('/api/db-status');
      if (!response.ok) {
        throw new Error('Falha ao checar status do banco de dados.');
      }
      return await response.json();
    } catch (err) {
      console.error('[MongoService] getDbStatus failed:', err);
      return {
        mariadb: { configured: false, connected: false },
        mongodb: { configured: false, connected: false },
        supabase: { configured: false, connected: false },
        activeDb: 'mongodb'
      };
    }
  },

  // Get all months from the financial backend selected by DATA_BACKEND.
  async getAllMonthsData(userId: string): Promise<{ [key: string]: MonthData }> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/months', {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      await handleFetchError(response, 'Erro ao carregar os dados financeiros.');
    }

    return await response.json();
  },

  // Save a specific month to the selected financial backend.
  async saveMonthData(userId: string, monthId: string, data: MonthData): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/months/${monthId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleFetchError(response, `Erro ao salvar mês ${monthId} no MongoDB.`);
    }
  },

  // Migrate all local months to MongoDB
  async migrateAll(userId: string, months: { [key: string]: MonthData }): Promise<string> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/migrate-all', {
      method: 'POST',
      headers,
      body: JSON.stringify({ months })
    });

    if (!response.ok) {
      await handleFetchError(response, 'Falha ao migrar os registros.');
    }

    const resJson = await response.json();
    return resJson.message || 'Dados migrados!';
  }
};
