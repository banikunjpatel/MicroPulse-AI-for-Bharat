import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _client: postgres.Sql<{}> | undefined;
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function initDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn("[DB] DATABASE_URL not set, database will not be available");
    return undefined;
  }

  try {
    new URL(connectionString);
  } catch {
    console.warn("[DB] DATABASE_URL is invalid, database will not be available");
    return undefined;
  }

  _client = postgres(connectionString, { max: 1 });
  _db = drizzle(_client, { schema });
  
  return _db;
}

const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = initDb();
    if (!instance) {
      throw new Error("Database not available. Check DATABASE_URL configuration.");
    }
    return (instance as any)[prop];
  }
});

export { db };
