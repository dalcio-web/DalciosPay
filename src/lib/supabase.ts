import { createClient } from '@supabase/supabase-js';

// Support both standard Vite names and the specific ones provided by the user
const cleanUrl = (val: any): string | null => {
  if (!val || typeof val !== 'string') return null;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (s === '' || s === 'undefined' || s === 'null' || !s.startsWith('http')) {
    return null;
  }
  return s;
};

const cleanKey = (val: any): string | null => {
  if (!val || typeof val !== 'string') return null;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (s === '' || s === 'undefined' || s === 'null') {
    return null;
  }
  return s;
};

let supabaseInstance: any = null;

// Initialize from global window if available, then import.meta.env, then placeholder
const getActiveUrl = () => {
  return (window as any).SUPABASE_URL ||
         cleanUrl(import.meta.env.VITE_SUPABASE_URL) ||
         cleanUrl(import.meta.env.NEXT_PUBLIC_SUPABASE_URL) ||
         'https://placeholder.supabase.co';
};

const getActiveKey = () => {
  return (window as any).SUPABASE_ANON_KEY ||
         cleanKey(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
         cleanKey(import.meta.env.VITE_SUPABASE_ANO) || // handles user's typo in Secrets UI
         cleanKey(import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
         'placeholder-key';
};

// Async initialization function to be run before App bootstrap
export async function initSupabase() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('API config non-ok response');
    const config = await res.json();
    const url = cleanUrl(config.supabaseUrl);
    const key = cleanKey(config.supabaseAnonKey);
    
    if (url && key) {
      console.log("[Supabase Config] Loaded successfully from backend:", url);
      (window as any).SUPABASE_URL = url;
      (window as any).SUPABASE_ANON_KEY = key;
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return;
    }
  } catch (err: any) {
    console.warn("[Supabase Config] Dynamic load skipped, using static values:", err.message);
  }

  // Fallback to static values if endpoint fails or returns empty
  const url = getActiveUrl();
  const key = getActiveKey();
  console.log("[Supabase Config] Fallback initialization:", url);
  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

// Export a Proxy that always delegates to the instantiated client
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!supabaseInstance) {
      const url = getActiveUrl();
      const key = getActiveKey();
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    
    const value = supabaseInstance[prop];
    if (typeof value === 'function') {
      return value.bind(supabaseInstance);
    }
    
    // If accessing a nested service like auth or storage, we proxy it as well 
    // to dynamically resolve methods on the fresh instance.
    if (value && typeof value === 'object') {
      return new Proxy(value, {
        get(subTarget, subProp) {
          const freshInstance = supabaseInstance || target;
          const freshSubObject = freshInstance[prop];
          if (!freshSubObject) return undefined;
          
          const subValue = freshSubObject[subProp];
          if (typeof subValue === 'function') {
            return subValue.bind(freshSubObject);
          }
          return subValue;
        }
      });
    }
    
    return value;
  }
});
