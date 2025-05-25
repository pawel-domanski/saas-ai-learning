import { db } from './drizzle';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runSqlMigrations() {
  console.log('🔄 Running SQL migrations...');
  
  const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations');
  
  // List of SQL migrations to run
  const sqlMigrations = [
    'add_metadata_to_activity_logs.sql',
    'add_missing_columns.sql',
    'update_challenges_column.sql'
  ];
  
  for (const migrationFile of sqlMigrations) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    
    if (fs.existsSync(migrationPath)) {
      console.log(`Running SQL migration: ${migrationFile}`);
      
      try {
        const sqlContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Split the SQL file into individual statements
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        // Execute each statement
        for (const statement of statements) {
          if (statement.trim()) {
            await db.execute(sql.raw(statement));
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        }
        
        console.log(`✅ Completed migration: ${migrationFile}`);
      } catch (error) {
        console.error(`❌ Error in migration ${migrationFile}:`, error);
        // Continue with other migrations
      }
    } else {
      console.warn(`⚠️ Migration file not found: ${migrationPath}`);
    }
  }
  
  console.log('✅ SQL migrations completed');
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runSqlMigrations()
    .then(() => {
      console.log('All migrations completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { runSqlMigrations }; 