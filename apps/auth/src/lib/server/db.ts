import { Surreal } from 'surrealdb';
import { env } from '$env/dynamic/private';

// Validate environment variables
// SURREALDB_* is also understood by SurrealKit, keeping application and schema
// commands pointed at the same database. The short names remain supported while
// existing local environments migrate.
const url = env.SURREALDB_HOST || env.SURREAL_URL || 'ws://127.0.0.1:8000/rpc';
const namespace = env.SURREALDB_NAMESPACE || env.SURREAL_NS || 'development';
const database = env.SURREALDB_NAME || env.SURREAL_DB || 'main';
const username = env.SURREALDB_USER || env.SURREAL_USER || 'root';
const password = env.SURREALDB_PASSWORD || env.SURREAL_PASS || 'root';

// Create a singleton instance
export const db = new Surreal();

let isConnected = false;

export async function connectDb() {
  if (isConnected) return db;

  try {
    await db.connect(url);
    await db.signin({
      username,
      password,
    });
    await db.use({ namespace, database });
    isConnected = true;
    console.log(`Connected to SurrealDB at ${url} (ns: ${namespace}, db: ${database})`);
    return db;
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    throw error;
  }
}
