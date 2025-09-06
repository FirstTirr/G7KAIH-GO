// Script untuk menjalankan database migration
import { readFileSync } from 'fs'
import { join } from 'path'
import { createAdminClient } from '../src/utils/supabase/admin.js'

async function runMigration() {
  try {
    const adminClient = await createAdminClient()
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'database_migrations', 'create_aktivitas_field_files_table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('Running migration: create_aktivitas_field_files_table.sql')
    console.log('SQL:', migrationSQL.substring(0, 200) + '...')
    
    // Execute the migration
    const { data, error } = await adminClient.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }
    
    console.log('Migration completed successfully!')
    console.log('Result:', data)
    
  } catch (err) {
    console.error('Error running migration:', err)
    process.exit(1)
  }
}

runMigration()
