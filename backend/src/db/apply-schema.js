import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

try {
  const schema = await readFile(fileURLToPath(new URL('../../database/schema.sql', import.meta.url)), 'utf8');
  await pool.query(schema);
  console.log('PostgreSQL schema applied successfully.');
} finally { await pool.end(); }
