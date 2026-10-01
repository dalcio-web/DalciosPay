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
      mongodb: { configured: false, connected: false },
      supabase: { configured: true, connected: true },
      activeDb: 'supabase'
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

  async getActiveDb(): Promise<'mongodb' | 'supabase'> {
    const status = await getStatus();
    return status.activeDb;
  },

  async getAllMonthsData(userId: string): Promise<{ [key: string]: MonthData }> {
    const status = await getStatus();
    console.log(`[dbService] Fetching all months data using: ${status.activeDb}`);
    
    if (status.activeDb === 'mongodb') {
      try {
        const mongoData = await mongoService.getAllMonthsData(userId);
        
        // If MongoDB contains monthly data, return them immediately
        if (Object.keys(mongoData).length > 0) {
          console.log(`[dbService] Loaded ${Object.keys(mongoData).length} months successfully from MongoDB.`);
          return mongoData;
        }

        // MongoDB is the active database but it's empty! 
        // Let's check if there is data in Supabase that we should automatically migrate
        if (status.supabase?.configured && status.supabase?.connected) {
          console.log('[dbService] MongoDB is configured but empty. Checking if Supabase contains old records to migrate...', userId);
          const supabaseData = await supabaseService.getAllMonthsData(userId);
          
          if (Object.keys(supabaseData).length > 0) {
            console.log(`[dbService] Found ${Object.keys(supabaseData).length} months in Supabase. Migrating to MongoDB automatically...`);
            try {
              await mongoService.migrateAll(userId, supabaseData);
              console.log('[dbService] Automated MongoDB migration succeeded!');
              return supabaseData;
            } catch (migrateErr: any) {
              console.error('[dbService] Automated migration failed, showing Supabase data as fallback:', migrateErr.message);
              return supabaseData;
            }
          }
        }

        return mongoData;
      } catch (err) {
        console.warn('[dbService] Mongo fetch failed:', err);
      }
    }
    
    // Default fallback to Supabase only if configured
    if (status.supabase?.configured) {
      return await supabaseService.getAllMonthsData(userId);
    }

    return {};
  },

  async saveMonthData(userId: string, monthId: string, data: MonthData): Promise<void> {
    const status = await getStatus();
    console.log(`[dbService] Saving month data (${monthId}) using: ${status.activeDb}`);

    if (status.activeDb === 'mongodb') {
      try {
        return await mongoService.saveMonthData(userId, monthId, data);
      } catch (err: any) {
        console.error('[dbService] Mongo save failed:', err.message);
        throw err;
      }
    }

    // Default to Supabase if configured
    if (status.supabase?.configured) {
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
