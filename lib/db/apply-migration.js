import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function applyMigration() {
  let sql;
  try {
    console.log('Applying migration for quiz_results table only...');
    
    // Połącz z bazą danych
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL not set');
    }
    
    sql = postgres(connectionString);
    
    // Sprawdź czy tabela quiz_results już istnieje
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'quiz_results'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('Table quiz_results already exists, skipping creation');
      return;
    }
    
    // Utwórz tabelę quiz_results
    console.log('Creating quiz_results table...');
    await sql`
      CREATE TABLE "quiz_results" (
        "id" serial PRIMARY KEY NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "email" varchar(255),
        "registered_email" varchar(255),
        "user_id" integer,
        "current_step" integer,
        "last_completed_step" integer,
        "score" integer,
        "answers" json,
        "step_1_answer" text,
        "step_2_answer" text,
        "step_3_answer" text,
        "step_4_answer" text,
        "step_5_answer" text,
        "newsletter_opted_in" boolean DEFAULT false,
        "terms_accepted" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        "time_spent_seconds" integer,
        "referrer" text,
        "utm_source" text,
        "utm_medium" text,
        "utm_campaign" text,
        "browser" text,
        "device" text,
        CONSTRAINT "quiz_results_session_id_unique" UNIQUE("session_id")
      );
    `;
    
    console.log('Migration successfully applied!');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    if (sql) {
      await sql.end();
      console.log('Database connection closed');
    }
  }
}

applyMigration(); 