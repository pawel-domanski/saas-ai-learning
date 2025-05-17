#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const migrationsDir = path.join(__dirname, 'migrations');

// Function to run a specific SQL file
function runSqlFile(filePath) {
  console.log(`Running SQL file: ${filePath}`);
  
  // Get database connection string from env
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
  }

  try {
    // Use PSQL to run the SQL file
    execSync(`psql ${databaseUrl} -f "${filePath}"`, { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log(`✅ Successfully executed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error executing ${filePath}:`, error.message);
    throw error;
  }
}

// Main function to run migrations
async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  // List of migrations to run
  const migrations = [
    'add_metadata_to_activity_logs.sql',
    'add_missing_columns.sql',
    'update_challenges_column.sql'
  ];
  
  // Run each migration
  for (const migrationFile of migrations) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    if (fs.existsSync(migrationPath)) {
      runSqlFile(migrationPath);
    } else {
      console.warn(`⚠️ Migration file not found: ${migrationPath}`);
    }
  }
  
  console.log('✅ All migrations completed successfully');
}

// Run the main function
runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}); 