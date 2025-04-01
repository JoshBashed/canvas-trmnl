import { drizzle } from 'drizzle-orm/node-postgres';
import { appEnv } from '@/server/appEnv.ts';

export const db = drizzle(appEnv.databaseUrl);
