import { defineConfig } from 'drizzle-kit';
export default defineConfig({
    dbCredentials: {
        url:
            process.env.DATABASE_URL ??
            'postgres://postgres:postgres@localhost:5432/postgres',
    },
    dialect: 'postgresql',
    out: './drizzle',
    schema: './src/server/db/schema.ts',
});
