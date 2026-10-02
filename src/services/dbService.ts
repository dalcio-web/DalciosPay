import { supabaseService } from './supabaseService';
import { mongoService, DbStatus } from './mongoService';
import { MonthData } from '../types';

let cachedStatus: DbStatus | null = null;
let lastStatusFetch = 0;

// Re-check every 15 seconds to remain dynamic
async function getStatus(): Promise<DbStatus> {
  const now = Date.now();
  if (cachedStatus && (now - lastStatusFetch < 15000)) {
    return cachedStatus;
  }
  try {
    const status = await mongoService.getDbStatus();
    cachedStatus = status;
    lastStatusFetch = now;
    return status;
  } catch (err) {
    return {
      mariadb: { configured: false, connected: false },
      mongodb: { configured: false, connected: false },
      supabase: { configured: false, connected: false },
      activeDb: 'mongodb'
    };
  }
}

export const dbService = {
  // Clear status cache (e.g. after a migration or configuration reload)
  clearCache() {
    cachedStatus = null;
    lastStatusFetch = 0;
  },

  async getDbStatus(): Promise<DbStatus> {
    return await getStatus();
  },

  async getActiveDb(): Promise<'mariadb' | 'mongodb' | 'supabase'> {
    const status = await getStatus();
    return status.activeDb;
  },

  async getAllMonthsData(userId: string): Promise<{ [key: string]: MonthData }> {
    const status = await getStatus();
    console.log(`[dbService] Fetching all months data using: ${status.activeDb}`);
    
    if (status.activeDb === 'mongodb' || status.activeDb === 'mariadb') {
      return await mongoService.getAllMonthsData(userId);
    }
    
    // Default fallback to Supabase only if configured
    if (status.activeDb === 'supabase' && status.supabase?.configured) {
      return await supabaseService.getAllMonthsData(userId);
    }

    return {};
  },

  async saveMonthData(userId: string, monthId: string, data: MonthData): Promise<void> {
    const status = await getStatus();
    console.log(`[dbService] Saving month data (${monthId}) using: ${status.activeDb}`);

    if (status.activeDb === 'mongodb' || status.activeDb === 'mariadb') {
      return await mongoService.saveMonthData(userId, monthId, data);
    }

    // Default to Supabase if configured
    if (status.activeDb === 'supabase' && status.supabase?.configured) {
      return await supabaseService.saveMonthData(userId, monthId, data);
    }
  },

  // Perform full migration of structured data from Supabase to MongoDB
  async migrateToMongoDB(userId: string, currentMonthsState: { [key: string]: MonthData }): Promise<string> {
    console.log('[dbService] Migrating all months data to MongoDB...');
    const resultMessage = await mongoService.migrateAll(userId, currentMonthsState);
    this.clearCache(); // Reset database status so MongoDB will immediately take over as primary
    return resultMessage;
  }
};
