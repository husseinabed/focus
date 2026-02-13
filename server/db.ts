import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const connectionString = 'postgresql://postgres:[Newyork1988*alma]@db.nlfaxqnsgogwvuyxvfgt.supabase.co:5432/postgres'
if (!connectionString) throw new Error('Missing DATABASE_URL')

const pool = new Pool({ connectionString })
export const db = drizzle(pool)
