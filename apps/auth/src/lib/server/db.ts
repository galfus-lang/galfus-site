import { Surreal } from 'surrealdb';

// Singleton instance to prevent multiple connections in dev mode
const db = new Surreal();

let isConnected = false;

export async function getDb() {
  if (!isConnected) {
    // Note: Use env variables for connection in production!
    await db.connect('ws://127.0.0.1:8000/rpc', {
      namespace: 'galfus',
      database: 'auth',
    });

    // In production, we'd sign in with a root/namespace user or token
    // await db.signin({ username: 'root', password: 'root' });

    isConnected = true;
  }
  return db;
}
