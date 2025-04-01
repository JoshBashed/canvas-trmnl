import { appEnv } from '@/server/appEnv.ts';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(appEnv.databaseUrl);
