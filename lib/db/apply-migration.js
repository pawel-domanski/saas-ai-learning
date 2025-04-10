import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function applyMigration() {
  try {
    console.log('Applying migration for user_progress table...');
    
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'db', 'migrations', '0001_faulty_grey_gargoyle.sql'),
      'utf8'
    );
    
    // Połącz z bazą danych
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL not set');
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Dzielimy na poszczególne zapytania SQL
    const statements = migrationSql.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 100)}...`);
        await client.query(statement);
      }
    }
    
    console.log('Migration successfully applied!');
    await client.end();
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration(); 