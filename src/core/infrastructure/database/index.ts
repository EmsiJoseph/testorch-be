import {drizzle} from "drizzle-orm/vercel-postgres";
import {createPool} from "@vercel/postgres";
import {DrizzlePostgreSQLAdapter} from "@lucia-auth/adapter-drizzle";

import * as schema from "./schema";


// Ensure that the POSTGRES_URL is loaded correctly
const postgresUrl = process.env.POSTGRES_URL;
// const postgresUrl = configServce.get('POSTGRES_URL');

if (!postgresUrl) {
    throw new Error("Missing POSTGRES_URL environment variable");
}

// Create the client using the connection string
const client = createPool({
    connectionString: postgresUrl,
});

export const db = drizzle(client, {schema});

// Setup lucia adapter
export const luciaAdapter = new DrizzlePostgreSQLAdapter(db, schema.sessions, schema.users);
