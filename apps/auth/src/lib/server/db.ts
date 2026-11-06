import { Surreal } from 'surrealdb';
import { env } from '$env/dynamic/private';

// Validate environment variables
// SURREALDB_* is also understood by SurrealKit, keeping application and schema
// commands pointed at the same database. The short names remain supported while
// existing local environments migrate.
const url = env.SURREAL_URL || 'ws://127.0.0.1:8000/rpc';
const namespace = env.SURREAL_NS || 'development';
const database = env.SURREAL_DB || 'main';
const username = env.SURREAL_USER || 'root';
const password = env.SURREAL_PASS || 'root';

// Create a singleton instance
export const db = new Surreal();

let connectPromise: Promise<Surreal> | null = null;

export async function connectDb(): Promise<Surreal> {
  if (db.status === 'connected') return db;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      await db.connect(url, {
        namespace,
        database,
        authentication: {
          username,
          password,
        },
      });
      return db;
    } catch (error) {
      console.error('Failed to connect to SurrealDB:', error);
      throw error;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}
