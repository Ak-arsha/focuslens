// Client-side IndexedDB persistence for FocusLens session history
// 100% on-device storage. No external servers or telemetry.

const DB_NAME = 'focuslens_db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('avgScore', 'avgScore', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a completed session to IndexedDB with localStorage fallback
 */
export async function saveSessionToDB(sessionData) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(sessionData);

      req.onsuccess = () => {
        // Also sync to localStorage as redundancy
        try {
          const raw = localStorage.getItem('focuslens:history_v2') || '[]';
          const list = JSON.parse(raw);
          const filtered = list.filter((s) => s.id !== sessionData.id);
          filtered.unshift(sessionData);
          localStorage.setItem('focuslens:history_v2', JSON.stringify(filtered.slice(0, 50)));
        } catch {
          // ignore localStorage quota errors
        }
        resolve(sessionData);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage:', err);
    try {
      const raw = localStorage.getItem('focuslens:history_v2') || '[]';
      const list = JSON.parse(raw);
      list.unshift(sessionData);
      localStorage.setItem('focuslens:history_v2', JSON.stringify(list.slice(0, 50)));
      return sessionData;
    } catch {
      return sessionData;
    }
  }
}

/**
 * Retrieve all sessions from IndexedDB sorted newest first
 */
export async function getAllSessionsFromDB() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result || [];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to localStorage:', err);
    try {
      const raw = localStorage.getItem('focuslens:history_v2') || '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}

/**
 * Delete a session from IndexedDB
 */
export async function deleteSessionFromDB(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => {
        try {
          const raw = localStorage.getItem('focuslens:history_v2') || '[]';
          const list = JSON.parse(raw).filter((s) => s.id !== id);
          localStorage.setItem('focuslens:history_v2', JSON.stringify(list));
        } catch {}
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, falling back to localStorage:', err);
    try {
      const raw = localStorage.getItem('focuslens:history_v2') || '[]';
      const list = JSON.parse(raw).filter((s) => s.id !== id);
      localStorage.setItem('focuslens:history_v2', JSON.stringify(list));
    } catch {}
    return true;
  }
}

/**
 * Export all sessions as a downloadable JSON string
 */
export async function exportAllSessionsJSON() {
  const sessions = await getAllSessionsFromDB();
  return JSON.stringify({
    app: 'FocusLens',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    totalSessions: sessions.length,
    sessions,
  }, null, 2);
}

/**
 * Import sessions from JSON into IndexedDB
 */
export async function importSessionsJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const sessions = Array.isArray(parsed) ? parsed : (parsed.sessions || []);
    for (const session of sessions) {
      if (session && session.id) {
        await saveSessionToDB(session);
      }
    }
    return sessions.length;
  } catch (err) {
    console.error('Failed to import sessions:', err);
    throw err;
  }
}
