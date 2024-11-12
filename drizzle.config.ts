import * as dotenv from 'dotenv';
import {defineConfig} from 'drizzle-kit';

dotenv.config();

export default defineConfig({
    out: './src/core/infrastructure/database',
    schema: './src/core/infrastructure/database/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.POSTGRES_URL! + '?schema=public',
    },
    verbose: true,
    strict: true
});