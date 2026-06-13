/**
 * @fileoverview Drizzle ORM client singleton.
 * Uses @vercel/postgres for Vercel-native connection pooling.
 * The POSTGRES_URL env var must be set in .env.local (dev) or Vercel dashboard (prod).
 */
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

/**
 * Singleton Drizzle database client.
 * Import this anywhere server-side to query the database.
 * Never import in client components or pages — only in Server Components and API routes.
 */
export const db = drizzle(sql, { schema });

export type DB = typeof db;
